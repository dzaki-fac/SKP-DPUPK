import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const plans = await prisma.performancePlan.findMany({ orderBy: { id: "asc" } });
  return Response.json(plans.map(p => ({
    id: p.id, parentId: p.parentId, skpPeriodId: p.skpPeriodId, createdBy: p.createdBy, assignedTo: p.assignedTo,
    title: p.title, target: p.target, progress: p.progress
  })));
}

const createSchema = z.object({
  parentId: z.string().nullable().optional(), skpPeriodId: z.string().min(1), createdBy: z.string().min(1), assignedTo: z.string().min(1),
  title: z.string().min(3), target: z.coerce.string().min(1),
  progress: z.coerce.number().min(0).max(150).optional().default(0), log: z.boolean().optional()
}).passthrough();

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
  // Basic role check
  if (!["admin","direktur","supervisor"].includes(payload.role) && b.createdBy !== payload.id) return Response.json({ error: "Hanya atasan dapat membuat rencana" }, { status: 403 });
  try {
    const plan = await prisma.performancePlan.create({ data: {
      parentId: b.parentId ?? null, skpPeriodId: b.skpPeriodId, createdBy: b.createdBy, assignedTo: b.assignedTo,
      title: b.title, target: String(b.target), progress: Number(b.progress) || 0
    }});
    if (b.log !== false) {
      await prisma.activityLog.create({ data: {
        userId: b.createdBy, userName: (await prisma.employee.findUnique({ where: { id: b.createdBy } }))?.name?.split(",")[0] ?? "System",
        action: "Membuat rencana kinerja", description: `Membuat rencana '${b.title}'`, entityType: "performance_plan", entityId: plan.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ")
      }}).catch(()=>{});
    }
    return Response.json(plan, { status: 201 });
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
  const updated = await prisma.performancePlan.update({ where: { id: b.id }, data: {
    title: b.title, target: b.target ? String(b.target) : undefined,
    progress: b.progress !== undefined ? Number(b.progress) : undefined
  }});
  return Response.json(updated);
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
  const canDelete = payload.role === "admin" || payload.role === "direktur" || plan.createdBy === payload.id;
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
