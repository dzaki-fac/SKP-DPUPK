import { prisma } from "@/lib/prisma";
import { hashPassword, getTokenFromHeader, verifyToken } from "@/lib/auth";
import { validateOrgCreate } from "@/lib/roles";
import type { OrgRow } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  employeeNumber: z.string().optional(),
  supervisorId: z.string().nullable().optional(),
  role: z.enum(["admin", "pimpinan_1", "pimpinan_2", "pimpinan_3", "staf"]),
});

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") {
    return Response.json({ error: "Hanya administrator yang dapat menambah pegawai" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    const exists = await prisma.employee.findUnique({ where: { email: d.email } });
    if (exists) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
    if (d.employeeNumber) {
      const dupNip = await prisma.employee.findUnique({ where: { employeeNumber: d.employeeNumber } });
      if (dupNip) return Response.json({ error: "NIP sudah terdaftar" }, { status: 409 });
    }
    const all = (await prisma.employee.findMany({ select: { id: true, role: true, supervisorId: true } })) as unknown as OrgRow[];
    const check = validateOrgCreate(all, { id: "__new__", role: d.role, supervisorId: d.supervisorId || null });
    if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
    const hashed = await hashPassword(d.password);
    const emp = await prisma.employee.create({
      data: {
        userId: `u${Date.now()}`, employeeNumber: d.employeeNumber || `199${Math.floor(Math.random()*1e7)}`,
        name: d.name, email: d.email, password: hashed,
        supervisorId: d.supervisorId || null, role: d.role, avatar: d.name.slice(0,2).toUpperCase()
      }
    });
    await prisma.activityLog.create({
      data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Menambah pegawai", description: `Menambah pegawai ${emp.name} (${emp.role})`, entityType: "employee", entityId: emp.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") }
    });
    return Response.json({ ok: true, id: emp.id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Gagal menambah pegawai" }, { status: 500 });
  }
}