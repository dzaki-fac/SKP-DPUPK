import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const plans = await prisma.performancePlan.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { customTargets: true } });
  return Response.json(plans.map(p => ({
    id: p.id, parentId: p.parentId, skpPeriodId: p.skpPeriodId, createdBy: p.createdBy, assignedTo: p.assignedTo,
    title: p.title, target: p.target, progress: p.progress, createdAt: (p as any).createdAt, plannedDate: (p as any).plannedDate ?? null, plannedTime: (p as any).plannedTime ?? null,
    allowSelfClaim: Boolean((p as any).allowSelfClaim ?? false),
    customTargets: (p as any).customTargets?.map((t:any) => ({ id: t.id, name: t.name, value: t.value, unit: t.unit })) ?? []
  })));
}

const customTargetSchema = z.object({
  name: z.string().min(1).max(50),
  value: z.coerce.string().min(1),
  unit: z.string().min(1).max(20)
});

const createSchema = z.object({
  parentId: z.string().nullable().optional(), skpPeriodId: z.string().min(1), createdBy: z.string().min(1), assignedTo: z.string().min(1),
  title: z.string().min(3), target: z.coerce.string().min(1),
  progress: z.coerce.number().min(0).max(150).optional().default(0), log: z.boolean().optional(),
  customTargets: z.array(customTargetSchema).optional(),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  plannedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().nullable(),
  allowSelfClaim: z.coerce.boolean().optional().default(false),
  createdAt: z.string().optional()
}).passthrough();

// Apakah subId adalah bawahan (langsung/tidak langsung) dari supId? Telusuri rantai supervisor ke atas.
async function isSubordinateOf(subId: string, supId: string): Promise<boolean> {
  if (!subId || !supId || subId === supId) return false;
  let cur = await prisma.employee.findUnique({ where: { id: subId }, select: { supervisorId: true } });
  const seen = new Set<string>();
  while (cur?.supervisorId && !seen.has(cur.supervisorId)) {
    if (cur.supervisorId === supId) return true;
    seen.add(cur.supervisorId);
    cur = await prisma.employee.findUnique({ where: { id: cur.supervisorId }, select: { supervisorId: true } });
  }
  return false;
}

export async function POST(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // Enforce: only atasan can create for bawahan — check assignedTo is subordinate of creator or self
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    console.error("POST /api/plans validation failed", parsed.error.flatten(), "body:", body);
    return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  // Semua pegawai boleh membuat tugas — tidak ada batas role, cukup pastikan pembuat adalah pemilik token (atau admin)
  if (b.createdBy !== payload.id && payload.role !== "admin" && payload.role !== "pimpinan_1") {
    // Izinkan staf/pimpinan membuat untuk dirinya sendiri; admin/pimpinan_1 boleh buat untuk siapa saja
    // Jika ingin membuat untuk orang lain tanpa izin admin, tolak
    // Tapi delegasi (child) tetap mengharuskan createdBy == pelimpah, jadi tetap lolos
    return Response.json({ error: "Hanya pemilik akun yang dapat membuat atas namanya" }, { status: 403 });
  }
  // Validasi porsi + izin pembuatan anak:
  // boleh jika pemilik induk, admin/direktur, atau atasan dari pemilik (kelola ke bawah).
  // Selain itu hanya boleh pengambilan mandiri untuk diri sendiri (induk harus terbuka).
  if (b.parentId) {
    const parent = await prisma.performancePlan.findUnique({ where: { id: b.parentId } });
    if (parent) {
      const siblings = await prisma.performancePlan.findMany({ where: { parentId: b.parentId } });
      const siblingsTotal = siblings.reduce((s,p)=> s + (parseFloat(String(p.target).replace(",","."))||0),0);
      const newVal = parseFloat(String(b.target).replace(",","."))||0;
      const parentTarget = parseFloat(String(parent.target).replace(",","."))||0;
      if (parentTarget>0 && siblingsTotal + newVal > parentTarget) {
        return Response.json({ error: `Total porsi delegasi penerima (${siblingsTotal}+${newVal}=${siblingsTotal+newVal}) melebihi target induk (${parentTarget}). Kurangi porsi.` }, { status: 400 });
      }
      const isPrivileged = payload.role === "admin" || payload.role === "pimpinan_1";
      const ownerIds = [(parent as any).createdBy, (parent as any).assignedTo].filter(Boolean) as string[];
      const isParentOwner = ownerIds.includes(payload.id);
      // Atasan dari pemilik boleh melimpahkan ke bawah (seperti perilaku lama)
      let isSuperior = false;
      if (!isPrivileged && !isParentOwner) {
        for (const oid of ownerIds) {
          if (await isSubordinateOf(oid, payload.id)) { isSuperior = true; break; }
        }
      }
      if (!isPrivileged && !isParentOwner && !isSuperior) {
        // Bukan pemilik/atasan → hanya boleh jika induk mengizinkan pengambilan mandiri + pengambil adalah bawahan pemilik
        const parentOpen = Boolean((parent as any).allowSelfClaim);
        if (!parentOpen) {
          return Response.json({ error: "Anda belum mengambil rencana ini — ambil dulu sebelum mendelegasikan" }, { status: 403 });
        }
        // Self-claim wajib untuk diri sendiri
        if (b.assignedTo !== payload.id || b.createdBy !== payload.id) {
          return Response.json({ error: "Pengambilan mandiri hanya untuk diri sendiri" }, { status: 403 });
        }
        // Cegah ambil ganda
        const already = siblings.some(s => (s as any).assignedTo === payload.id);
        if (already) {
          return Response.json({ error: "Anda sudah mengambil rencana ini" }, { status: 400 });
        }
        // Pastikan pengambil adalah bawahan dari pemilik induk (telusuri rantai supervisor)
        let isSub = false;
        for (const oid of ownerIds) {
          if (await isSubordinateOf(payload.id, oid)) { isSub = true; break; }
        }
        if (!isSub) {
          return Response.json({ error: "Hanya bawahan pemilik rencana yang boleh mengambil mandiri" }, { status: 403 });
        }
      }
    }
  }
  try {
    // Rincian target (seperti form realisasi) — boleh untuk semua pegawai, tanpa batas jumlah
    const plan = await prisma.performancePlan.create({ data: {
      parentId: b.parentId ?? null, skpPeriodId: b.skpPeriodId, createdBy: b.createdBy, assignedTo: b.assignedTo,
      title: b.title, target: String(b.target), progress: Number(b.progress) || 0,
      createdAt: b.createdAt ?? new Date().toISOString().slice(0,16).replace("T"," "),
      plannedDate: b.plannedDate ?? null, plannedTime: b.plannedTime ?? null,
      allowSelfClaim: b.parentId ? false : Boolean((b as any).allowSelfClaim ?? false)
    }});
    // Buat custom targets jika ada (hanya untuk direktur)
    if (b.customTargets && b.customTargets.length > 0) {
      for (const ct of b.customTargets) {
        await prisma.planTarget.create({
          data: { planId: plan.id, name: ct.name.trim(), value: String(ct.value).trim(), unit: ct.unit.trim() }
        }).catch(()=>{});
      }
    }
    if (b.log !== false) {
      await prisma.activityLog.create({ data: {
        userId: b.createdBy, userName: (await prisma.employee.findUnique({ where: { id: b.createdBy } }))?.name?.split(",")[0] ?? "System",
        action: "Membuat rencana kinerja", description: `Membuat rencana '${b.title}'`, entityType: "performance_plan", entityId: plan.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ")
      }}).catch(()=>{});
    }
    const planWithTargets = await prisma.performancePlan.findUnique({ where: { id: plan.id }, include: { customTargets: true } });
    return Response.json({
      ...plan,
      plannedDate: (planWithTargets as any)?.plannedDate ?? null,
      plannedTime: (planWithTargets as any)?.plannedTime ?? null,
      allowSelfClaim: Boolean((planWithTargets as any)?.allowSelfClaim ?? false),
      createdAt: (planWithTargets as any)?.createdAt,
      customTargets: (planWithTargets as any)?.customTargets?.map((t:any) => ({ id: t.id, name: t.name, value: t.value, unit: t.unit })) ?? []
    }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/plans create failed", e, "body:", b);
    // Prisma FK violation (P2003) -> kemungkinan periode/employee/parent tidak ada
    if (e?.code === "P2003" || e?.cause?.code === "P2003" || String(e?.message).includes("Foreign key")) {
      // cek periode dulu untuk pesan spesifik
      const periodExists = await prisma.skpPeriod.findUnique({ where: { id: b.skpPeriodId } }).catch(()=>null);
      if (!periodExists) return Response.json({ error: `Periode SKP '${b.skpPeriodId}' tidak ditemukan. Pilih periode yang ada.` }, { status: 400 });
      return Response.json({ error: "Gagal membuat rencana: relasi tidak ditemukan (parent/assignee/creator).", details: String(e?.message).slice(0,300) }, { status: 400 });
    }
    return Response.json({ error: "Gagal membuat rencana", details: String(e?.message).slice(0,500) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });
  // Validasi porsi saat update target child
  if (b.target !== undefined) {
    const existing = await prisma.performancePlan.findUnique({ where: { id: b.id } });
    if (existing?.parentId) {
      const parent = await prisma.performancePlan.findUnique({ where: { id: existing.parentId } });
      if (parent) {
        const siblings = await prisma.performancePlan.findMany({ where: { parentId: existing.parentId } });
        const siblingsTotal = siblings.filter(p=>p.id!==b.id).reduce((s,p)=> s + (parseFloat(String(p.target).replace(",","."))||0),0);
        const newVal = parseFloat(String(b.target).replace(",","."))||0;
        const parentTarget = parseFloat(String(parent.target).replace(",","."))||0;
        if (parentTarget>0 && siblingsTotal + newVal > parentTarget) {
          return Response.json({ error: `Total porsi delegasi penerima (${siblingsTotal}+${newVal}) melebihi target induk (${parentTarget})` }, { status: 400 });
        }
      }
    }
  }
  // Toggle Izinkan Pengambilan Mandiri — hanya pemilik (pembuat/pelaksana), admin, atau direktur
  if (b.allowSelfClaim !== undefined) {
    const existing = await prisma.performancePlan.findUnique({ where: { id: b.id } });
    if (!existing) return Response.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    const canToggle = payload.role === "admin" || payload.role === "pimpinan_1"
      || (existing as any).createdBy === payload.id || (existing as any).assignedTo === payload.id;
    if (!canToggle) return Response.json({ error: "Hanya pemilik/admin/direktur dapat mengubah izin pengambilan mandiri" }, { status: 403 });
  }
  // Handle custom targets update — boleh untuk semua pegawai (seperti realisasi)
  if (b.customTargets !== undefined) {
    if (Array.isArray(b.customTargets)) {
      // Validasi
      for (const ct of b.customTargets as any[]) {
        if (!ct.name || String(ct.name).trim().length < 1 || String(ct.name).trim().length > 50) {
          return Response.json({ error: "Nama target kustom minimal 1, maksimal 50 karakter" }, { status: 400 });
        }
        if (!ct.value || String(ct.value).trim().length < 1) {
          return Response.json({ error: "Nilai target kustom wajib" }, { status: 400 });
        }
        if (!ct.unit || String(ct.unit).trim().length < 1 || String(ct.unit).trim().length > 20) {
          return Response.json({ error: "Satuan target kustom minimal 1, maksimal 20 karakter" }, { status: 400 });
        }
      }
      // Hapus yang lama, buat yang baru
      await prisma.planTarget.deleteMany({ where: { planId: b.id } });
      for (const ct of b.customTargets as any[]) {
        await prisma.planTarget.create({
          data: { planId: b.id, name: String(ct.name).trim(), value: String(ct.value).trim(), unit: String(ct.unit).trim() }
        }).catch(()=>{});
      }
    }
  }

  try {
    const updated = await prisma.performancePlan.update({ where: { id: b.id }, data: {
      title: b.title, target: b.target ? String(b.target) : undefined,
      progress: b.progress !== undefined ? Number(b.progress) : undefined,
      plannedDate: b.plannedDate !== undefined ? b.plannedDate : undefined,
      plannedTime: b.plannedTime !== undefined ? b.plannedTime : undefined,
      allowSelfClaim: b.allowSelfClaim !== undefined ? Boolean(b.allowSelfClaim) : undefined
    }});
    const withTargets = await prisma.performancePlan.findUnique({ where: { id: b.id }, include: { customTargets: true } });
    return Response.json({
      ...updated,
      plannedDate: (withTargets as any)?.plannedDate ?? null,
      plannedTime: (withTargets as any)?.plannedTime ?? null,
      allowSelfClaim: Boolean((withTargets as any)?.allowSelfClaim ?? (updated as any)?.allowSelfClaim ?? false),
      createdAt: (withTargets as any)?.createdAt,
      customTargets: (withTargets as any)?.customTargets?.map((t:any) => ({ id: t.id, name: t.name, value: t.value, unit: t.unit })) ?? []
    });
  } catch (e: any) {
    console.error("PATCH /api/plans update failed", e, "body:", b);
    return Response.json({ error: "Gagal memperbarui rencana", details: String(e?.message).slice(0, 500) }, { status: 500 });
  }
}

// DELETE — hapus rencana + seluruh turunannya (cascade down the tree)
export async function DELETE(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });

  const plan = await prisma.performancePlan.findUnique({ where: { id: b.id } });
  if (!plan) return Response.json({ error: "Rencana tidak ditemukan" }, { status: 404 });

  // Hanya pembuat, admin, atau direktur yang boleh hapus
  const canDelete = payload.role === "admin" || payload.role === "pimpinan_1" || plan.createdBy === payload.id;
  if (!canDelete) return Response.json({ error: "Hanya pembuat/admin/direktur dapat menghapus rencana" }, { status: 403 });

  // Kumpulkan semua turunan (BFS parent -> children)
  const all = await prisma.performancePlan.findMany({ select: { id: true, parentId: true } });
  const toDelete = new Set<string>([b.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of all) {
      if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) { toDelete.add(p.id); changed = true; }
    }
  }

  // Realisasi/bukti/penilaian terhapus otomatis (onDelete: Cascade)
  const res = await prisma.performancePlan.deleteMany({ where: { id: { in: [...toDelete] } } });

  await prisma.activityLog.create({
    data: {
      userId: payload.id, userName: payload.name.split(",")[0], action: "Menghapus rencana",
      description: `Menghapus '${plan.title}' beserta ${res.count - 1} turunan`, entityType: "performance_plan", entityId: plan.id,
      createdAt: new Date().toISOString().slice(0,16).replace("T"," ")
    }
  }).catch(()=>{});

  return Response.json({ ok: true, deleted: res.count, ids: [...toDelete] });
}
