import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const periods = await prisma.skpPeriod.findMany({ orderBy: { year: "desc" } });
  return Response.json(periods.map(p => ({ id: p.id, name: p.name, year: p.year, startDate: p.startDate, endDate: p.endDate })));
}

const schema = z.object({ name: z.string().min(3), year: z.coerce.number().int().min(2020).max(2035), startDate: z.string().min(8), endDate: z.string().min(8) });

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["admin","direktur"].includes(payload.role)) return Response.json({ error: "Hanya admin/direktur" }, { status: 403 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const p = await prisma.skpPeriod.create({ data: { name: b.name, year: b.year, startDate: b.startDate, endDate: b.endDate } });
  await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Membuat periode", description: `Membuat periode ${p.name}`, entityType: "skp_period", entityId: p.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } });
  return Response.json(p, { status: 201 });
}

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["admin","direktur"].includes(payload.role)) return Response.json({ error: "Hanya admin/direktur" }, { status: 403 });
  const body = await req.json();
  if (!body.id) return Response.json({ error: "id wajib" }, { status: 400 });
  const updated = await prisma.skpPeriod.update({ where: { id: body.id }, data: { name: body.name, year: body.year ? Number(body.year) : undefined, startDate: body.startDate, endDate: body.endDate } });
  await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Mengubah periode", description: `Mengubah periode ${updated.name}`, entityType: "skp_period", entityId: updated.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } });
  return Response.json(updated);
}
