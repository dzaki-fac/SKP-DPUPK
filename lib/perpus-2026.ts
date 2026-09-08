import type { Role } from "./types";

/**
 * Data kanonis pegawai 2026 — Direktorat Perpustakaan, Undip Press dan Kearsipan.
 * Sumber: `NEW PERPUS - penataan pegawai 2026.xlsx` (Sheet1, 35 baris data).
 *
 * Struktur Opsi A (minimalis):
 *  - 1 pimpinan_1 (Direktur, tanpa atasan)
 *  - 1 pimpinan_2 (Manajer TU → Direktur)
 *  - 2 pimpinan_3 (Supervisor Kearsipan & Perpus → Manajer TU)
 *  - 31 staf (8 → Supervisor Kearsipan, 23 → Supervisor Perpus)
 *  - 1 admin (di luar hierarki, dipertahankan dari sistem lama)
 *
 * Catatan pemetaan:
 *  - `role` diambil dari jabatan struktural; jabatan fungsional (setelah "/")
 *    tidak disimpan karena schema Employee tidak punya kolomnya.
 *  - Kolom KET (PNS/Non ASN/Kontrak) sengaja diabaikan — semua diimport aktif.
 *  - Email digenerate (tidak ada di Excel); password awal default "password"
 *    (hash default di schema) — wajib diganti saat serah terima akun.
 */

export interface PerpusSeedEmployee {
  id: string;
  userId: string;
  employeeNumber: string; // NIP (apa adanya, termasuk prefix "H.7.")
  name: string;
  email: string;
  supervisorId: string | null;
  role: Role;
  avatar: string;
  /** Nomor baris di Excel (1-indexed, termasuk header) untuk audit. */
  excelRow: number;
}

export const PERPUS_2026_EMPLOYEES: PerpusSeedEmployee[] = [
  // ── Puncak (Tanpa Sub Bagian) ──
  { id: "e-suwondo", userId: "u-suwondo", employeeNumber: "197607182001121001", name: "Suwondo, S.Hum., M.Kom.", email: "suwondo@dpupk.go.id", supervisorId: null, role: "pimpinan_1", avatar: "SW", excelRow: 2 },
  { id: "e-sulasdi", userId: "u-sulasdi", employeeNumber: "197607112001121001", name: "Sulasdi, S.Kom., M.M., M.Si.", email: "sulasdi@dpupk.go.id", supervisorId: "e-suwondo", role: "pimpinan_2", avatar: "SL", excelRow: 3 },
  // ── Supervisor (pimpinan_3) ──
  { id: "e-nuryati", userId: "u-nuryati", employeeNumber: "198012152008012016", name: "Nuryati, S.E., M.M.", email: "nuryati@dpupk.go.id", supervisorId: "e-sulasdi", role: "pimpinan_3", avatar: "NU", excelRow: 4 },
  { id: "e-linda", userId: "u-linda", employeeNumber: "H.7.198408092021042001", name: "Linda Wahyuningsih, S.I.Kom., M.I.Kom.", email: "linda.wahyuningsih@dpupk.go.id", supervisorId: "e-sulasdi", role: "pimpinan_3", avatar: "LW", excelRow: 5 },
  // ── Staf Kearsipan (8 → Nuryati) ──
  { id: "e-iin", userId: "u-iin", employeeNumber: "197406281994032002", name: "Iin Yuniastuti, S.E.", email: "iin.yuniastuti@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "IY", excelRow: 6 },
  { id: "e-amad", userId: "u-amad", employeeNumber: "197708052002121002", name: "Amad Rosyid, S.E.", email: "amad.rosyid@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "AR", excelRow: 7 },
  { id: "e-turi", userId: "u-turi", employeeNumber: "197510172002122001", name: "Turi Daurita Wirutallingga, A.Md.", email: "turi.daurita@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "TD", excelRow: 8 },
  { id: "e-yuli", userId: "u-yuli", employeeNumber: "198007132014042002", name: "Yuli Tri Wulandari, S.S.T.Ars.", email: "yuli.wulandari@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "YT", excelRow: 9 },
  { id: "e-chafidoh", userId: "u-chafidoh", employeeNumber: "H.7.198311062023102001", name: "Chafidoh, S.Pd.I", email: "chafidoh@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "CH", excelRow: 10 },
  { id: "e-sujud", userId: "u-sujud", employeeNumber: "H.7.198809272024051001", name: "Sujud Darwiko", email: "sujud.darwiko@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "SD", excelRow: 11 },
  { id: "e-anisa", userId: "u-anisa", employeeNumber: "H.7.199807202024052001", name: "Anisa Yuliana Wati, S.S.T.Ars", email: "anisa.wati@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "AY", excelRow: 12 },
  { id: "e-rizky", userId: "u-rizky", employeeNumber: "H.7.199812042024052001", name: "Rizky Nur Utami, A.Md.", email: "rizky.utami@dpupk.go.id", supervisorId: "e-nuryati", role: "staf", avatar: "RU", excelRow: 13 },
  // ── Staf Perpustakaan & Undip Press (23 → Linda) ──
  { id: "e-anita", userId: "u-anita", employeeNumber: "196609181994032001", name: "Dra. Anita Nurmasari", email: "anita.nurmasari@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "AN", excelRow: 14 },
  { id: "e-sriendah", userId: "u-sriendah", employeeNumber: "197005041995012001", name: "Sri Endah Pertiwi, S.Sos, MIP", email: "sri.pertiwi@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "SE", excelRow: 15 },
  { id: "e-pujo", userId: "u-pujo", employeeNumber: "197504211999031001", name: "Pujo Winarno, S.Kom.", email: "pujo.winarno@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "PW", excelRow: 16 },
  { id: "e-suratmi", userId: "u-suratmi", employeeNumber: "196905191994032002", name: "Suratmi, S.IP.", email: "suratmi@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "ST", excelRow: 17 },
  { id: "e-romdha", userId: "u-romdha", employeeNumber: "197808262001122002", name: "Romdha Nugrahani, S.Sos.", email: "romdha.nugrahani@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "RN", excelRow: 18 },
  { id: "e-enny", userId: "u-enny", employeeNumber: "197201122001122001", name: "Enny Anggraeny, S.S.", email: "enny.anggraeny@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "EA", excelRow: 19 },
  { id: "e-fitri", userId: "u-fitri", employeeNumber: "197809052001122002", name: "Fitri Anugraheni, S.Sos.", email: "fitri.anugraheni@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "FA", excelRow: 20 },
  { id: "e-sugeng", userId: "u-sugeng", employeeNumber: "197611011999031004", name: "Sugeng Priyanto, S.S., M.IP.", email: "sugeng.priyanto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "SP", excelRow: 21 },
  { id: "e-ivana", userId: "u-ivana", employeeNumber: "197907262001122001", name: "Ivana Permatasari, S.Sos.", email: "ivana.permatasari@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "IP", excelRow: 22 },
  { id: "e-ana", userId: "u-ana", employeeNumber: "197908022001122001", name: "Ana Faridatunniswah, S.Hum.", email: "ana.faridatunniswah@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "AF", excelRow: 23 },
  { id: "e-eko", userId: "u-eko", employeeNumber: "197307102005011001", name: "Eko Budiyanto, S.S.", email: "eko.budiyanto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "EB", excelRow: 24 },
  { id: "e-budi", userId: "u-budi", employeeNumber: "197004222005011001", name: "Budi Santosa", email: "budi.santosa@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "BS", excelRow: 25 },
  { id: "e-sulasto", userId: "u-sulasto", employeeNumber: "197610312007011001", name: "Sulasto", email: "sulasto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "SS", excelRow: 26 },
  { id: "e-joko", userId: "u-joko", employeeNumber: "197710192008101001", name: "Joko Santoso", email: "joko.santoso@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "JS", excelRow: 27 },
  { id: "e-naswanto", userId: "u-naswanto", employeeNumber: "198011152009101002", name: "Naswanto", email: "naswanto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "NW", excelRow: 28 },
  { id: "e-nasto", userId: "u-nasto", employeeNumber: "H.7.198001102021101001", name: "Nasto", email: "nasto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "NA", excelRow: 29 },
  { id: "e-kasnawi", userId: "u-kasnawi", employeeNumber: "H.7.197709082022101001", name: "Kasnawi", email: "kasnawi@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "KA", excelRow: 30 },
  { id: "e-amira", userId: "u-amira", employeeNumber: "H.7.199705272022102001", name: "Amira Larasati Khairunnisa, A.Md.S.I.", email: "amira.khairunnisa@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "AL", excelRow: 31 },
  { id: "e-heri", userId: "u-heri", employeeNumber: "H.7.198104302022101001", name: "Heri Dwi Pramianto", email: "heri.pramianto@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "HD", excelRow: 32 },
  { id: "e-partini", userId: "u-partini", employeeNumber: "H.7.197408232022102001", name: "Partini", email: "partini@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "PA", excelRow: 33 },
  { id: "e-marthen", userId: "u-marthen", employeeNumber: "H.7.199210292023101001", name: "Marthen Adi Nugroho", email: "marthen.nugroho@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "MA", excelRow: 34 },
  { id: "e-ariesta", userId: "u-ariesta", employeeNumber: "H.7.199404212024052001", name: "Ariesta Nuur Fattaah, S.Hum.", email: "ariesta.fattaah@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "AA", excelRow: 35 },
  { id: "e-sherly", userId: "u-sherly", employeeNumber: "200204110225030091", name: "Sherly Silvia Nugroho, S. Hum", email: "sherly.nugroho@dpupk.go.id", supervisorId: "e-linda", role: "staf", avatar: "SN", excelRow: 36 },
];

export const ADMIN_SEED_EMPLOYEE: PerpusSeedEmployee = {
  id: "e-admin",
  userId: "u-admin",
  employeeNumber: "198805122008012008",
  name: "Admin Sistem",
  email: "admin@dpupk.go.id",
  supervisorId: null,
  role: "admin",
  avatar: "AD",
  excelRow: -1, // tidak berasal dari Excel
};

/** Seluruh akun yang dibuat seed: 35 pegawai + 1 admin. */
export const ALL_SEED_EMPLOYEES: PerpusSeedEmployee[] = [...PERPUS_2026_EMPLOYEES, ADMIN_SEED_EMPLOYEE];
