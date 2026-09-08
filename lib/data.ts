import type { Employee, SkpPeriod, PerformancePlan, Realization, Attachment, ActivityLog } from "./types";
import { ROLE_SHORT } from "./roles";
import { PERPUS_2026_EMPLOYEES, ADMIN_SEED_EMPLOYEE } from "./perpus-2026";

/**
 * Fallback data untuk client (store.tsx) sebelum hydrate dari /api/db.
 * Sumber tunggal: lib/perpus-2026.ts — 35 pegawai + 1 admin (Opsi A).
 *
 * Urutan: indeks 0 = pimpinan_1 (direktur), indeks 7 = admin — sesuai kontrak lama lib/data.ts:5-6
 * agar landing/demo login lama tidak pecah.
 */

// Susun ulang agar indeks 7 = admin (kontrak lama), direktur tetap indeks 0.
const _ordered: typeof PERPUS_2026_EMPLOYEES = [...PERPUS_2026_EMPLOYEES];
const adminOrdered: Employee[] = (() => {
  const withoutAdmin = _ordered.map<Employee>((e) => ({
    id: e.id, userId: e.userId, employeeNumber: e.employeeNumber,
    name: e.name, email: e.email, supervisorId: e.supervisorId,
    role: e.role, avatar: e.avatar, isActive: true,
  }));
  const admin: Employee = {
    id: ADMIN_SEED_EMPLOYEE.id, userId: ADMIN_SEED_EMPLOYEE.userId,
    employeeNumber: ADMIN_SEED_EMPLOYEE.employeeNumber, name: ADMIN_SEED_EMPLOYEE.name,
    email: ADMIN_SEED_EMPLOYEE.email, supervisorId: ADMIN_SEED_EMPLOYEE.supervisorId,
    role: ADMIN_SEED_EMPLOYEE.role, avatar: ADMIN_SEED_EMPLOYEE.avatar, isActive: true,
  };
  // Sisip admin di indeks 7 (direktur di 0). Jika sudah ada, tidak duplikat.
  withoutAdmin.splice(7, 0, admin);
  return withoutAdmin;
})();

export const seedEmployees: Employee[] = adminOrdered;

export const seedPeriods: SkpPeriod[] = [
  { id: "sp2026", name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" },
];

// Reset total — tidak ada data SKP lama, periode bersih.
export const seedPlans: PerformancePlan[] = [];
export const seedRealizations: Realization[] = [];
export const seedAttachments: Attachment[] = [];
export const seedLogs: ActivityLog[] = [];

export const roleLabel = ROLE_SHORT;
