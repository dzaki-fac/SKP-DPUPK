import { prisma } from "../lib/prisma";

/**
 * Seeder SKP DPUPK — role = jabatan tunggal (5 role).
 * Org: Direktur (pimpinan_1) → pimpinan_2 → pimpinan_3 → staf; admin di luar hierarki.
 * Skenario cascading: "6 webinar pelayanan publik".
 */

const PERIODE = "sp2026";

async function main() {
  // ===== Reset =====
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.realization.deleteMany();
  await prisma.performancePlan.deleteMany();
  await prisma.skpPeriod.deleteMany();
  await prisma.employeeSupervisor.deleteMany();
  await prisma.employee.deleteMany();

  // ===== Pegawai (role = jabatan tunggal) =====
  await prisma.employee.createMany({
    data: [
      { id: "e-direktur", userId: "u-direktur", employeeNumber: "198001012006041001", name: "Dr. H. Bambang Wijaya, M.Si", email: "direktur@dpupk.go.id", supervisorId: null, role: "pimpinan_1", avatar: "BW" },
      { id: "e-siti", userId: "u-siti", employeeNumber: "198502152009031002", name: "Siti Rahayu, S.T., M.T", email: "siti.rahayu@dpupk.go.id", supervisorId: "e-direktur", role: "pimpinan_2", avatar: "SR" },
      { id: "e-agus", userId: "u-agus", employeeNumber: "198703202010011003", name: "Agus Prasetyo, S.E", email: "agus.p@dpupk.go.id", supervisorId: "e-direktur", role: "pimpinan_2", avatar: "AP" },
      { id: "e-rina", userId: "u-rina", employeeNumber: "199001052015031004", name: "Rina Marlina, A.Md", email: "rina.m@dpupk.go.id", supervisorId: "e-siti", role: "pimpinan_3", avatar: "RM" },
      { id: "e-joko", userId: "u-joko", employeeNumber: "199205182016021005", name: "Joko Santoso, S.Kom", email: "joko.s@dpupk.go.id", supervisorId: "e-agus", role: "pimpinan_3", avatar: "JS" },
      { id: "e-dewi", userId: "u-dewi", employeeNumber: "199310102017011006", name: "Dewi Lestari, S.T", email: "dewi.l@dpupk.go.id", supervisorId: "e-rina", role: "staf", avatar: "DL" },
      { id: "e-fitri", userId: "u-fitri", employeeNumber: "199601152019022009", name: "Fitri Handayani, A.Md", email: "fitri.h@dpupk.go.id", supervisorId: "e-rina", role: "staf", avatar: "FH" },
      { id: "e-budi", userId: "u-budi", employeeNumber: "199408252018022007", name: "Budi Hermawan, S.E", email: "budi.h@dpupk.go.id", supervisorId: "e-joko", role: "staf", avatar: "BH" },
      { id: "e-gunawan", userId: "u-gunawan", employeeNumber: "199702202020012010", name: "Gunawan Saputra, S.E", email: "gunawan.s@dpupk.go.id", supervisorId: "e-joko", role: "staf", avatar: "GS" },

      // ── Pimpinan 2 A (Siti) → Pimpinan 3 A2 (kabinet kedua) ──────────────
      { id: "e-p3a2", userId: "u-p3a2", employeeNumber: "199312082018022011", name: "Nina Kartika, S.T., M.T", email: "nina.k@dpupk.go.id", supervisorId: "e-siti", role: "pimpinan_3", avatar: "NK" },
      { id: "e-staf-a21", userId: "u-staf-a21", employeeNumber: "199604122020021012", name: "Rudi Hartono, S.Kom", email: "rudi.h@dpupk.go.id", supervisorId: "e-p3a2", role: "staf", avatar: "RH" },
      { id: "e-staf-a22", userId: "u-staf-a22", employeeNumber: "199902182021021013", name: "Sri Wahyuni, A.Md", email: "sri.w@dpupk.go.id", supervisorId: "e-p3a2", role: "staf", avatar: "SW" },

      // ── Pimpinan 2 B (Agus) → Pimpinan 3 B2 (kabinet kedua) ──────────────
      { id: "e-p3b2", userId: "u-p3b2", employeeNumber: "198911062017021014", name: "Fajar Nugroho, S.T", email: "fajar.n@dpupk.go.id", supervisorId: "e-agus", role: "pimpinan_3", avatar: "FN" },
      { id: "e-staf-b21", userId: "u-staf-b21", employeeNumber: "199711232020012015", name: "Lukman Hakim, S.E", email: "lukman.h@dpupk.go.id", supervisorId: "e-p3b2", role: "staf", avatar: "LH" },
      { id: "e-staf-b22", userId: "u-staf-b22", employeeNumber: "200005302021022016", name: "Indah Permata, S.Ak", email: "indah.p@dpupk.go.id", supervisorId: "e-p3b2", role: "staf", avatar: "IP" },

      { id: "e-admin", userId: "u-admin", employeeNumber: "198805122008012008", name: "Admin Sistem", email: "admin@dpupk.go.id", supervisorId: null, role: "admin", avatar: "AD" },
    ]
  });

  // ===== Relasi/history Staff ↔ Pimpinan (1 NIP = 1 Employee) =====
  // Aktif = endDate NULL; riwayat = endDate terisi (relasi lama tetap tersimpan).
  // Demonstrasi: Dewi berpindah pimpinan (Agus → Rina), Budi punya 2 pimpinan aktif.
  await prisma.employeeSupervisor.createMany({
    data: [
      // Dewi: history pindah pimpinan Agus (Jan–Mar) → Rina (aktif)
      { id: "es-dewi-1", employeeId: "e-dewi", supervisorId: "e-agus", startDate: "2026-01-01", endDate: "2026-03-31", createdAt: "2026-01-01" },
      { id: "es-dewi-2", employeeId: "e-dewi", supervisorId: "e-rina", startDate: "2026-04-01", endDate: null, createdAt: "2026-04-01" },
      // Fitri: 1 pimpinan aktif (Rina)
      { id: "es-fitri", employeeId: "e-fitri", supervisorId: "e-rina", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      // Budi: 2 pimpinan aktif (Joko + Rina)
      { id: "es-budi-1", employeeId: "e-budi", supervisorId: "e-joko", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      { id: "es-budi-2", employeeId: "e-budi", supervisorId: "e-rina", startDate: "2026-06-01", endDate: null, createdAt: "2026-06-01" },
      // Gunawan: 1 pimpinan aktif (Joko)
      { id: "es-gunawan", employeeId: "e-gunawan", supervisorId: "e-joko", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      // Staf kabinet kedua: 1 pimpinan aktif
      { id: "es-a21", employeeId: "e-staf-a21", supervisorId: "e-p3a2", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      { id: "es-a22", employeeId: "e-staf-a22", supervisorId: "e-p3a2", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      { id: "es-b21", employeeId: "e-staf-b21", supervisorId: "e-p3b2", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
      { id: "es-b22", employeeId: "e-staf-b22", supervisorId: "e-p3b2", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
    ]
  });

  // ===== Periode =====
  await prisma.skpPeriod.create({
    data: { id: PERIODE, name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" }
  });

  const base = {
    skpPeriodId: PERIODE,
  };

  // ===== LEVEL 1 — DIREKTUR (pimpinan_1): kewajiban 6 webinar =====
  const root = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-webinar-6",
      parentId: null,
      createdBy: "e-direktur",
      assignedTo: "e-direktur",
      title: "Menyelenggarakan 6 webinar pelayanan publik",
      target: "6",
      progress: 17,
    }
  });

  // ===== LEVEL 2 — pimpinan_2: koordinasi 3+3 webinar =====
  const supA = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: root.id,
      createdBy: "e-direktur",
      assignedTo: "e-siti",
      title: "Mengoordinasikan pelaksanaan 3 webinar Seri A (teknis & evaluasi)",
      target: "3",
      progress: 33,
    }
  });
  const supB = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: root.id,
      createdBy: "e-direktur",
      assignedTo: "e-agus",
      title: "Mengoordinasikan pelaksanaan 3 webinar Seri B (sosialisasi & dokumentasi)",
      target: "3",
      progress: 0,
    }
  });

  // ===== LEVEL 3 — pimpinan_3: pelaksana per seri =====
  const sA1 = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: supA.id,
      createdBy: "e-siti",
      assignedTo: "e-rina",
      title: "Melaksanakan 2 webinar teknis registrasi peserta",
      target: "2",
      progress: 50,
    }
  });
  const sB1 = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: supB.id,
      createdBy: "e-agus",
      assignedTo: "e-joko",
      title: "Melaksanakan 2 webinar dokumentasi & arsip digital",
      target: "2",
      progress: 0,
    }
  });

  // ===== LEVEL 4 — staf: tugas personal (bukti input kegiatan staf) =====
  await prisma.performancePlan.createMany({
    data: [
      { ...base, id: "pl-staf-dewi", parentId: sA1.id, createdBy: "e-rina", assignedTo: "e-dewi", title: "Menyusun laporan pelaksanaan webinar teknis", target: "2", progress: 0 },
      { ...base, id: "pl-staf-fitri", parentId: sA1.id, createdBy: "e-rina", assignedTo: "e-fitri", title: "Memutakhirkan data peserta webinar teknis", target: "150", progress: 0 },
      { ...base, id: "pl-staf-budi", parentId: sB1.id, createdBy: "e-joko", assignedTo: "e-budi", title: "Mengarsipkan dokumentasi evaluasi layanan", target: "10", progress: 0 },
      { ...base, id: "pl-staf-gunawan", parentId: sB1.id, createdBy: "e-joko", assignedTo: "e-gunawan", title: "Menyusun rekap arsip dokumentasi webinar", target: "50", progress: 0 },
    ]
  });

  // ===== Realisasi contoh (Rina sudah 1 dari 2, diajukan) =====
  const r1 = await prisma.realization.create({
    data: {
      performancePlanId: sA1.id,
      title: "Webinar Teknis 1 - Registrasi Peserta",
      realizationValue: "1",
      realizationDescription: "Webinar teknis registrasi ke-1 terselenggara, 250 peserta hadir",
      realizationDate: "2026-03-15",
    }
  });
  await prisma.attachment.create({
    data: {
      performancePlanId: sA1.id,
      realizationId: r1.id,
      fileName: "Sertifikat_Webinar_Teknis_1.pdf",
      filePath: "/uploads/webinar-teknis-1.pdf",
      fileSize: "850 KB",
      uploadedBy: "e-rina",
      date: "2026-03-15",
    }
  });

  // ===== Audit log alur pelimpahan =====
  await prisma.activityLog.createMany({
    data: [
      { id: "log-1", userId: "e-direktur", userName: "Bambang Wijaya", action: "Membuat rencana kinerja", description: "Kewajiban menyelenggarakan 6 webinar pelayanan publik", entityType: "performance_plan", entityId: root.id, createdAt: "2026-01-05 09:00" },
      { id: "log-2", userId: "e-direktur", userName: "Bambang Wijaya", action: "Pelimpahan kinerja", description: "Melimpahkan 6 webinar kepada Siti Rahayu (Seri A) dan Agus Prasetyo (Seri B)", entityType: "performance_plan", entityId: root.id, createdAt: "2026-01-06 10:30" },
      { id: "log-3", userId: "e-siti", userName: "Siti Rahayu", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Rina Marlina", entityType: "performance_plan", entityId: supA.id, createdAt: "2026-01-08 13:45" },
      { id: "log-4", userId: "e-agus", userName: "Agus Prasetyo", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Joko Santoso", entityType: "performance_plan", entityId: supB.id, createdAt: "2026-01-08 14:20" },
      { id: "log-5", userId: "e-rina", userName: "Rina Marlina", action: "Mengirim realisasi", description: "Realisasi 1 webinar teknis (50%) + bukti sertifikat", entityType: "realization", entityId: r1.id, createdAt: "2026-03-15 16:10" },
    ]
  });

  console.log(`
Seed selesai — skenario 6 WEBINAR (role 5 jabatan):

PIMPINAN_1  : pl-webinar-6 [dilimpahkan]
├── PIMPINAN_2 Siti (A) : 3 webinar Seri A [dilimpahkan]
│   ├── PIMPINAN_3 Rina (A1) : 2 webinar teknis [aktif, realisasi 1/2]
│   │   ├── STAF Dewi     : laporan pelaksanaan webinar teknis
│   │   └── STAF Fitri    : data peserta webinar teknis
│   └── PIMPINAN_3 Nina (A2)
│       ├── STAF Rudi
│       └── STAF Sri
└── PIMPINAN_2 Agus (B) : 3 webinar Seri B [dilimpahkan]
    ├── PIMPINAN_3 Joko (B1) : 2 webinar dokumentasi [aktif]
    │   ├── STAF Budi     : arsip dokumentasi evaluasi
    │   └── STAF Gunawan  : rekap arsip dokumentasi
    └── PIMPINAN_3 Fajar (B2)
        ├── STAF Lukman
        └── STAF Indah

Login (password = 'password'):
  direktur@dpupk.go.id    (pimpinan_1) — lihat seluruh struktur
  siti.rahayu@dpupk.go.id (pimpinan_2) — kelola subtree Siti (A)
  agus.p@dpupk.go.id      (pimpinan_2) — kelola subtree Agus (B)
  rina.m@dpupk.go.id      (pimpinan_3) — kelola staf di bawah Rina (A1)
  dewi.l@dpupk.go.id      (staf)       — data sendiri
  admin@dpupk.go.id       (admin)      — kelola seluruh akun & organisasi
`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => { try { (prisma as { $disconnect?: () => unknown }).$disconnect?.(); } catch {} });