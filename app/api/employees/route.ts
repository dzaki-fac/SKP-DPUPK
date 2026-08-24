import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });
  return Response.json(employees.map(e => ({
    id: e.id, userId: e.userId, employeeNumber: e.employeeNumber, name: e.name, email: e.email,
    positionId: e.positionId, departmentId: e.departmentId, supervisorId: e.supervisorId, role: e.role, avatar: e.avatar
  })));
}

const createSchema = z.object({
  name: z.string().min(3), email: z.string().email(), password: z.string().min(6).optional(),
  employeeNumber: z.string().optional(), positionId: z.string(), departmentId: z.string(),
  supervisorId: z.string().nullable().optional(), role: z.enum(["admin","direktur","supervisor","staff"]), avatar: z.string().optional()
});

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["admin","direktur"].includes(payload.role)) return Response.json({ error: "Hanya admin/direktur" }, { status: 403 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  const exists = await prisma.employee.findUnique({ where: { email: b.email } });
  if (exists) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
  const hashed = b.password ? await hashPassword(b.password) : "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";
  const emp = await prisma.employee.create({ data: {
    userId: `u${Date.now()}`, employeeNumber: b.employeeNumber ?? `199${Math.floor(Math.random()*1e7)}`,
    name: b.name, email: b.email, password: hashed, positionId: b.positionId, departmentId: b.departmentId, supervisorId: b.supervisorId || null, role: b.role, avatar: b.avatar ?? b.name.slice(0,2).toUpperCase()
  }});
  await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Menambah pegawai", description: `Menambah pegawai ${emp.name}`, entityType: "employee", entityId: emp.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } });
  return Response.json(emp, { status: 201 });
}
