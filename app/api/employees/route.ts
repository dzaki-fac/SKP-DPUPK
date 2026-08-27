import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });
  return Response.json(employees.map(e => ({
    id: e.id, userId: e.userId, employeeNumber: e.employeeNumber, name: e.name, email: e.email,
    supervisorId: e.supervisorId, role: e.role, avatar: e.avatar
  })));
}

const createSchema = z.object({
  name: z.string().min(3), email: z.string().email(), password: z.string().min(6).optional(),
  employeeNumber: z.string().optional(),
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
    name: b.name, email: b.email, password: hashed, supervisorId: b.supervisorId || null, role: b.role, avatar: b.avatar ?? b.name.slice(0,2).toUpperCase()
  }});
  await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Menambah pegawai", description: `Menambah pegawai ${emp.name}`, entityType: "employee", entityId: emp.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } });
  return Response.json(emp, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  supervisorId: z.string().nullable().optional(),
  role: z.enum(["admin","direktur","supervisor","staff"]).optional(),
});

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !["admin","direktur"].includes(payload.role)) return Response.json({ error: "Hanya admin/direktur" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;
  // cegah siklus: atasan baru tidak boleh bawahan dari pegawai tsb
  if (b.supervisorId) {
    let cur: string | null = b.supervisorId;
    const visited = new Set<string>();
    while (cur) {
      if (cur === b.id) return Response.json({ error: "Tidak boleh: membentuk siklus hierarki" }, { status: 400 });
      if (visited.has(cur)) break;
      visited.add(cur);
      const row: { supervisorId: string | null } | null = await prisma.employee.findUnique({ where: { id: cur }, select: { supervisorId: true } });
      cur = row?.supervisorId ?? null;
    }
  }
  try {
    const emp = await prisma.employee.update({ where: { id: b.id }, data: {
      supervisorId: b.supervisorId !== undefined ? (b.supervisorId || null) : undefined,
      role: b.role,
    }});
    await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Mengubah organisasi", description: `Update ${emp.name}`, entityType: "employee", entityId: emp.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } }).catch(()=>{});
    return Response.json(emp);
  } catch (e: any) {
    return Response.json({ error: "Gagal update pegawai", details: String(e?.message).slice(0,300) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") return Response.json({ error: "Hanya admin dapat menghapus pegawai" }, { status: 403 });
  const b = await req.json();
  if (!b.id) return Response.json({ error: "id wajib" }, { status: 400 });
  if (b.id === payload.id) return Response.json({ error: "Tidak bisa menghapus diri sendiri" }, { status: 400 });
  const target = await prisma.employee.findUnique({ where: { id: b.id } });
  if (!target) return Response.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  const subs = await prisma.employee.count({ where: { supervisorId: b.id } });
  if (subs > 0) return Response.json({ error: `Masih ${subs} delegasi penerima — pindahkan dulu` }, { status: 400 });
  const planCount = await prisma.performancePlan.count({ where: { OR: [{ assignedTo: b.id }, { createdBy: b.id }] } });
  if (planCount > 0) return Response.json({ error: `Masih terkait ${planCount} rencana kinerja — hapus/pindahkan dulu` }, { status: 400 });
  await prisma.employee.delete({ where: { id: b.id } });
  await prisma.activityLog.create({ data: { userId: payload.id, userName: payload.name.split(",")[0], action: "Menghapus pegawai", description: `Menghapus ${target.name}`, entityType: "employee", entityId: target.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ") } }).catch(()=>{});
  return Response.json({ ok: true });
}
