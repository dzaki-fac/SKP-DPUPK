import { prisma } from "@/lib/prisma";

// GET /api/logs — dua mode:
//  1) ?meta=1              → opsi filter (distinct actions/entityTypes/pegawai) dalam scope
//  2) page/limit/filters   → hasil ter-paginasi dari server (bukan tarik semua lalu di-slice di frontend)
//
// Catatan: SQLite via Prisma tidak mendukung mode "insensitive" (fitur khusus Postgres),
// jadi pencarian teks (`q`) di bawah ini case-sensitive.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdsParam = searchParams.get("userIds");
  const userIds = userIdsParam ? userIdsParam.split(",").filter(Boolean) : undefined;
  const scopeWhere = userIds ? { userId: { in: userIds } } : {};

  if (searchParams.get("meta") === "1") {
    const [actionsRaw, entityRaw, employeesRaw] = await Promise.all([
      prisma.activityLog.findMany({ where: scopeWhere, distinct: ["action"], select: { action: true } }),
      prisma.activityLog.findMany({ where: scopeWhere, distinct: ["entityType"], select: { entityType: true } }),
      prisma.activityLog.findMany({ where: scopeWhere, distinct: ["userId"], select: { userId: true, userName: true } }),
    ]);
    return Response.json({
      actions: actionsRaw.map(a => a.action).sort(),
      entityTypes: entityRaw.map(e => e.entityType).sort(),
      employees: employeesRaw.map(e => ({ id: e.userId, name: e.userName })).sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20") || 20));
  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const q = searchParams.get("q") || undefined;
  const from = searchParams.get("from") || undefined; // YYYY-MM-DD
  const to = searchParams.get("to") || undefined;       // YYYY-MM-DD

  const where: any = {
    ...scopeWhere,
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: `${to} 23:59` } : {}) } } : {}),
    ...(q ? { OR: [
      { userName: { contains: q } },
      { description: { contains: q } },
      { action: { contains: q } },
    ] } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.activityLog.count({ where }),
  ]);

  return Response.json({
    logs: logs.map(l => ({ id: l.id, userId: l.userId, userName: l.userName, action: l.action, description: l.description, entityType: l.entityType, entityId: l.entityId, createdAt: l.createdAt })),
    total, page, limit,
  });
}

export async function POST(req: Request) {
  const b = await req.json();
  const log = await prisma.activityLog.create({ data: {
    userId: b.userId, userName: b.userName, action: b.action, description: b.description, entityType: b.entityType, entityId: b.entityId, createdAt: b.createdAt ?? new Date().toISOString().slice(0,16).replace("T"," ")
  }});
  return Response.json(log, { status: 201 });
}