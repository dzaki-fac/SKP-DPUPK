export type Role = "admin" | "direktur" | "supervisor" | "staff";

export interface Position { id: string; name: string; level: number; }
export interface Department { id: string; name: string; code: string; }
export interface Employee { id: string; userId: string; employeeNumber: string; name: string; email: string; positionId: string; departmentId: string; supervisorId: string | null; role: Role; avatar: string; }
export interface SkpPeriod { id: string; name: string; year: number; startDate: string; endDate: string; }
export interface PerformancePlan { id: string; parentId: string | null; skpPeriodId: string; createdBy: string; assignedTo: string; title: string; target: string; progress: number; }
export interface Realization { id: string; planId: string; title: string; value: string; description: string; date: string; }
export interface Attachment { id: string; planId: string; realizationId: string | null; fileName: string; fileSize: string; uploadedBy: string; date: string; }
export interface ActivityLog { id: string; userId: string; userName: string; action: string; description: string; entityType: string; entityId: string; createdAt: string; }
