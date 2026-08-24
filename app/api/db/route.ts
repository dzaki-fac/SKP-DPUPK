import { prisma } from "@/lib/prisma";

// Aggregated fetch for initial load — single round-trip
export async function GET() {
  const [employees, periods, plans, realizations, attachments, logs, positions, departments] = await Promise.all([
    prisma.employee.findMany(),
    prisma.skpPeriod.findMany(),
    prisma.performancePlan.findMany(),
    prisma.realization.findMany(),
    prisma.attachment.findMany(),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.position.findMany(),
    prisma.department.findMany(),
  ]);
  return Response.json({
    employees: employees.map(e => ({ id: e.id, userId: e.userId, employeeNumber: e.employeeNumber, name: e.name, email: e.email, positionId: e.positionId, departmentId: e.departmentId, supervisorId: e.supervisorId, role: e.role, avatar: e.avatar })),
    periods: periods.map(p => ({ id: p.id, name: p.name, year: p.year, startDate: p.startDate, endDate: p.endDate })),
    plans: plans.map(p => ({ id: p.id, parentId: p.parentId, skpPeriodId: p.skpPeriodId, createdBy: p.createdBy, assignedTo: p.assignedTo, title: p.title, target: p.target, progress: p.progress })),
    realizations: realizations.map(r => ({ id: r.id, planId: r.performancePlanId, title: (r as any).title ?? "Realisasi", value: r.realizationValue, description: r.realizationDescription, date: r.realizationDate })),
    attachments: attachments.map(a => ({ id: a.id, planId: a.performancePlanId, realizationId: a.realizationId, fileName: a.fileName, fileSize: a.fileSize, uploadedBy: a.uploadedBy, date: a.date })),
    logs: logs.map(l => ({ id: l.id, userId: l.userId, userName: l.userName, action: l.action, description: l.description, entityType: l.entityType, entityId: l.entityId, createdAt: l.createdAt })),
    positions, departments
  });
}
