import { prisma } from "@/lib/prisma";

export async function GET() {
  const r = await prisma.realization.findMany({ orderBy: { realizationDate: "desc" } });
  return Response.json(r.map(x => ({
    id: x.id, planId: x.performancePlanId, title: (x as any).title ?? "Realisasi", value: x.realizationValue, description: x.realizationDescription, date: x.realizationDate
  })));
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.planId || !b.value) return Response.json({ error: "planId dan value wajib" }, { status: 400 });
    const real = await prisma.realization.create({ data: {
      performancePlanId: b.planId, title: (b.title?.trim() || "Realisasi").slice(0, 200), realizationValue: String(b.value), realizationDescription: b.description ?? "", realizationDate: b.date ?? new Date().toISOString().slice(0,10)
    }});
    if (b.fileName) {
      await prisma.attachment.create({ data: {
        performancePlanId: b.planId, realizationId: real.id, fileName: b.fileName, filePath: `/uploads/${real.id}`, fileSize: "1.2 MB", uploadedBy: b.uploadedBy ?? b.planId, date: real.realizationDate
      }});
    }
  if (b.progress !== undefined) {
    await prisma.performancePlan.update({ where: { id: b.planId }, data: { progress: Math.min(Number(b.progress), 150) } }).catch(()=>{});
  }
    return Response.json(real, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/realizations error:", e);
    return Response.json({ error: "Gagal simpan realisasi", details: e?.message || String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id required" }, { status: 400 });
  // status dihapus — PATCH tidak lagi dipakai (keep for compat, no-op)
  return Response.json({ ok: true });
}
