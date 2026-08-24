import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, authResponse } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Email dan password wajib diisi", details: parsed.error.flatten() }, { status: 400 });

    const { email, password } = parsed.data;
    const user = await prisma.employee.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Email atau password salah" }, { status: 401 });
    if (user.isActive === false) return Response.json({ error: "Akun non-aktif, hubungi admin" }, { status: 403 });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return Response.json({ error: "Email atau password salah" }, { status: 401 });

    await prisma.employee.update({ where: { id: user.id }, data: { lastLoginAt: new Date().toISOString() } });

    await prisma.activityLog.create({
      data: {
        userId: user.id, userName: user.name.split(",")[0], action: "Login", description: `Login sebagai ${user.role}`, entityType: "auth", entityId: user.id, createdAt: new Date().toISOString().slice(0,16).replace("T"," ")
      }
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const safeUser = { id: user.id, userId: user.userId, employeeNumber: user.employeeNumber, name: user.name, email: user.email, positionId: user.positionId, departmentId: user.departmentId, supervisorId: user.supervisorId, role: user.role, avatar: user.avatar };
    return authResponse({ ok: true, user: safeUser, token }, token);
  } catch (e: any) {
    return Response.json({ error: "Gagal login", details: e?.message }, { status: 500 });
  }
}
