import { prisma } from "../lib/prisma";

/**
 * Seeder SKP DPUPK — Format terbaru 2026-08-31
 * Mencerminkan struktur UI terkini:
 * - PerformancePlan: title, target, progress, createdAt, plannedDate/plannedTime
 * - PlanTarget: customTargets hanya untuk direktur (max 5), target = jumlah kolom
 * - Realization: title/value/description/date/time/uploadedBy
 * - Attachment & ActivityLog
 *
 * Skenario: Direktur 5 webinar (4 customTargets + 1) dilimpahkan hierarkis,
 * porsi total anak tidak melebihi induk (validasi UI).
 *
 * Tree:
 *  DIREKTUR (pl-webinar-5) : 5 webinar — 5 customTargets, target 5, progress 20%
 *   ├── Siti (pl-siti-seri-a) : 3 webinar, target 3, progress 33% — planned 2026-02-20
 *   │    ├── Rina (pl-rina-teknis) : 2 webinar teknis, target 2, progress 50% — realisasi 1/2
 *   │    └── Joko (pl-joko-evaluasi) : 1 webinar evaluasi, target 1, progress 0%
 *   └── Agus (pl-agus-seri-b) : 2 webinar, target 2, progress 0% — planned 2026-02-22
 *        ├── Dewi (pl-dewi-sosialisasi) : 1 webinar sosialisasi, target 1
 *        └── Budi (pl-budi-dokumentasi)  : 1 webinar dokumentasi, target 1
 *
 * Sum porsi: Siti 3 + Agus 2 = 5 (induk 5) ✓
 *            Rina 2 + Joko 1 = 3 (Siti 3) ✓
 *            Dewi 1 + Budi 1 = 2 (Agus 2) ✓
 * Progress: Rina 1/2=50% → Siti 1/3=33% → Root 1/5=20%
 */

const PERIODE = "sp2026";

async function main() {
  // ===== Reset =====
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.realizationTarget.deleteMany();
  await prisma.realization.deleteMany();
  await prisma.planTarget.deleteMany();
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

  const base = { skpPeriodId: PERIODE };

  // ===== LEVEL 1 — DIREKTUR: 5 webinar dengan 5 customTargets (target = 5) =====
  const root = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-webinar-5",
      parentId: null,
      createdBy: "e-direktur",
      assignedTo: "e-direktur",
      title: "Menyelenggarakan 5 webinar pelayanan publik",
      target: "5", // = jumlah customTargets (format direktur)
      progress: 20, // 1 realisasi turunan / 5
      createdAt: "2026-01-05 09:00",
      plannedDate: "2026-02-15",
      plannedTime: "09:00",
    }
  });

  // CustomTargets hanya direktur (max 5) — contoh format UI Modals/CustomTargetsEditorInline
  await prisma.planTarget.createMany({
    data: [
      { planId: root.id, name: "jumlah peserta", value: "300", unit: "orang" },
      { planId: root.id, name: "durasi", value: "120", unit: "menit" },
      { planId: root.id, name: "narasumber", value: "3", unit: "orang" },
      { planId: root.id, name: "materi", value: "5", unit: "modul" },
      { planId: root.id, name: "kepuasan", value: "85", unit: "persen" },
    ]
  });

  // ===== LEVEL 2 — Supervisor =====
  const supA = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-siti-seri-a",
      parentId: root.id,
      createdBy: "e-direktur",
      assignedTo: "e-siti",
      title: "Mengoordinasikan pelaksanaan 3 webinar Seri A (teknis & evaluasi)",
      target: "3", // 2+1 =3
      progress: 33, // 1/3 via Rina
      createdAt: "2026-01-06 10:00",
      plannedDate: "2026-02-20",
      plannedTime: "09:30",
    }
  });
  const supB = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-agus-seri-b",
      parentId: root.id,
      createdBy: "e-direktur",
      assignedTo: "e-agus",
      title: "Mengoordinasikan pelaksanaan 2 webinar Seri B (sosialisasi & dokumentasi)",
      target: "2", // 1+1=2
      progress: 0,
      createdAt: "2026-01-06 10:30",
      plannedDate: "2026-02-22",
      plannedTime: "10:00",
    }
  });

  // ===== LEVEL 3 — Staff pelaksana =====
  const sA1 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-rina-teknis",
      parentId: supA.id,
      createdBy: "e-siti",
      assignedTo: "e-rina",
      title: "Melaksanakan 2 webinar teknis registrasi peserta",
      target: "2",
      progress: 50, // 1/2
      createdAt: "2026-01-08 09:00",
      plannedDate: "2026-03-01",
      plannedTime: "09:00",
    }
  });
  const sA2 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-joko-evaluasi",
      parentId: supA.id,
      createdBy: "e-siti",
      assignedTo: "e-joko",
      title: "Melaksanakan 1 webinar evaluasi layanan",
      target: "1",
      progress: 0,
      createdAt: "2026-01-08 09:30",
      plannedDate: "2026-03-05",
      plannedTime: "13:00",
    }
  });
  const sB1 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-dewi-sosialisasi",
      parentId: supB.id,
      createdBy: "e-agus",
      assignedTo: "e-dewi",
      title: "Melaksanakan 1 webinar sosialisasi kebijakan",
      target: "1",
      progress: 0,
      createdAt: "2026-01-08 14:00",
      plannedDate: "2026-03-10",
      plannedTime: "10:00",
    }
  });
  const sB2 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-budi-dokumentasi",
      parentId: supB.id,
      createdBy: "e-agus",
      assignedTo: "e-budi",
      title: "Melaksanakan 1 webinar dokumentasi & arsip digital",
      target: "1",
      progress: 0,
      createdAt: "2026-01-08 14:30",
      plannedDate: "2026-03-12",
      plannedTime: "08:30",
    }
  });

  // ===== Realisasi (tiap entri = 1 progress, format terbaru: title/value/description/date/time/uploadedBy) =====
  const r1 = await prisma.realization.create({
    data: {
      performancePlanId: sA1.id,
      title: "Webinar Teknis 1 - Registrasi Peserta",
      realizationValue: "1",
      realizationDescription: "Webinar teknis registrasi ke-1 terselenggara, 250 peserta hadir",
      realizationDate: "2026-03-15",
      realizationTime: "09:30",
      uploadedBy: "e-rina",
      createdAt: "2026-03-15 16:00",
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
      createdAt: "2026-03-15 16:00",
    }
  });
  // Target terealisasi — diisi pengaju (contoh: Rina isi capaian per kolom)
  await prisma.realizationTarget.createMany({
    data: [
      { realizationId: r1.id, name: "jumlah peserta", value: "250", unit: "orang" },
      { realizationId: r1.id, name: "durasi", value: "110", unit: "menit" },
    ]
  });

  // ===== Audit log =====
  await prisma.activityLog.createMany({
    data: [
      { id: "log-1", userId: "e-direktur", userName: "Bambang Wijaya", action: "Membuat rencana kinerja", description: "Kewajiban menyelenggarakan 5 webinar (5 target kustom)", entityType: "performance_plan", entityId: root.id, createdAt: "2026-01-05 09:00" },
      { id: "log-2", userId: "e-direktur", userName: "Bambang Wijaya", action: "Pelimpahan kinerja", description: "Melimpahkan 5 webinar kepada Siti Rahayu (3) dan Agus Prasetyo (2)", entityType: "performance_plan", entityId: root.id, createdAt: "2026-01-06 10:30" },
      { id: "log-3", userId: "e-siti", userName: "Siti Rahayu", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Rina Marlina (2) dan Joko Santoso (1)", entityType: "performance_plan", entityId: supA.id, createdAt: "2026-01-08 13:45" },
      { id: "log-4", userId: "e-agus", userName: "Agus Prasetyo", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Dewi Lestari (1) dan Budi Hermawan (1)", entityType: "performance_plan", entityId: supB.id, createdAt: "2026-01-08 14:20" },
      { id: "log-5", userId: "e-rina", userName: "Rina Marlina", action: "Mengirim realisasi", description: "Realisasi 1 webinar teknis (50%) + bukti sertifikat", entityType: "realization", entityId: r1.id, createdAt: "2026-03-15 16:10" },
    ]
  });

  // Log customTargets & realizationTargets untuk verifikasi
  const targets = await prisma.planTarget.findMany({ where: { planId: root.id } });
  const rTargets = await prisma.realizationTarget.findMany({ where: { realizationId: r1.id } });
  console.log(`
Seed selesai — format terbaru 2026-08-31 (5 WEBINAR + customTargets + realizationTargets):

DIREKTUR (pl-webinar-5) : 5 webinar [5 customTargets] — 20% (1/5)
  customTargets: ${targets.map(t => `${t.name} ${t.value} ${t.unit}`).join(', ')}
├── Siti    (pl-siti-seri-a) : 3 webinar [33%] — planned 2026-02-20 09:30
│   ├── Rina (pl-rina-teknis) : 2 webinar teknis [50% 1/2] — realisasi 1 + targets [${rTargets.map(t=>`${t.name} ${t.value} ${t.unit}`).join(', ')}]
│   └── Joko (pl-joko-evaluasi) : 1 webinar evaluasi [0%]
└── Agus    (pl-agus-seri-b) : 2 webinar [0%] — planned 2026-02-22 10:00
    ├── Dewi (pl-dewi-sosialisasi) : 1 webinar sosialisasi [0%]
    └── Budi (pl-budi-dokumentasi) : 1 webinar dokumentasi [0%]

Total 5 = 3+2 = (2+1)+(1+1) — semua porsi valid (tidak melebihi induk)
Semua rencana punya createdAt + plannedDate/plannedTime
Login: direktur@dpupk.go.id / password
`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => (prisma as any).$disconnect());
