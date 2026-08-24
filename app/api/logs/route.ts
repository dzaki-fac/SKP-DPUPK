import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(logs.map(l => ({ id: l.id, userId: l.userId, userName: l.userName, action: l.action, description: l.description, entityType: l.entityType, entityId: l.entityId, createdAt: l.createdAt })));
}

export async function POST(req: Request) {
  const b = await req.json();
  const log = await prisma.activityLog.create({ data: {
    userId: b.userId, userName: b.userName, action: b.action, description: b.description, entityType: b.entityType, entityId: b.entityId, createdAt: b.createdAt ?? new Date().toISOString().slice(0,16).replace("T"," ")
  }});
  return Response.json(log, { status: 201 });
}
