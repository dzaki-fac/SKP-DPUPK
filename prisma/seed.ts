import { prisma } from "../lib/prisma";

/**
 * Seeder SKP DPUPK — Skenario: Direktur wajib 6 webinar, dilimpahkan ke bawah.
 *
 * Tree cascading:
 *   DIREKTUR: Menyelenggarakan 6 webinar (target 6)
 *   ├── SUPERVISOR Siti   : Koordinasi Seri A (target 3)
 *   │     ├── Staff Rina  : Pelaksana 2 webinar teknis
 *   │     └── Staff Joko  : Pelaksana 1 webinar evaluasi
 *   └── SUPERVISOR Agus   : Koordinasi Seri B (target 3)
 *         ├── Staff Dewi  : Pelaksana 2 webinar sosialisasi
 *         └── Staff Budi  : Pelaksana 1 webinar dokumentasi
 */

const PERIODE = "sp2026";

async function main() {
  // ===== Reset =====
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.realization.deleteMany();
  await prisma.performancePlan.deleteMany();
  await prisma.skpPeriod.deleteMany();
  await prisma.employee.deleteMany();

  // ===== Pegawai (role = jabatan tunggal) =====
  await prisma.employee.createMany({
    data: [
      { id: "e-direktur", userId: "u-direktur", employeeNumber: "198001012006041001", name: "Dr. H. Bambang Wijaya, M.Si", email: "direktur@dpupk.go.id", supervisorId: null, role: "direktur", avatar: "BW" },
      { id: "e-siti", userId: "u-siti", employeeNumber: "198502152009031002", name: "Siti Rahayu, S.T., M.T", email: "siti.rahayu@dpupk.go.id", supervisorId: "e-direktur", role: "supervisor", avatar: "SR" },
      { id: "e-agus", userId: "u-agus", employeeNumber: "198703202010011003", name: "Agus Prasetyo, S.E", email: "agus.p@dpupk.go.id", supervisorId: "e-direktur", role: "supervisor", avatar: "AP" },
      { id: "e-rina", userId: "u-rina", employeeNumber: "199001052015031004", name: "Rina Marlina, A.Md", email: "rina.m@dpupk.go.id", supervisorId: "e-siti", role: "staff", avatar: "RM" },
      { id: "e-joko", userId: "u-joko", employeeNumber: "199205182016021005", name: "Joko Santoso, S.Kom", email: "joko.s@dpupk.go.id", supervisorId: "e-siti", role: "staff", avatar: "JS" },
      { id: "e-dewi", userId: "u-dewi", employeeNumber: "199310102017011006", name: "Dewi Lestari, S.T", email: "dewi.l@dpupk.go.id", supervisorId: "e-agus", role: "staff", avatar: "DL" },
      { id: "e-budi", userId: "u-budi", employeeNumber: "199408252018022007", name: "Budi Hermawan, S.E", email: "budi.h@dpupk.go.id", supervisorId: "e-agus", role: "staff", avatar: "BH" },
      { id: "e-admin", userId: "u-admin", employeeNumber: "198805122008012008", name: "Admin Sistem", email: "admin@dpupk.go.id", supervisorId: null, role: "admin", avatar: "AD" },
    ]
  });

  // ===== Periode =====
  await prisma.skpPeriod.create({
    data: { id: PERIODE, name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" }
  });

  const base = {
    skpPeriodId: PERIODE,
  };

  // ===== LEVEL 1 — DIREKTUR: kewajiban 6 webinar =====
  // Progress dihitung otomatis: Siti 33% (1/3) + Agus 0% (0/3) = 1/6 = 17%
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

  // ===== LEVEL 2 — Supervisor masing-masing koordinasi 3 webinar =====
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

  // ===== LEVEL 3 — Staff pelaksana =====
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
  const sA2 = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: supA.id,
      createdBy: "e-siti",
      assignedTo: "e-joko",
      title: "Melaksanakan 1 webinar evaluasi layanan",
      target: "1",
      progress: 0,
    }
  });
  const sB1 = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: supB.id,
      createdBy: "e-agus",
      assignedTo: "e-dewi",
      title: "Melaksanakan 2 webinar sosialisasi kebijakan",
      target: "2",
      progress: 0,
    }
  });
  const sB2 = await prisma.performancePlan.create({
    data: {
      ...base,
      parentId: supB.id,
      createdBy: "e-agus",
      assignedTo: "e-budi",
      title: "Melaksanakan 1 webinar dokumentasi & arsip digital",
      target: "1",
      progress: 0,
    }
  });

  // ===== Realisasi contoh (Rina sudah 1 dari 2, diajukan) =====
  const r1 = await prisma.realization.create({
    data: {
      performancePlanId: sA1.id,
      title: "Webinar Teknis 1 - Registrasi Peserta",
      realizationValue: "1",
      realizationDescription: "Webinar teknis registrasi ke-1 terselenggara, 250 peserta hadir",
      realizationDate: "2026-03-15",
      realizationTime: "09:30",
      uploadedBy: "e-rina",
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
      { id: "log-3", userId: "e-siti", userName: "Siti Rahayu", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Rina Marlina dan Joko Santoso", entityType: "performance_plan", entityId: supA.id, createdAt: "2026-01-08 13:45" },
      { id: "log-4", userId: "e-agus", userName: "Agus Prasetyo", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Dewi Lestari dan Budi Hermawan", entityType: "performance_plan", entityId: supB.id, createdAt: "2026-01-08 14:20" },
      { id: "log-5", userId: "e-rina", userName: "Rina Marlina", action: "Mengirim realisasi", description: "Realisasi 1 webinar teknis (50%) + bukti sertifikat", entityType: "realization", entityId: r1.id, createdAt: "2026-03-15 16:10" },
    ]
  });

  console.log(`
Seed selesai — skenario 6 WEBINAR:

DIREKTUR (pl-webinar-6) : 6 webinar [dilimpahkan]
├── Siti    : 3 webinar Seri A [dilimpahkan]
│   ├── Rina : 2 webinar teknis    [aktif, realisasi 1/2 diajukan]
│   └── Joko : 1 webinar evaluasi  [aktif]
└── Agus    : 3 webinar Seri B [dilimpahkan]
    ├── Dewi : 2 webinar sosialisasi [aktif]
    └── Budi : 1 webinar dokumentasi [draft]

Total 6 webinar = 2+1+2+1 (staff) terkoordinasi 3+3 (supervisor)
Login: direktur@dpupk.go.id / password
`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => (prisma as any).$disconnect());
