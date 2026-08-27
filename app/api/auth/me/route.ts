import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = getTokenFromHeader(req);
  if (!token) return Response.json({ user: null }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return Response.json({ user: null }, { status: 401 });
  const user = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!user || user.isActive === false) return Response.json({ user: null }, { status: 401 });
  const safeUser = { id: user.id, userId: user.userId, employeeNumber: user.employeeNumber, name: user.name, email: user.email, supervisorId: user.supervisorId, role: user.role, avatar: user.avatar };
  return Response.json({ user: safeUser });
}
