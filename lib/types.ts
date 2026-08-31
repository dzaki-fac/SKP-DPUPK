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

// Relasi/history fleksibel Staff ↔ Pimpinan.
// 1 NIP = 1 Employee. Seorang staf punya 1..n relasi di sini.
// Aktif = endDate null (atau isActive true). Riwayat = endDate terisi.
export interface EmployeeSupervisor {
  id: string;
  employeeId: string;   // staf
  supervisorId: string; // pimpinan
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface SkpPeriod {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

export interface PerformancePlan {
  id: string;
  parentId: string | null;
  skpPeriodId: string;
  createdBy: string;
  assignedTo: string;
  title: string;
  target: string;
  progress: number;
}

export interface Realization {
  id: string;
  planId: string;
  title: string;
  value: string;
  description: string;
  date: string;
}

export interface Attachment {
  id: string;
  planId: string;
  realizationId: string;
  fileName: string;
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