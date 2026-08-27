import type { Role } from "./types";

export const ROLES: Role[] = ["admin", "pimpinan_1", "pimpinan_2", "pimpinan_3", "staf"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  pimpinan_1: "Pimpinan 1 (Direktur)",
  pimpinan_2: "Pimpinan 2",
  pimpinan_3: "Pimpinan 3",
  staf: "Staf",
};

export const ROLE_SHORT: Record<Role, string> = {
  admin: "Admin",
  pimpinan_1: "Direktur",
  pimpinan_2: "Pimpinan 2",
  pimpinan_3: "Pimpinan 3",
  staf: "Staf",
};

export const ROLE_LEVEL: Record<Role, number> = {
  admin: 0,
  pimpinan_1: 1,
  pimpinan_2: 2,
  pimpinan_3: 3,
  staf: 4,
};

export function isPimpinanRole(r: Role): boolean {
  return r === "pimpinan_1" || r === "pimpinan_2" || r === "pimpinan_3";
}

export function isHierarchyRole(r: Role): boolean {
  return r !== "admin";
}

export function isValidRole(r: string): r is Role {
  return (ROLES as string[]).includes(r);
}

export function roleLabel(r: Role): string {
  return ROLE_SHORT[r] ?? r;
}

/** Jabatan yang harus menjadi atasan langsung dari `role` (tepat satu tingkat di atas). */
export function roleAbove(r: Role): Role | null {
  if (r === "pimpinan_2") return "pimpinan_1";
  if (r === "pimpinan_3") return "pimpinan_2";
  if (r === "staf") return "pimpinan_3";
  return null;
}

export interface OrgRow {
  id: string;
  role: Role;
  supervisorId: string | null;
}

export interface OrgPatch {
  role?: Role;
  supervisorId?: string | null;
}

/**
 * Validasi murni (tanpa DB) untuk perubahan relasi organisasi.
 * Dipakai server (API) maupun client (store) agar hasil konsisten.
 * Aturan:
 *  - hanya 5 role yang dikenal
 *  - tepat 1 pimpinan_1; tidak boleh diubah/dihapus bila itu satu-satunya
 *  - admin & pimpinan_1 tanpa atasan; hierarki lain wajib punya atasan satu tingkat di atas
 *  - tidak boleh siklus, tidak boleh atasan = diri sendiri
 *  - perubahan role tidak boleh membuat bawahan langsung kehilangan atasan yang valid
 */
export function validateOrgChange(
  all: OrgRow[],
  targetId: string,
  current: OrgRow,
  patch: OrgPatch
): { ok: boolean; error?: string } {
  const role = patch.role ?? current.role;
  const supervisorId = patch.supervisorId !== undefined ? patch.supervisorId : current.supervisorId;

  if (!isValidRole(role)) return { ok: false, error: "Role tidak valid — hanya: admin, pimpinan_1, pimpinan_2, pimpinan_3, staf." };

  const label = ROLE_LABEL[role];

  if (supervisorId === targetId) return { ok: false, error: "Atasan tidak boleh menjadi dirinya sendiri." };

  // Tepat 1 Direktur (pimpinan_1)
  if (role === "pimpinan_1") {
    const others = all.filter((x) => x.id !== targetId && x.role === "pimpinan_1").length;
    if (others > 0) return { ok: false, error: "Hanya boleh ada 1 Direktur (pimpinan_1). Pindahkan/ubah jabatan direktur yang ada lebih dulu." };
  } else if (current.role === "pimpinan_1") {
    const allDir = all.filter((x) => x.role === "pimpinan_1").length;
    if (allDir <= 1) return { ok: false, error: "Tidak bisa mengubah/menghapus Direktur terakhir — harus selalu ada 1 Direktur (pimpinan_1)." };
  }

  // Keberadaan atasan + anti-siklus
  let sup: OrgRow | null = null;
  if (supervisorId) {
    sup = all.find((x) => x.id === supervisorId) ?? null;
    if (!sup) return { ok: false, error: "Atasan yang dipilih tidak ditemukan." };
    let cur: string | null = supervisorId;
    const visited = new Set<string>();
    while (cur) {
      if (cur === targetId) return { ok: false, error: "Tidak boleh: relasi ini akan membentuk siklus hierarki." };
      if (visited.has(cur)) break;
      visited.add(cur);
      const row = all.find((x) => x.id === cur);
      cur = row?.supervisorId ?? null;
    }
  }

  // Aturan level jabatan
  if (role === "pimpinan_1" && supervisorId) {
    return { ok: false, error: "Direktur (pimpinan_1) adalah pimpinan tertinggi dan tidak boleh memiliki atasan." };
  }
  if (role === "admin" && supervisorId) {
    return { ok: false, error: "Administrator berada di luar hierarki organisasi dan tidak boleh memiliki atasan." };
  }
  if (role !== "pimpinan_1" && role !== "admin" && !supervisorId) {
    return { ok: false, error: `${label} harus memiliki atasan satu tingkat di atasnya.` };
  }
  if (supervisorId && sup) {
    if (sup.role === "admin") return { ok: false, error: "Administrator tidak bisa menjadi atasan pegawai lain." };
    const expected = roleAbove(role);
    if (!expected || sup.role !== expected) {
      return { ok: false, error: `Atasan ${label} harus berjabatan ${ROLE_LABEL[expected ?? role]} (satu tingkat di atas), bukan ${ROLE_LABEL[sup.role]}.` };
    }
  }

  // Konsistensi bawahan saat jabatan berubah
  if (patch.role !== undefined && patch.role !== current.role) {
    const directSubs = all.filter((x) => x.supervisorId === targetId);
    for (const sub of directSubs) {
      const required = roleAbove(sub.role);
      if (required && required !== role) {
        return { ok: false, error: `Bawahan langsung (${ROLE_LABEL[sub.role]}) akan kehilangan atasan yang valid dengan perubahan ini — pindahkan bawahan tersebut terlebih dahulu.` };
      }
    }
  }

  return { ok: true };
}

/** Validasi untuk membuat pegawai baru. `next` memuat role & supervisorId yang diinginkan. */
export function validateOrgCreate(all: OrgRow[], next: OrgRow): { ok: boolean; error?: string } {
  if (!isValidRole(next.role)) return { ok: false, error: "Role tidak valid — hanya: admin, pimpinan_1, pimpinan_2, pimpinan_3, staf." };
  return validateOrgChange(all, next.id, next, {});
}

/** Buat daftar calon atasan yang valid untuk sebuah role (untuk <select> di UI). */
export function validSupervisors(employees: OrgRow[], role: Role): OrgRow[] {
  const expected = roleAbove(role);
  if (!expected) return [];
  return employees.filter((e) => e.role === expected);
}