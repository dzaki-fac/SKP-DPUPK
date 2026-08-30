import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

const mapOut = (x: any) => ({
  id: x.id, planId: x.performancePlanId, title: x.title ?? "Realisasi", value: x.realizationValue,
  description: x.realizationDescription, date: x.realizationDate, time: (x as any).realizationTime ?? "09:00", uploadedBy: x.uploadedBy ?? null
});

function normalizeTime(t: any): string | null {
  if (t === undefined || t === null) return null;
  const s = String(t).trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [hh, mm] = s.split(":").map(Number);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

// Progress plan = (entri langsung + entri semua turunan) / target, cap 150
async function calcPlanProgress(planId: string): Promise<number | null> {
  const plan = await prisma.performancePlan.findUnique({ where: { id: planId }, select: { id: true, target: true } });
  if (!plan) return null;
  const t = parseFloat(String(plan.target).replace(",", ".")) || 0;
  if (t <= 0) return null;

  // kumpulkan semua id turunan (descendant plans)
  const all = await prisma.performancePlan.findMany({ select: { id: true, parentId: true } });
  const descendant = new Set<string>();
  const queue: string[] = all.filter(p => p.parentId === planId).map(p => p.id);
  while (queue.length) {
    const cur = queue.shift()!;
    if (descendant.has(cur)) continue;
    descendant.add(cur);
    all.filter(p => p.parentId === cur).forEach(ch => queue.push(ch.id));
  }
  const viaChildren = await prisma.realization.count({ where: { performancePlanId: { in: [...descendant] } } });
  const direct = await prisma.realization.count({ where: { performancePlanId: planId } });
  return Math.min(150, Math.round(((direct + viaChildren) / t) * 100));
}

// Naikkan recalc ke seluruh induk (parent chain)
async function propagateProgress(planId: string) {
  let cur: string | null = (await prisma.performancePlan.findUnique({ where: { id: planId }, select: { parentId: true } }))?.parentId ?? null;
  while (cur) {
    const np = await calcPlanProgress(cur);
    const parent = await prisma.performancePlan.findUnique({ where: { id: cur }, select: { parentId: true, progress: true } });
    if (!parent) break;
    if (np !== null && parent.progress !== np) {
      await prisma.performancePlan.update({ where: { id: cur }, data: { progress: np } });
    } else if (np === null) break;
    cur = parent.parentId;
  }
}

export async function GET() {
  const r = await prisma.realization.findMany({ orderBy: { realizationDate: "desc" } });
  return Response.json(r.map(mapOut));
}

export async function POST(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!b.planId || !b.value) return Response.json({ error: "planId dan value wajib" }, { status: 400 });
    // Validasi judul
    const titleTrim = b.title ? String(b.title).trim() : "";
    if (!titleTrim || titleTrim.length < 3) return Response.json({ error: "Judul realisasi minimal 3 karakter" }, { status: 400 });
    if (titleTrim.length > 200) return Response.json({ error: "Judul maksimal 200 karakter" }, { status: 400 });
    if (b.description && String(b.description).length > 1000) return Response.json({ error: "Deskripsi maksimal 1000 karakter" }, { status: 400 });
    // Validasi tanggal
    const dateStr = b.date ? String(b.date).trim() : new Date().toISOString().slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Response.json({ error: "Format tanggal harus YYYY-MM-DD" }, { status: 400 });
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Response.json({ error: "Tanggal tidak valid" }, { status: 400 });
    // Cek periode: tanggal harus dalam periode rencana
    const planCheck = await prisma.performancePlan.findUnique({ where: { id: b.planId }, select: { skpPeriodId: true } });
    if (!planCheck) return Response.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    const period = await prisma.skpPeriod.findUnique({ where: { id: planCheck.skpPeriodId } });
    if (period && (dateStr < period.startDate || dateStr > period.endDate)) {
      return Response.json({ error: `Tanggal harus dalam periode ${period.name} (${period.startDate} s/d ${period.endDate})` }, { status: 400 });
    }
    const uploadedBy = b.uploadedBy ?? payload.id;
    if (b.time !== undefined && normalizeTime(b.time) === null) {
      return Response.json({ error: "Format jam harus HH:mm 24 jam (00:00 - 23:59)" }, { status: 400 });
    }
    const timeVal = normalizeTime(b.time) ?? normalizeTime(b.realizationTime) ?? "09:00";
    const real = await prisma.realization.create({ data: {
      performancePlanId: b.planId, title: titleTrim.slice(0, 200), realizationValue: String(b.value),
      realizationDescription: b.description ? String(b.description).slice(0, 1000) : "", realizationDate: dateStr,
      realizationTime: timeVal,
      uploadedBy
    }});
    // banyak file bukti: prefer b.files [{fileName, filePath, fileSize}], fallback b.fileNames[]
    const incomingFiles: Array<{fileName: string, filePath: string, fileSize: string}> = Array.isArray(b.files)
      ? b.files.filter((f:any)=> f && typeof f.fileName === "string" && f.fileName.trim()).map((f:any)=>({ fileName: f.fileName.trim(), filePath: f.filePath || `/uploads/${f.fileName.trim()}`, fileSize: f.fileSize || "1.2 MB" }))
      : Array.isArray(b.fileNames) ? b.fileNames.filter((x:string)=>typeof x==="string" && x.trim()).map((fn:string)=>({ fileName: fn.trim(), filePath: `/uploads/${fn.trim()}`, fileSize: "1.2 MB" }))
      : (b.fileName ? [{ fileName: String(b.fileName).trim(), filePath: `/uploads/${String(b.fileName).trim()}`, fileSize: "1.2 MB" }] : []);
    if (incomingFiles.length > 5) return Response.json({ error: "Maksimal 5 bukti per realisasi" }, { status: 400 });
    for (const f of incomingFiles) {
      await prisma.attachment.create({ data: {
        performancePlanId: b.planId, realizationId: real.id, fileName: f.fileName, filePath: f.filePath,
        fileSize: f.fileSize, uploadedBy, date: real.realizationDate
      }}).catch(() => {});
    }
    if (b.progress !== undefined) {
      await prisma.performancePlan.update({ where: { id: b.planId }, data: { progress: Math.min(Number(b.progress), 150) } }).catch(() => {});
    } else {
      const np = await calcPlanProgress(b.planId);
      if (np !== null) await prisma.performancePlan.update({ where: { id: b.planId }, data: { progress: np } }).catch(() => {});
    }
    await propagateProgress(b.planId).catch(() => {});
    return Response.json(mapOut(real), { status: 201 });
  } catch (e: any) {
    console.error("POST /api/realizations error:", e);
    return Response.json({ error: "Gagal simpan realisasi", details: e?.message || String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.realization.findUnique({ where: { id: b.id } });
  if (!existing) return Response.json({ error: "Realisasi tidak ditemukan" }, { status: 404 });
  // hanya penulis yang boleh edit
  if (existing.uploadedBy !== payload.id) {
    return Response.json({ error: "Hanya penulis realisasi yang dapat mengubahnya" }, { status: 403 });
  }
  // Validasi judul
  if (b.title !== undefined) {
    const t = String(b.title).trim();
    if (t.length < 3) return Response.json({ error: "Judul minimal 3 karakter" }, { status: 400 });
    if (t.length > 200) return Response.json({ error: "Judul maksimal 200 karakter" }, { status: 400 });
  }
  if (b.description !== undefined && String(b.description).length > 1000) {
    return Response.json({ error: "Deskripsi maksimal 1000 karakter" }, { status: 400 });
  }
  // Validasi tanggal & periode
  if (b.date !== undefined) {
    const dateStr = String(b.date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return Response.json({ error: "Format tanggal harus YYYY-MM-DD" }, { status: 400 });
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Response.json({ error: "Tanggal tidak valid" }, { status: 400 });
    const plan = await prisma.performancePlan.findUnique({ where: { id: existing.performancePlanId }, select: { skpPeriodId: true } });
    if (plan) {
      const period = await prisma.skpPeriod.findUnique({ where: { id: plan.skpPeriodId } });
      if (period && (dateStr < period.startDate || dateStr > period.endDate)) {
        return Response.json({ error: `Tanggal harus dalam periode ${period.name} (${period.startDate} s/d ${period.endDate})` }, { status: 400 });
      }
    }
  }

  const timeUpdate = b.time !== undefined ? normalizeTime(b.time) : (b.realizationTime !== undefined ? normalizeTime(b.realizationTime) : undefined);
  if ((b.time !== undefined || b.realizationTime !== undefined) && timeUpdate === null) {
    return Response.json({ error: "Format jam harus HH:mm 24 jam (00:00 - 23:59)" }, { status: 400 });
  }
  const updated = await prisma.realization.update({
    where: { id: b.id },
    data: {
      title: b.title !== undefined ? (String(b.title).trim() || "Realisasi").slice(0, 200) : undefined,
      realizationDescription: b.description !== undefined ? String(b.description) : undefined,
      realizationDate: b.date !== undefined ? String(b.date) : undefined,
      realizationTime: timeUpdate ?? undefined
    }
  });
  // tambah bukti baru jika ada files saat edit
  const editFiles: Array<{fileName: string, filePath: string, fileSize: string}> = Array.isArray(b.files)
    ? b.files.filter((f:any)=> f && typeof f.fileName === "string" && f.fileName.trim()).map((f:any)=>({ fileName: f.fileName.trim(), filePath: f.filePath || `/uploads/${f.fileName.trim()}`, fileSize: f.fileSize || "1.2 MB" }))
    : Array.isArray(b.fileNames) ? b.fileNames.filter((x:string)=>typeof x==="string" && x.trim()).map((fn:string)=>({ fileName: fn.trim(), filePath: `/uploads/${fn.trim()}`, fileSize: "1.2 MB" })) : [];
  if (editFiles.length > 0) {
    const existingCount = await prisma.attachment.count({ where: { realizationId: b.id } });
    if (existingCount + editFiles.length > 5) return Response.json({ error: `Maksimal 5 bukti per realisasi (sudah ada ${existingCount}, tambah ${editFiles.length} melebihi batas)` }, { status: 400 });
  }
  for (const f of editFiles) {
    await prisma.attachment.create({ data: {
      performancePlanId: existing.performancePlanId, realizationId: updated.id, fileName: f.fileName, filePath: f.filePath,
      fileSize: f.fileSize, uploadedBy: payload.id, date: updated.realizationDate
    }}).catch(()=>{});
  }
  return Response.json(mapOut(updated));
}

export async function DELETE(req: Request) {
  const token = getTokenFromHeader(req); const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.realization.findUnique({ where: { id: b.id } });
  if (!existing) return Response.json({ error: "Realisasi tidak ditemukan" }, { status: 404 });
  // Hak hapus: penulis, atau atasan dari penulis/pelaksana, atau admin/direktur
  const plan = await prisma.performancePlan.findUnique({ where: { id: existing.performancePlanId }, select: { assignedTo: true } });
  const ownerId = existing.uploadedBy ?? plan?.assignedTo ?? null;
  let canDelete = false;
  if (existing.uploadedBy && existing.uploadedBy === payload.id) canDelete = true;
  else if (["admin", "direktur"].includes(payload.role)) canDelete = true;
  else if (ownerId) {
    // cek apakah payload adalah atasan dari ownerId (rekursif)
    const emps = await prisma.employee.findMany({ select: { id: true, supervisorId: true } });
    const isSubordinate = (sup: string, emp: string): boolean => {
      const visited = new Set<string>();
      let queue = [sup];
      while (queue.length) {
        const cur = queue.shift()!;
        const direct = emps.filter(e => e.supervisorId === cur).map(e => e.id);
        if (direct.includes(emp)) return true;
        direct.forEach(d => { if (!visited.has(d)) { visited.add(d); queue.push(d); } });
      }
      return false;
    };
    if (isSubordinate(payload.id, ownerId)) canDelete = true;
  }
  if (!canDelete) {
    return Response.json({ error: "Hanya penulis atau atasan yang dapat menghapus realisasi ini" }, { status: 403 });
  }

  const planId = existing.performancePlanId;
  await prisma.attachment.deleteMany({ where: { realizationId: b.id } });
  await prisma.realization.delete({ where: { id: b.id } });

  // hitung ulang progres rencana + induk
  const np = await calcPlanProgress(planId);
  if (np !== null) await prisma.performancePlan.update({ where: { id: planId }, data: { progress: np } }).catch(() => {});
  await propagateProgress(planId).catch(() => {});

  return Response.json({ ok: true });
}