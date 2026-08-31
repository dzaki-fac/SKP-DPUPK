import type { Employee, EmployeeSupervisor, SkpPeriod, PerformancePlan, Realization, Attachment, ActivityLog } from "./types";
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
  // sp2026 = id produksi (prisma/seed.ts) — diletakkan pertama agar jadi default fallback
  { id: "sp2026", name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" },
  { id: "sp1", name: "SKP 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" },
  { id: "sp2", name: "SKP 2025", year: 2025, startDate: "2025-01-01", endDate: "2025-12-31" },
  { id: "sp3", name: "SKP Semester I 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-06-30" },
];

export const seedPlans: PerformancePlan[] = [
  { id: "pl1", parentId: null, skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e1", title: "Meningkatkan kualitas pelayanan pelanggan", target: "90", progress: 82 },
  { id: "pl2", parentId: "pl1", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e2", title: "Mengoptimalkan kecepatan pelayanan", target: "95", progress: 90 },
  { id: "pl3", parentId: "pl1", skpPeriodId: "sp2026", createdBy: "e1", assignedTo: "e3", title: "Meningkatkan akurasi pelayanan", target: "98", progress: 75 },
  { id: "pl4", parentId: "pl2", skpPeriodId: "sp2026", createdBy: "e2", assignedTo: "e4", title: "Memproses permohonan pelanggan maksimal 2 hari", target: "100", progress: 80 },
  { id: "pl5", parentId: "pl2", skpPeriodId: "sp2026", createdBy: "e2", assignedTo: "e5", title: "Melakukan verifikasi berkas harian", target: "120", progress: 92 },
  { id: "pl6", parentId: "pl3", skpPeriodId: "sp2026", createdBy: "e3", assignedTo: "e6", title: "Meningkatkan kepuasan pelanggan melalui survey", target: "200", progress: 70 },
  { id: "pl7", parentId: "pl3", skpPeriodId: "sp2026", createdBy: "e3", assignedTo: "e7", title: "Pengelolaan arsip pelayanan", target: "500", progress: 45 },
  // Rencana staf (di luar cascade) agar "input kegiatan" staf bisa ditest
  { id: "pl8", parentId: null, skpPeriodId: "sp2026", createdBy: "e6", assignedTo: "e6", title: "Penyusunan laporan harian pelayanan", target: "200", progress: 60 },
  { id: "pl9", parentId: null, skpPeriodId: "sp2026", createdBy: "e9", assignedTo: "e9", title: "Pemutakhiran data kepegawaian", target: "150", progress: 40 },
];

export const seedRealizations: Realization[] = [
  { id: "r1", planId: "pl4", title: "Webinar Teknis 1 - Registrasi", value: "80", description: "80 laporan selesai dari 100 target", date: "2026-04-15" },
  { id: "r2", planId: "pl5", title: "Verifikasi Batch April", value: "110", description: "110 berkas diverifikasi", date: "2026-04-20" },
  { id: "r3", planId: "pl6", title: "Survey Kepuasan Q1", value: "140", description: "140 responden survey", date: "2026-04-10" },
  { id: "r4", planId: "pl7", title: "Arsip Digital Tahap 1", value: "180", description: "180 dokumen diarsipkan", date: "2026-03-28" },
];

export const seedAttachments: Attachment[] = [
  { id: "a1", planId: "pl4", realizationId: "r1", fileName: "Laporan_Permohonan_April.pdf", fileSize: "2.4 MB", uploadedBy: "e4", date: "2026-04-15" },
  { id: "a2", planId: "pl5", realizationId: "r2", fileName: "Rekap_Verifikasi.xlsx", fileSize: "1.1 MB", uploadedBy: "e5", date: "2026-04-20" },
];

export const seedLogs: ActivityLog[] = [
  { id: "l1", userId: "e1", userName: "Bambang Wijaya", action: "Membuat rencana kinerja", description: "Membuat rencana 'Meningkatkan kualitas pelayanan pelanggan'", entityType: "performance_plan", entityId: "pl1", createdAt: "2026-01-05 09:12" },
  { id: "l2", userId: "e1", userName: "Bambang Wijaya", action: "Pelimpahan kinerja", description: "Melimpahkan rencana kepada Siti Rahayu dan Agus Prasetyo", entityType: "performance_plan", entityId: "pl1", createdAt: "2026-01-06 10:30" },
  { id: "l3", userId: "e2", userName: "Siti Rahayu", action: "Membuat turunan rencana", description: "Membuat rencana turunan untuk Rina Marlina", entityType: "performance_plan", entityId: "pl4", createdAt: "2026-01-08 13:45" },
  { id: "l4", userId: "e4", userName: "Rina Marlina", action: "Mengirim realisasi", description: "Mengirim realisasi 80% untuk 'Memproses permohonan pelanggan'", entityType: "realization", entityId: "r1", createdAt: "2026-04-15 14:20" },
  { id: "l5", userId: "e2", userName: "Siti Rahayu", action: "Menyetujui realisasi", description: "Menyetujui realisasi Rina Marlina", entityType: "realization", entityId: "r1", createdAt: "2026-04-18 09:05" },
];

// Relasi/history Staff ↔ Pimpinan (demo).
// 1 NIP = 1 Employee. Aktif = endDate null. 
// - Dewi (e6): aktif di bawah Rina (e4) — riwayat sebelumnya Agus (e3) → Rina (Januari→Maret 2026), lalu pindah ke Rina.
// - Budi (e7): aktif di bawah Rina (e4) sekaligus Joko (e5) — contoh 2 pimpinan aktif.
// - Fitri (e9), Gunawan (e10): sesuai supervisorId aslinya.
export const seedSupervisors: EmployeeSupervisor[] = [
  // (e6) Dewi: history pindah pimpinan Agus → Rina
  { id: "es1", employeeId: "e6", supervisorId: "e3", startDate: "2026-01-01", endDate: "2026-03-31", createdAt: "2026-01-01" },
  { id: "es2", employeeId: "e6", supervisorId: "e4", startDate: "2026-04-01", endDate: null, createdAt: "2026-04-01" },
  // (e7) Budi: 2 pimpinan aktif (Rina + Joko)
  { id: "es3", employeeId: "e7", supervisorId: "e5", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
  { id: "es4", employeeId: "e7", supervisorId: "e4", startDate: "2026-06-01", endDate: null, createdAt: "2026-06-01" },
  // (e9) Fitri & (e10) Gunawan: 1 pimpinan aktif sesuai struktur utama
  { id: "es5", employeeId: "e9", supervisorId: "e4", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
  { id: "es6", employeeId: "e10", supervisorId: "e5", startDate: "2026-01-01", endDate: null, createdAt: "2026-01-01" },
];

export const roleLabel = ROLE_SHORT;