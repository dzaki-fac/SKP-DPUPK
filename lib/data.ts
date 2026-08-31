import type { Employee, SkpPeriod, PerformancePlan, Realization, Attachment, ActivityLog } from "./types";
import { ROLE_SHORT } from "./roles";

export const seedEmployees: Employee[] = [
  // Penting: indeks array dipakai landing page (zidan) & demo login —
  // indeks 0 wajib pimpinan_1 (Direktur), indeks 7 wajib admin.
  { id: "e1", userId: "u1", employeeNumber: "198001012006041001", name: "Dr. H. Bambang Wijaya, M.Si", email: "direktur@dpupk.go.id", supervisorId: null, role: "pimpinan_1", avatar: "BW", isActive: true },
  { id: "e2", userId: "u2", employeeNumber: "198502152009031002", name: "Siti Rahayu, S.T., M.T", email: "siti.rahayu@dpupk.go.id", supervisorId: "e1", role: "pimpinan_2", avatar: "SR", isActive: true },
  { id: "e3", userId: "u3", employeeNumber: "198703202010011003", name: "Agus Prasetyo, S.E", email: "agus.p@dpupk.go.id", supervisorId: "e1", role: "pimpinan_2", avatar: "AP", isActive: true },
  { id: "e4", userId: "u4", employeeNumber: "199001052015031004", name: "Rina Marlina, A.Md", email: "rina.m@dpupk.go.id", supervisorId: "e2", role: "pimpinan_3", avatar: "RM", isActive: true },
  { id: "e5", userId: "u5", employeeNumber: "199205182016021005", name: "Joko Santoso, S.Kom", email: "joko.s@dpupk.go.id", supervisorId: "e2", role: "pimpinan_3", avatar: "JS", isActive: true },
  { id: "e6", userId: "u6", employeeNumber: "199310102017011006", name: "Dewi Lestari, S.T", email: "dewi.l@dpupk.go.id", supervisorId: "e4", role: "staf", avatar: "DL", isActive: true },
  { id: "e7", userId: "u7", employeeNumber: "199408252018022007", name: "Budi Hermawan, S.E", email: "budi.h@dpupk.go.id", supervisorId: "e5", role: "staf", avatar: "BH", isActive: true },
  { id: "e8", userId: "u8", employeeNumber: "198805122008012008", name: "Admin Sistem", email: "admin@dpupk.go.id", supervisorId: null, role: "admin", avatar: "AD", isActive: true },
  { id: "e9", userId: "u9", employeeNumber: "199601152019022009", name: "Fitri Handayani, A.Md", email: "fitri.h@dpupk.go.id", supervisorId: "e4", role: "staf", avatar: "FH", isActive: true },
  { id: "e10", userId: "u10", employeeNumber: "199702202020012010", name: "Gunawan Saputra, S.E", email: "gunawan.s@dpupk.go.id", supervisorId: "e5", role: "staf", avatar: "GS", isActive: true },
];

export const seedPeriods: SkpPeriod[] = [
  { id: "sp2026", name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" },
  { id: "sp1", name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" },
  { id: "sp2", name: "SKP 2025", year: 2025, startDate: "2025-01-01", endDate: "2025-12-31" },
  { id: "sp3", name: "SKP Semester I 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-06-30" },
];

// Rencana webinar 5 + workshop/pelatihan (diadaptasi dari main, id pegawai dipetakan e1..e8)
export const seedPlans: PerformancePlan[] = [
  {
    id: "pl-webinar-5", parentId: null, skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e1",
    title: "Menyelenggarakan 5 webinar pelayanan publik", target: "5", progress: 80,
    createdAt: "2026-01-05 09:00", plannedDate: "2026-02-15", plannedTime: "09:00",
    customTargets: [
      { id: "ct-1", name: "jumlah peserta", value: "300", unit: "orang" },
      { id: "ct-2", name: "durasi", value: "120", unit: "menit" },
      { id: "ct-3", name: "narasumber", value: "3", unit: "orang" },
      { id: "ct-4", name: "materi", value: "5", unit: "modul" },
      { id: "ct-5", name: "kepuasan", value: "85", unit: "persen" },
    ]
  },
  {
    id: "pl-siti-seri-a", parentId: "pl-webinar-5", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e2",
    title: "Mengoordinasikan pelaksanaan 3 webinar Seri A (teknis & evaluasi)", target: "3", progress: 67,
    createdAt: "2026-01-06 10:00", plannedDate: "2026-02-20", plannedTime: "09:30",
  },
  {
    id: "pl-agus-seri-b", parentId: "pl-webinar-5", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e3",
    title: "Mengoordinasikan pelaksanaan 2 webinar Seri B (sosialisasi & dokumentasi)", target: "2", progress: 100,
    createdAt: "2026-01-06 10:30", plannedDate: "2026-02-22", plannedTime: "10:00",
  },
  {
    id: "pl-rina-teknis", parentId: "pl-siti-seri-a", skpPeriodId: "sp2026", createdBy: "e2", assignedTo: "e4",
    title: "Melaksanakan 2 webinar teknis registrasi peserta", target: "2", progress: 50,
    createdAt: "2026-01-08 09:00", plannedDate: "2026-03-01", plannedTime: "09:00",
  },
  {
    id: "pl-joko-evaluasi", parentId: "pl-siti-seri-a", skpPeriodId: "sp2026", createdBy: "e2", assignedTo: "e5",
    title: "Melaksanakan 1 webinar evaluasi layanan", target: "1", progress: 100,
    createdAt: "2026-01-08 09:30", plannedDate: "2026-03-05", plannedTime: "13:00",
  },
  {
    id: "pl-dewi-sosialisasi", parentId: "pl-agus-seri-b", skpPeriodId: "sp2026", createdBy: "e3", assignedTo: "e6",
    title: "Melaksanakan 1 webinar sosialisasi kebijakan", target: "1", progress: 100,
    createdAt: "2026-01-08 14:00", plannedDate: "2026-03-10", plannedTime: "10:00",
  },
  {
    id: "pl-budi-dokumentasi", parentId: "pl-agus-seri-b", skpPeriodId: "sp2026", createdBy: "e3", assignedTo: "e7",
    title: "Melaksanakan 1 webinar dokumentasi & arsip digital", target: "1", progress: 100,
    createdAt: "2026-01-08 14:30", plannedDate: "2026-03-12", plannedTime: "08:30",
  },
  {
    id: "pl-pelatihan-2", parentId: null, skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e1",
    title: "Menyelenggarakan 2 pelatihan peningkatan kapasitas", target: "2", progress: 50,
    createdAt: "2026-01-10 09:00", plannedDate: "2026-04-01", plannedTime: "08:00",
    customTargets: [
      { id: "ct-p1", name: "peserta", value: "40", unit: "orang" },
      { id: "ct-p2", name: "jam", value: "16", unit: "jam" },
    ]
  },
  {
    id: "pl-inovasi-1", parentId: null, skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e1",
    title: "Mendorong 1 inovasi layanan digital", target: "1", progress: 100,
    createdAt: "2026-01-12 10:00", plannedDate: "2026-04-15", plannedTime: "09:00",
    customTargets: [{ id: "ct-i1", name: "prototype", value: "1", unit: "unit" }]
  },
  {
    id: "pl-workshop-3", parentId: null, skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e1",
    title: "Menyelenggarakan 3 workshop inovasi layanan", target: "3", progress: 33,
    createdAt: "2026-01-15 09:00", plannedDate: "2026-04-10", plannedTime: "09:00",
    customTargets: [
      { id: "ct-w1", name: "peserta", value: "50", unit: "orang" },
      { id: "ct-w2", name: "sesi", value: "6", unit: "sesi" },
      { id: "ct-w3", name: "kepuasan", value: "80", unit: "persen" },
    ]
  },
  {
    id: "pl-workshop-siti-2", parentId: "pl-workshop-3", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e2",
    title: "Mengoordinasikan 2 workshop teknis", target: "2", progress: 50,
    createdAt: "2026-01-16 09:00", plannedDate: "2026-04-12", plannedTime: "09:00",
  },
  {
    id: "pl-workshop-agus-1", parentId: "pl-workshop-3", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e3",
    title: "Mengoordinasikan 1 workshop dokumentasi", target: "1", progress: 0,
    createdAt: "2026-01-16 09:30", plannedDate: "2026-04-14", plannedTime: "10:00",
  },
];

export const seedRealizations: Realization[] = [
  {
    id: "r1", planId: "pl-rina-teknis", title: "Webinar Teknis 1 - Registrasi Peserta", value: "1",
    description: "Webinar teknis registrasi ke-1 terselenggara, 250 peserta hadir", date: "2026-03-15", time: "09:30", uploadedBy: "e4",
    targets: [
      { id: "rt1", name: "jumlah peserta", value: "250", unit: "orang" },
      { id: "rt2", name: "durasi", value: "110", unit: "menit" },
    ],
    participants: [
      { id: "rp1", employeeId: "e5", role: "Moderator" },
      { id: "rp2", employeeId: "e6", role: "Narasumber" },
    ]
  },
  {
    id: "r2", planId: "pl-joko-evaluasi", title: "Webinar Evaluasi Layanan - Sesi 1", value: "1",
    description: "Evaluasi layanan tahap 1 selesai, 80 peserta memberi feedback", date: "2026-03-18", time: "10:00", uploadedBy: "e5",
    targets: [{ id: "rt3", name: "peserta", value: "80", unit: "orang" }],
    participants: [{ id: "rp3", employeeId: "e4", role: "Notulis" }]
  },
  {
    id: "r3", planId: "pl-dewi-sosialisasi", title: "Webinar Sosialisasi Kebijakan - Tahap 1", value: "1",
    description: "Sosialisasi kebijakan 1 selesai, 120 peserta hadir", date: "2026-03-22", time: "09:00", uploadedBy: "e6",
    targets: [{ id: "rt4", name: "peserta", value: "120", unit: "orang" }],
    participants: [{ id: "rp4", employeeId: "e7", role: "Dokumentasi" }]
  },
  {
    id: "r4", planId: "pl-budi-dokumentasi", title: "Arsip Digital - Batch 1", value: "1",
    description: "100 arsip berhasil didigitalisasi", date: "2026-03-25", time: "08:30", uploadedBy: "e7",
    targets: [{ id: "rt5", name: "arsip", value: "100", unit: "berkas" }],
    participants: []
  },
  {
    id: "r5", planId: "pl-workshop-siti-2", title: "Workshop Teknis 1 - Inovasi", value: "1",
    description: "Workshop teknis inovasi selesai, 45 peserta", date: "2026-04-20", time: "09:00", uploadedBy: "e2",
    targets: [
      { id: "rt6", name: "peserta", value: "45", unit: "orang" },
      { id: "rt7", name: "sesi", value: "3", unit: "sesi" },
    ],
    participants: [{ id: "rp5", employeeId: "e4", role: "Peserta" }]
  },
  {
    id: "r6", planId: "pl-pelatihan-2", title: "Pelatihan Kapasitas - Angkatan 1", value: "1",
    description: "Pelatihan angkatan 1 selesai, 40 peserta", date: "2026-04-05", time: "08:00", uploadedBy: "e1",
    targets: [{ id: "rt8", name: "peserta", value: "40", unit: "orang" }],
    participants: [{ id: "rp6", employeeId: "e2", role: "Instruktur" }]
  },
  {
    id: "r7", planId: "pl-inovasi-1", title: "Prototype Inovasi - Siap Uji", value: "1",
    description: "Prototype layanan digital selesai", date: "2026-04-18", time: "10:00", uploadedBy: "e1",
    targets: [{ id: "rt9", name: "prototype", value: "1", unit: "unit" }],
    participants: []
  },
];

export const seedAttachments: Attachment[] = [
  { id: "a1", planId: "pl-rina-teknis", realizationId: "r1", fileName: "Sertifikat_Webinar_Teknis_1.pdf", filePath: "/uploads/webinar-teknis-1.pdf", fileSize: "850 KB", uploadedBy: "e4", date: "2026-03-15" },
  { id: "a2", planId: "pl-joko-evaluasi", realizationId: "r2", fileName: "Laporan_Evaluasi_Sesi1.pdf", filePath: "/uploads/evaluasi-sesi1.pdf", fileSize: "1.2 MB", uploadedBy: "e5", date: "2026-03-18" },
  { id: "a3", planId: "pl-dewi-sosialisasi", realizationId: "r3", fileName: "Materi_Sosialisasi_1.pdf", filePath: "/uploads/sosialisasi-1.pdf", fileSize: "2.0 MB", uploadedBy: "e6", date: "2026-03-22" },
  { id: "a4", planId: "pl-budi-dokumentasi", realizationId: "r4", fileName: "Rekap_Arsip_Batch1.xlsx", filePath: "/uploads/arsip-batch1.xlsx", fileSize: "890 KB", uploadedBy: "e7", date: "2026-03-25" },
  { id: "a5", planId: "pl-inovasi-1", realizationId: "r7", fileName: "Prototype_Spec.pdf", filePath: "/uploads/prototype.pdf", fileSize: "3.1 MB", uploadedBy: "e1", date: "2026-04-18" },
];

export const seedLogs: ActivityLog[] = [
  { id: "log-1", userId: "e1", userName: "Bambang Wijaya", action: "Membuat rencana kinerja", description: "Kewajiban menyelenggarakan 5 webinar (5 target kustom)", entityType: "performance_plan", entityId: "pl-webinar-5", createdAt: "2026-01-05 09:00" },
  { id: "log-2", userId: "e1", userName: "Bambang Wijaya", action: "Pelimpahan kinerja", description: "Melimpahkan 5 webinar kepada Siti Rahayu (3) dan Agus Prasetyo (2)", entityType: "performance_plan", entityId: "pl-webinar-5", createdAt: "2026-01-06 10:30" },
  { id: "log-3", userId: "e2", userName: "Siti Rahayu", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Rina Marlina (2) dan Joko Santoso (1)", entityType: "performance_plan", entityId: "pl-siti-seri-a", createdAt: "2026-01-08 13:45" },
  { id: "log-4", userId: "e3", userName: "Agus Prasetyo", action: "Pelimpahan kinerja", description: "Menurunkan koordinasi ke Dewi Lestari (1) dan Budi Hermawan (1)", entityType: "performance_plan", entityId: "pl-agus-seri-b", createdAt: "2026-01-08 14:20" },
  { id: "log-5", userId: "e4", userName: "Rina Marlina", action: "Mengirim realisasi", description: "Realisasi 1 webinar teknis (50%) + bukti sertifikat", entityType: "realization", entityId: "r1", createdAt: "2026-03-15 16:10" },
  { id: "log-6", userId: "e5", userName: "Joko Santoso", action: "Mengirim realisasi", description: "Webinar Evaluasi Sesi 1 + target peserta 80", entityType: "realization", entityId: "r2", createdAt: "2026-03-18 11:00" },
  { id: "log-7", userId: "e6", userName: "Dewi Lestari", action: "Mengirim realisasi", description: "Sosialisasi Tahap 1 + peserta 120", entityType: "realization", entityId: "r3", createdAt: "2026-03-22 10:00" },
];

export const roleLabel = ROLE_SHORT;
