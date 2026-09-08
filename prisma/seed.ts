import "dotenv/config";
import { prisma } from "../lib/prisma";
import { ALL_SEED_EMPLOYEES } from "../lib/perpus-2026";

/**
 * Seeder SKP DPUPK — Perpus 2026 (Opsi A, 2026-09-07)
 *
 * Sumber: `NEW PERPUS - penataan pegawai 2026.xlsx` (35 baris + 1 admin)
 * Struktur Opsi A:
 *  - 1 pimpinan_1  — Suwondo (Direktur, tanpa atasan)
 *  - 1 pimpinan_2  — Sulasdi (Manajer TU → Suwondo)
 *  - 2 pimpinan_3  — Nuryati (Kearsipan → Sulasdi) + Linda (Perpus → Sulasdi)
 *  - 31 staf       — 8 → Nuryati, 23 → Linda
 *  - 1 admin       — Admin Sistem (di luar hierarki)
 *
 * Reset total: semua tabel dibersihkan, hanya periode SKP 2026 dibuat.
 * Password awal semua akun = "password" (hash default di schema), wajib ganti.
 */

const PERIODE_ID = "sp2026";

async function main() {
  // ===== Reset (urutan penting: anak dulu, induk terakhir) =====
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.realizationParticipant.deleteMany();
  await prisma.realizationTarget.deleteMany();
  await prisma.realization.deleteMany();
  await prisma.planTarget.deleteMany();
  await prisma.performancePlan.deleteMany();
  await prisma.skpPeriod.deleteMany();
  await prisma.employee.deleteMany();

  // ===== Pegawai (36 akun) =====
  // Password tidak diisi → pakai default hash "$2b$10$..." (="password") di schema.
  await prisma.employee.createMany({
    data: ALL_SEED_EMPLOYEES.map((e) => ({
      id: e.id,
      userId: e.userId,
      employeeNumber: e.employeeNumber,
      name: e.name,
      email: e.email,
      supervisorId: e.supervisorId,
      role: e.role,
      avatar: e.avatar,
      isActive: true,
    })),
  });

  // ===== Periode aktif =====
  await prisma.skpPeriod.create({
    data: {
      id: PERIODE_ID,
      name: "SKP 2026",
      year: 2026,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    },
  });

  // Tidak ada rencana/realisasi/log awal — periode bersih untuk alur real.

  // ===== Ringkasan verifikasi =====
  const count = await prisma.employee.count();
  const byRole = await prisma.employee.groupBy({ by: ["role"], _count: { role: true } });
  const periods = await prisma.skpPeriod.findMany();
  console.log(`
Seed Perpus 2026 (Opsi A) selesai:
  Pegawai: ${count} (admin 1 + organik 35)
  Per role: ${byRole.map((r) => `${r.role}=${r._count.role}`).join(", ")}
  Periode: ${periods.map((p) => `${p.id} ${p.name} ${p.startDate}→${p.endDate}`).join(", ")}
  Tree:
    Suwondo (pimpinan_1) — Direktur
    └─ Sulasdi (pimpinan_2) — Manajer TU
       ├─ Nuryati (pimpinan_3) — Supervisor Kearsipan → 8 staf
       └─ Linda  (pimpinan_3) — Supervisor Perpus    → 23 staf
  Login: suwondo@dpupk.go.id / password
         sulasdi@dpupk.go.id / password
         nuryati@dpupk.go.id / password
         linda.wahyuningsih@dpupk.go.id / password
         admin@dpupk.go.id / password
  Catatan: semua password awal "password", segera ganti via Pengaturan/Admin.
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => (prisma as any).$disconnect());
