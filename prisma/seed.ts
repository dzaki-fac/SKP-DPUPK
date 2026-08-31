import { prisma } from "../lib/prisma";

/**
 * Seeder SKP DPUPK ΓÇö Format terbaru 2026-08-31
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
 *  DIREKTUR (pl-webinar-5) : 5 webinar ΓÇö 5 customTargets, target 5, progress 20%
 *   Γö£ΓöÇΓöÇ Siti (pl-siti-seri-a) : 3 webinar, target 3, progress 33% ΓÇö planned 2026-02-20
 *   Γöé    Γö£ΓöÇΓöÇ Rina (pl-rina-teknis) : 2 webinar teknis, target 2, progress 50% ΓÇö realisasi 1/2
 *   Γöé    ΓööΓöÇΓöÇ Joko (pl-joko-evaluasi) : 1 webinar evaluasi, target 1, progress 0%
 *   ΓööΓöÇΓöÇ Agus (pl-agus-seri-b) : 2 webinar, target 2, progress 0% ΓÇö planned 2026-02-22
 *        Γö£ΓöÇΓöÇ Dewi (pl-dewi-sosialisasi) : 1 webinar sosialisasi, target 1
 *        ΓööΓöÇΓöÇ Budi (pl-budi-dokumentasi)  : 1 webinar dokumentasi, target 1
 *
 * Sum porsi: Siti 3 + Agus 2 = 5 (induk 5) Γ£ô
 *            Rina 2 + Joko 1 = 3 (Siti 3) Γ£ô
 *            Dewi 1 + Budi 1 = 2 (Agus 2) Γ£ô
 * Progress: Rina 1/2=50% ΓåÆ Siti 1/3=33% ΓåÆ Root 1/5=20%
 */

const PERIODE = "sp2026";

async function main() {
  // ===== Reset =====
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.realizationParticipant.deleteMany();
  await prisma.realizationTarget.deleteMany();
  await prisma.realization.deleteMany();
  await prisma.planTarget.deleteMany();
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
      { id: "e-joko", userId: "u-joko", employeeNumber: "199205182016021005", name: "Joko Santoso, S.Kom", email: "joko.s@dpupk.go.id", supervisorId: "e-siti", role: "pimpinan_3", avatar: "JS" },
      { id: "e-dewi", userId: "u-dewi", employeeNumber: "199310102017011006", name: "Dewi Lestari, S.T", email: "dewi.l@dpupk.go.id", supervisorId: "e-agus", role: "pimpinan_3", avatar: "DL" },
      { id: "e-budi", userId: "u-budi", employeeNumber: "199408252018022007", name: "Budi Hermawan, S.E", email: "budi.h@dpupk.go.id", supervisorId: "e-agus", role: "pimpinan_3", avatar: "BH" },
      { id: "e-fitri", userId: "u-fitri", employeeNumber: "199601152019022009", name: "Fitri Handayani, A.Md", email: "fitri.h@dpupk.go.id", supervisorId: "e-rina", role: "staf", avatar: "FH" },
      { id: "e-gunawan", userId: "u-gunawan", employeeNumber: "199702202020012010", name: "Gunawan Saputra, S.E", email: "gunawan.s@dpupk.go.id", supervisorId: "e-joko", role: "staf", avatar: "GS" },
      { id: "e-p3a2", userId: "u-p3a2", employeeNumber: "199312082018022011", name: "Nina Kartika, S.T., M.T", email: "nina.k@dpupk.go.id", supervisorId: "e-siti", role: "pimpinan_3", avatar: "NK" },
      { id: "e-staf-a21", userId: "u-staf-a21", employeeNumber: "199604122020021012", name: "Rudi Hartono, S.Kom", email: "rudi.h@dpupk.go.id", supervisorId: "e-p3a2", role: "staf", avatar: "RH" },
      { id: "e-staf-a22", userId: "u-staf-a22", employeeNumber: "199902182021021013", name: "Sri Wahyuni, A.Md", email: "sri.w@dpupk.go.id", supervisorId: "e-p3a2", role: "staf", avatar: "SW" },
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

  const base = { skpPeriodId: PERIODE };

  // ===== LEVEL 1 ΓÇö DIREKTUR: 5 webinar dengan 5 customTargets (target = 5) =====
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

  // CustomTargets hanya direktur (max 5) ΓÇö contoh format UI Modals/CustomTargetsEditorInline
  await prisma.planTarget.createMany({
    data: [
      { planId: root.id, name: "jumlah peserta", value: "300", unit: "orang" },
      { planId: root.id, name: "durasi", value: "120", unit: "menit" },
      { planId: root.id, name: "narasumber", value: "3", unit: "orang" },
      { planId: root.id, name: "materi", value: "5", unit: "modul" },
      { planId: root.id, name: "kepuasan", value: "85", unit: "persen" },
    ]
  });

  // ===== LEVEL 2 ΓÇö Supervisor =====
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

  // ===== LEVEL 3 ΓÇö Staff pelaksana =====
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

  // ===== Rencana baru (tambahan) ΓÇö 2 top-level + 1 workshop =====
  const addRoot1 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-pelatihan-2",
      parentId: null,
      createdBy: "e-direktur",
      assignedTo: "e-direktur",
      title: "Menyelenggarakan 2 pelatihan peningkatan kapasitas",
      target: "2",
      progress: 50, // 1/2 via rPelatihan
      createdAt: "2026-01-10 09:00",
      plannedDate: "2026-04-01",
      plannedTime: "08:00",
    }
  });
  await prisma.planTarget.createMany({
    data: [
      { planId: addRoot1.id, name: "peserta", value: "40", unit: "orang" },
      { planId: addRoot1.id, name: "jam", value: "16", unit: "jam" },
    ]
  });
  const addRoot2 = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-inovasi-1",
      parentId: null,
      createdBy: "e-direktur",
      assignedTo: "e-direktur",
      title: "Mendorong 1 inovasi layanan digital",
      target: "1",
      progress: 100,
      createdAt: "2026-01-12 10:00",
      plannedDate: "2026-04-15",
      plannedTime: "09:00",
    }
  });
  await prisma.planTarget.create({
    data: { planId: addRoot2.id, name: "prototype", value: "1", unit: "unit" }
  });
  const addWorkshop = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-workshop-3",
      parentId: null,
      createdBy: "e-direktur",
      assignedTo: "e-direktur",
      title: "Menyelenggarakan 3 workshop inovasi layanan",
      target: "3",
      progress: 33, // 1/3 via Siti
      createdAt: "2026-01-15 09:00",
      plannedDate: "2026-04-10",
      plannedTime: "09:00",
    }
  });
  await prisma.planTarget.createMany({
    data: [
      { planId: addWorkshop.id, name: "peserta", value: "50", unit: "orang" },
      { planId: addWorkshop.id, name: "sesi", value: "6", unit: "sesi" },
      { planId: addWorkshop.id, name: "kepuasan", value: "80", unit: "persen" },
    ]
  });
  const wSiti = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-workshop-siti-2",
      parentId: addWorkshop.id,
      createdBy: "e-direktur",
      assignedTo: "e-siti",
      title: "Mengoordinasikan 2 workshop teknis",
      target: "2",
      progress: 50, // 1/2
      createdAt: "2026-01-16 09:00",
      plannedDate: "2026-04-12",
      plannedTime: "09:00",
    }
  });
  const wAgus = await prisma.performancePlan.create({
    data: {
      ...base,
      id: "pl-workshop-agus-1",
      parentId: addWorkshop.id,
      createdBy: "e-direktur",
      assignedTo: "e-agus",
      title: "Mengoordinasikan 1 workshop dokumentasi",
      target: "1",
      progress: 0,
      createdAt: "2026-01-16 09:30",
      plannedDate: "2026-04-14",
      plannedTime: "10:00",
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
  // Target terealisasi ΓÇö diisi pengaju (contoh: Rina isi capaian per kolom)
  await prisma.realizationTarget.createMany({
    data: [
      { realizationId: r1.id, name: "jumlah peserta", value: "250", unit: "orang" },
      { realizationId: r1.id, name: "durasi", value: "110", unit: "menit" },
    ]
  });
  // Pegawai terlibat ΓÇö dipilih pengaju + peran
  await prisma.realizationParticipant.createMany({
    data: [
      { realizationId: r1.id, employeeId: "e-joko", role: "Moderator" },
      { realizationId: r1.id, employeeId: "e-dewi", role: "Narasumber" },
    ]
  });

  // ===== Realisasi tambahan (baru) ΓÇö untuk rencana yang tadinya 0% =====
  const r2 = await prisma.realization.create({
    data: {
      performancePlanId: sA2.id, // Joko
      title: "Webinar Evaluasi Layanan - Sesi 1",
      realizationValue: "1",
      realizationDescription: "Evaluasi layanan tahap 1 selesai, 80 peserta memberi feedback",
      realizationDate: "2026-03-18",
      realizationTime: "10:00",
      uploadedBy: "e-joko",
      createdAt: "2026-03-18 11:00",
    }
  });
  await prisma.realizationTarget.create({ data: { realizationId: r2.id, name: "peserta", value: "80", unit: "orang" } });
  await prisma.realizationParticipant.create({ data: { realizationId: r2.id, employeeId: "e-rina", role: "Notulis" } });
  await prisma.attachment.create({ data: { performancePlanId: sA2.id, realizationId: r2.id, fileName: "Laporan_Evaluasi_Sesi1.pdf", filePath: "/uploads/evaluasi-sesi1.pdf", fileSize: "1.2 MB", uploadedBy: "e-joko", date: "2026-03-18" } });

  const r3 = await prisma.realization.create({
    data: {
      performancePlanId: sB1.id, // Dewi
      title: "Webinar Sosialisasi Kebijakan - Tahap 1",
      realizationValue: "1",
      realizationDescription: "Sosialisasi kebijakan 1 selesai, 120 peserta hadir",
      realizationDate: "2026-03-22",
      realizationTime: "09:00",
      uploadedBy: "e-dewi",
      createdAt: "2026-03-22 10:00",
    }
  });
  await prisma.realizationTarget.create({ data: { realizationId: r3.id, name: "peserta", value: "120", unit: "orang" } });
  await prisma.realizationParticipant.create({ data: { realizationId: r3.id, employeeId: "e-budi", role: "Dokumentasi" } });
  await prisma.attachment.create({ data: { performancePlanId: sB1.id, realizationId: r3.id, fileName: "Materi_Sosialisasi_1.pdf", filePath: "/uploads/sosialisasi-1.pdf", fileSize: "2.0 MB", uploadedBy: "e-dewi", date: "2026-03-22" } });

  const r4 = await prisma.realization.create({
    data: {
      performancePlanId: sB2.id, // Budi
      title: "Arsip Digital - Batch 1",
      realizationValue: "1",
      realizationDescription: "100 arsip berhasil didigitalisasi",
      realizationDate: "2026-03-25",
      realizationTime: "08:30",
      uploadedBy: "e-budi",
      createdAt: "2026-03-25 09:00",
    }
  });
  await prisma.realizationTarget.create({ data: { realizationId: r4.id, name: "arsip", value: "100", unit: "berkas" } });
  await prisma.attachment.create({ data: { performancePlanId: sB2.id, realizationId: r4.id, fileName: "Rekap_Arsip_Batch1.xlsx", filePath: "/uploads/arsip-batch1.xlsx", fileSize: "890 KB", uploadedBy: "e-budi", date: "2026-03-25" } });

  const r5 = await prisma.realization.create({
    data: {
      performancePlanId: wSiti.id, // Workshop Siti
      title: "Workshop Teknis 1 - Inovasi",
      realizationValue: "1",
      realizationDescription: "Workshop teknis inovasi selesai, 45 peserta",
      realizationDate: "2026-04-20",
      realizationTime: "09:00",
      uploadedBy: "e-siti",
      createdAt: "2026-04-20 10:00",
    }
  });
  await prisma.realizationTarget.createMany({ data: [
    { realizationId: r5.id, name: "peserta", value: "45", unit: "orang" },
    { realizationId: r5.id, name: "sesi", value: "3", unit: "sesi" },
  ]});
  await prisma.realizationParticipant.create({ data: { realizationId: r5.id, employeeId: "e-rina", role: "Peserta" } });

  const r6 = await prisma.realization.create({
    data: {
      performancePlanId: addRoot1.id, // Pelatihan
      title: "Pelatihan Kapasitas - Angkatan 1",
      realizationValue: "1",
      realizationDescription: "Pelatihan angkatan 1 selesai, 40 peserta",
      realizationDate: "2026-04-05",
      realizationTime: "08:00",
      uploadedBy: "e-direktur",
      createdAt: "2026-04-05 09:00",
    }
  });
  await prisma.realizationTarget.create({ data: { realizationId: r6.id, name: "peserta", value: "40", unit: "orang" } });
  await prisma.realizationParticipant.create({ data: { realizationId: r6.id, employeeId: "e-siti", role: "Instruktur" } });

  const r7 = await prisma.realization.create({
    data: {
      performancePlanId: addRoot2.id, // Inovasi
      title: "Prototype Inovasi - Siap Uji",
      realizationValue: "1",
      realizationDescription: "Prototype layanan digital selesai",
      realizationDate: "2026-04-18",
      realizationTime: "10:00",
      uploadedBy: "e-direktur",
      createdAt: "2026-04-18 11:00",
    }
  });
  await prisma.realizationTarget.create({ data: { realizationId: r7.id, name: "prototype", value: "1", unit: "unit" } });
  await prisma.attachment.create({ data: { performancePlanId: addRoot2.id, realizationId: r7.id, fileName: "Prototype_Spec.pdf", filePath: "/uploads/prototype.pdf", fileSize: "3.1 MB", uploadedBy: "e-direktur", date: "2026-04-18" } });

  // Update progress yang tadinya 0% jadi sesuai realisasi baru
  await prisma.performancePlan.update({ where: { id: sA2.id }, data: { progress: 100 } });
  await prisma.performancePlan.update({ where: { id: sB1.id }, data: { progress: 100 } });
  await prisma.performancePlan.update({ where: { id: sB2.id }, data: { progress: 100 } });
  await prisma.performancePlan.update({ where: { id: supA.id }, data: { progress: 67 } }); // Siti 2/3 (Rina+Joko)
  await prisma.performancePlan.update({ where: { id: supB.id }, data: { progress: 100 } }); // Agus 2/2
  await prisma.performancePlan.update({ where: { id: root.id }, data: { progress: 80 } }); // 4/5 (Rina,Joko,Dewi,Budi)
  // Workshop & pelatihan progress sudah set di atas (50,100, etc.) ΓÇö biarkan

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
  const rParts = await prisma.realizationParticipant.findMany({ where: { realizationId: r1.id } });
  console.log(`
Seed selesai ΓÇö format terbaru 2026-08-31 (5 WEBINAR + customTargets + realizationTargets + participants):

DIREKTUR (pl-webinar-5) : 5 webinar [5 customTargets] ΓÇö 20% (1/5)
  customTargets: ${targets.map(t => `${t.name} ${t.value} ${t.unit}`).join(', ')}
Γö£ΓöÇΓöÇ Siti    (pl-siti-seri-a) : 3 webinar [33%] ΓÇö planned 2026-02-20 09:30
Γöé   Γö£ΓöÇΓöÇ Rina (pl-rina-teknis) : 2 webinar teknis [50% 1/2] ΓÇö realisasi 1 + targets [${rTargets.map(t=>`${t.name} ${t.value} ${t.unit}`).join(', ')}] + terlibat [${rParts.map(p=>p.employeeId+':'+p.role).join(', ')}]
Γöé   ΓööΓöÇΓöÇ Joko (pl-joko-evaluasi) : 1 webinar evaluasi [0%]
ΓööΓöÇΓöÇ Agus    (pl-agus-seri-b) : 2 webinar [0%] ΓÇö planned 2026-02-22 10:00
    Γö£ΓöÇΓöÇ Dewi (pl-dewi-sosialisasi) : 1 webinar sosialisasi [0%]
    ΓööΓöÇΓöÇ Budi (pl-budi-dokumentasi) : 1 webinar dokumentasi [0%]

Total 5 = 3+2 = (2+1)+(1+1) ΓÇö semua porsi valid (tidak melebihi induk)
Semua rencana punya createdAt + plannedDate/plannedTime
Login: direktur@dpupk.go.id / password
`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => (prisma as any).$disconnect());
