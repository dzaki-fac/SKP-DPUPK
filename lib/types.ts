export type Role = "admin" | "pimpinan_1" | "pimpinan_2" | "pimpinan_3" | "staf";

export interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  name: string;
  email: string;
  supervisorId: string | null;
  role: Role;
  avatar: string;
  isActive: boolean;
}

export interface SkpPeriod {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

export interface PlanTarget { id: string; name: string; value: string; unit: string; }
export interface PerformancePlan {
  id: string;
  parentId: string | null;
  skpPeriodId: string;
  createdBy: string;
  assignedTo: string;
  title: string;
  target: string;
  progress: number;
  customTargets?: PlanTarget[];
  createdAt?: string;
  plannedDate?: string | null;
  plannedTime?: string | null;
}

export interface RealizationTarget { id: string; name: string; value: string; unit: string; }
export interface RealizationParticipant { id: string; employeeId?: string | null; customName?: string | null; role: string; }
export interface Realization {
  id: string;
  planId: string;
  title: string;
  value: string;
  description: string;
  date: string;
  time: string;
  uploadedBy: string | null;
  targets?: RealizationTarget[];
  participants?: RealizationParticipant[];
}

export interface Attachment {
  id: string;
  planId: string;
  realizationId: string | null;
  fileName: string;
  filePath: string;
  fileSize: string;
  uploadedBy: string;
  date: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  userId: string;
  employeeNumber: string;
  name: string;
  email: string;
  supervisorId: string | null;
  role: Role;
  avatar: string;
  isActive: boolean;
}
