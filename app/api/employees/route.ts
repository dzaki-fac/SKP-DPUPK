import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";
import { validateOrgChange, validateOrgCreate, isValidRole, canManageTarget, canAssignSupervisor, canCreateRole, descendantIds } from "@/lib/roles";
import type { OrgRow } from "@/lib/roles";
import { z } from "zod";

function toDTO(e: { id: string; userId: string; employeeNumber: string; name: string; email: string; supervisorId: string | null; role: string; avatar: string | null; isActive: boolean }) {
  return {
    id: e.id, userId: e.userId, employeeNumber: e.employeeNumber, name: e.name, email: e.email,
    supervisorId: e.supervisorId, role: e.role as string, avatar: e.avatar, isActive: e.isActive,
  };
}

function audit(userId: string, userName: string, action: string, description: string, entityId: string) {
  return prisma.activityLog.create({ data: { userId, userName: userName.split(",")[0], action, description, entityType: "employee", entityId, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ") } }).catch(() => { });
}

export async function GET(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const employees = (await prisma.employee.findMany({ orderBy: { id: "asc" } })) as Array<{
    id: string; userId: string; employeeNumber: string; name: string; email: string; supervisorId: string | null; role: string; avatar: string | null; isActive: boolean;
  }>;

  // Admin melihat seluruh organisasi; pimpinan HANYA subtree-nya — akun sendiri
  // tidak tampil (tidak boleh dikelola), sibling & parent juga tidak.
  if (payload.role !== "admin") {
    const hierarchy = employees.map(e => ({ id: e.id, role: e.role as OrgRow["role"], supervisorId: e.supervisorId }));
    const allowed = new Set<string>(descendantIds(hierarchy, payload.id));
    return Response.json(employees.filter(e => allowed.has(e.id)).map(toDTO));
  }

  return Response.json(employees.map(toDTO));
}

const createSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  employeeNumber: z.string().optional(),
  supervisorId: z.string().nullable().optional(),
  role: z.enum(["admin", "pimpinan_1", "pimpinan_2", "pimpinan_3", "staf"]),
  avatar: z.string().optional(),
});

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  // Hanya admin yang boleh membuat/menambah akun pegawai.
  if (payload.role !== "admin") {
    return Response.json({ error: "Hanya administrator yang dapat menambah pegawai" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const all = (await prisma.employee.findMany({ select: { id: true, role: true, supervisorId: true } })) as OrgRow[];

  if (b.email) {
    const exists = await prisma.employee.findUnique({ where: { email: b.email } });
    if (exists) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }
  if (b.employeeNumber) {
    const dupNip = await prisma.employee.findUnique({ where: { employeeNumber: b.employeeNumber } });
    if (dupNip) return Response.json({ error: "NIP sudah terdaftar" }, { status: 409 });
  }

  const next: OrgRow = { id: "__new__", role: b.role, supervisorId: b.supervisorId || null };
  const check = validateOrgCreate(all, next);
  if (!check.ok) return Response.json({ error: check.error }, { status: 400 });

  const hashed = await hashPassword(b.password ?? "password");
  const emp = await prisma.employee.create({
    data: {
      userId: `u${Date.now()}`,
      employeeNumber: b.employeeNumber ?? `199${Math.floor(Math.random() * 1e7)}`,
      name: b.name, email: b.email, password: hashed,
      supervisorId: b.supervisorId || null, role: b.role,
      avatar: b.avatar ?? b.name.slice(0, 2).toUpperCase(),
    },
  });
  await audit(payload.id, payload.name, "Menambah pegawai", `Menambah pegawai ${emp.name} (${b.role})`, emp.id);
  return Response.json(toDTO(emp), { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3, "Nama minimal 3 karakter").optional(),
  email: z.string().email("Email tidak valid").optional(),
  employeeNumber: z.string().optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  supervisorId: z.string().nullable().optional(),
  role: z.enum(["admin", "pimpinan_1", "pimpinan_2", "pimpinan_3", "staf"]).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional(),
});

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const target = await prisma.employee.findUnique({ where: { id: b.id } });
  if (!target) return Response.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  if (!isValidRole(target.role)) return Response.json({ error: "Role tidak valid" }, { status: 400 });

  // Muat hierarki penuh sekali untuk semua keputusan otorisasi.
  const all = (await prisma.employee.findMany({ select: { id: true, role: true, supervisorId: true } })) as OrgRow[];
  const manager: OrgRow = { id: payload.id, role: payload.role as OrgRow["role"], supervisorId: null };

  // 1) Otorisasi mengelola target (subtree / diri sendiri / admin).
  const manage = canManageTarget(manager, { id: target.id, role: target.role as OrgRow["role"], supervisorId: target.supervisorId }, all);
  if (!manage.ok) return Response.json({ error: manage.error }, { status: 403 });

  // 2) Bagi pimpinan: perubahan role hanya ke role yang berhak ia ciptakan
  //    (tidak boleh setara/lebih tinggi dari dirinya).
  if (payload.role !== "admin" && b.role !== undefined && !canCreateRole(payload.role as OrgRow["role"], b.role)) {
    return Response.json({ error: "Anda tidak berwenang mengubah jabatan tersebut." }, { status: 403 });
  }

  // 3) Bagi pimpinan: perubahan atasan harus tetap berada dalam subtree-nya.
  if (payload.role !== "admin" && b.supervisorId !== undefined) {
    const sup = canAssignSupervisor(manager, b.supervisorId, all);
    if (!sup.ok) return Response.json({ error: sup.error }, { status: 403 });
  }

  if (b.email && b.email !== target.email) {
    const exists = await prisma.employee.findUnique({ where: { email: b.email } });
    if (exists) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }
  if (b.employeeNumber && b.employeeNumber !== target.employeeNumber) {
    const dupNip = await prisma.employee.findUnique({ where: { employeeNumber: b.employeeNumber } });
    if (dupNip) return Response.json({ error: "NIP sudah terdaftar" }, { status: 409 });
  }

  // Validasi relasi organisasi bila role / supervisor berubah
  if (b.role !== undefined || b.supervisorId !== undefined) {
    const check = validateOrgChange(all, target.id, { id: target.id, role: target.role as OrgRow["role"], supervisorId: target.supervisorId }, { role: b.role, supervisorId: b.supervisorId });
    if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
  }

  try {
    const emp = await prisma.employee.update({
      where: { id: b.id },
      data: {
        name: b.name,
        email: b.email,
        employeeNumber: b.employeeNumber,
        password: b.password ? await hashPassword(b.password) : undefined,
        supervisorId: b.supervisorId !== undefined ? (b.supervisorId || null) : undefined,
        role: b.role,
        isActive: b.isActive,
        avatar: b.avatar,
      },
    });
    const changes: string[] = [];
    if (b.name) changes.push("nama");
    if (b.email) changes.push("email");
    if (b.password) changes.push("password");
    if (b.isActive !== undefined) changes.push(b.isActive ? "aktif" : "non-aktif");
    if (b.role) changes.push(`role ${b.role}`);
    if (b.supervisorId !== undefined) changes.push("atasan");
    const desc = changes.length ? `Perbarui ${emp.name}: ${changes.join(", ")}` : `Perbarui data ${emp.name}`;
    await audit(payload.id, payload.name, "Mengubah akun/pegawai", desc, emp.id);
    return Response.json(toDTO(emp));
  } catch (e: unknown) {
    return Response.json({ error: "Gagal update pegawai", details: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b?.id) return Response.json({ error: "id wajib" }, { status: 400 });
  if (b.id === payload.id) return Response.json({ error: "Tidak bisa menghapus diri sendiri" }, { status: 400 });

  const target = await prisma.employee.findUnique({ where: { id: b.id } });
  if (!target) return Response.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });

  // Otorisasi menghapus (diperiksa lebih dulu): admin bebas; pimpinan hanya akun
  // di dalam subtree-nya (sibling & parent otomatis ditolak 403).
  if (payload.role !== "admin") {
    const all = (await prisma.employee.findMany({ select: { id: true, role: true, supervisorId: true } })) as OrgRow[];
    const manager: OrgRow = { id: payload.id, role: payload.role as OrgRow["role"], supervisorId: null };
    const manage = canManageTarget(manager, { id: target.id, role: target.role as OrgRow["role"], supervisorId: target.supervisorId }, all);
    if (!manage.ok) return Response.json({ error: manage.error }, { status: 403 });
  }

  if (target.role === "pimpinan_1") return Response.json({ error: "Tidak bisa menghapus Direktur (pimpinan_1) — harus selalu ada 1 Direktur" }, { status: 400 });

  const subs = await prisma.employee.count({ where: { supervisorId: b.id } });
  if (subs > 0) return Response.json({ error: `Masih ${subs} delegasi penerima — pindahkan dulu` }, { status: 400 });
  const planCount = await prisma.performancePlan.count({ where: { OR: [{ assignedTo: b.id }, { createdBy: b.id }] } });
  if (planCount > 0) return Response.json({ error: `Masih terkait ${planCount} rencana kinerja — hapus/pindahkan dulu` }, { status: 400 });

  await prisma.employee.delete({ where: { id: b.id } });
  await audit(payload.id, payload.name, "Menghapus pegawai", `Menghapus ${target.name}`, target.id);
  return Response.json({ ok: true });
}