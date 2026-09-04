import { prisma } from "@/lib/prisma";
import {
  getTokenFromHeader,
  verifyToken,
  verifyPassword,
  hashPassword,
  signToken,
  authResponse,
} from "@/lib/auth";
import { z } from "zod";

function toDTO(e: {
  id: string;
  userId: string;
  employeeNumber: string;
  name: string;
  email: string;
  supervisorId: string | null;
  role: string;
  avatar: string | null;
  isActive: boolean;
}) {
  return {
    id: e.id,
    userId: e.userId,
    employeeNumber: e.employeeNumber,
    name: e.name,
    email: e.email,
    supervisorId: e.supervisorId,
    role: e.role,
    avatar: e.avatar,
    isActive: e.isActive,
  };
}

export async function GET(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });
  const user = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!user || user.isActive === false) return Response.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  return Response.json({ user: toDTO(user as never) });
}

const patchSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter").optional(),
  email: z.string().email("Email tidak valid").optional(),
  avatar: z.string().max(8, "Avatar maksimal 8 karakter").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter").max(100).optional(),
});

export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  if (
    b.name === undefined &&
    b.email === undefined &&
    b.avatar === undefined &&
    b.newPassword === undefined
  ) {
    return Response.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const user = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!user || user.isActive === false) return Response.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  // Ganti password wajib verifikasi password saat ini
  let hashedNew: string | undefined;
  if (b.newPassword !== undefined) {
    if (!b.currentPassword) {
      return Response.json({ error: "Password saat ini wajib diisi untuk mengganti password" }, { status: 400 });
    }
    const ok = await verifyPassword(b.currentPassword, user.password);
    if (!ok) return Response.json({ error: "Password saat ini salah" }, { status: 400 });
    hashedNew = await hashPassword(b.newPassword);
  }

  if (b.email && b.email !== user.email) {
    const exists = await prisma.employee.findUnique({ where: { email: b.email } });
    if (exists) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  try {
    const updated = await prisma.employee.update({
      where: { id: user.id },
      data: {
        name: b.name?.trim() || undefined,
        email: b.email?.trim() || undefined,
        avatar: b.avatar?.trim() || undefined,
        password: hashedNew,
      },
    });

    await prisma.activityLog
      .create({
        data: {
          userId: updated.id,
          userName: updated.name.split(",")[0],
          action: "Mengubah akun sendiri",
          description: `Memperbarui informasi akun${b.newPassword ? " (termasuk password)" : ""}`,
          entityType: "employee",
          entityId: updated.id,
          createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      })
      .catch(() => {});

    // Refresh token agar nama/email di sesi ikut terbaru
    const freshToken = signToken({ id: updated.id, email: updated.email, role: updated.role, name: updated.name });
    return authResponse({ ok: true, user: toDTO(updated as never) }, freshToken);
  } catch (e: unknown) {
    return Response.json(
      { error: "Gagal memperbarui akun", details: String(e instanceof Error ? e.message : e).slice(0, 300) },
      { status: 500 }
    );
  }
}
