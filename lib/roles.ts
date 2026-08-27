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

/**
 * Role yang boleh DIBUAT oleh seorang pembuat akun, berdasarkan jabatannya.
 * Pimpinan hanya dapat membuat role yang lebih rendah, tidak boleh yang setara/lebih tinggi.
 */
export const CREATEABLE_ROLES: Record<Role, Role[]> = {
  admin: ["admin", "pimpinan_1", "pimpinan_2", "pimpinan_3", "staf"],
  pimpinan_1: ["pimpinan_2", "pimpinan_3", "staf"],
  pimpinan_2: ["pimpinan_3", "staf"],
  pimpinan_3: ["staf"],
  staf: [],
};

export function canCreateRole(creator: Role, target: Role): boolean {
  return CREATEABLE_ROLES[creator]?.includes(target) ?? false;
}

export function canCreateAnyRole(creator: Role): boolean {
  return (CREATEABLE_ROLES[creator]?.length ?? 0) > 0;
}

/** Kumpulkan semua id keturunan (subtree) dari `rootId` dalam hierarki supervisorId. */
export function descendantIds(all: OrgRow[], rootId: string): string[] {
  const out: string[] = [];
  const queue: string[] = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of all) {
      if (e.supervisorId === cur) {
        out.push(e.id);
        queue.push(e.id);
      }
    }
  }
  return out;
}

/**
 * Apakah pembuat (creator) diperbolehkan membuat pegawai ber-role `target`
 * dengan atasan `supervisorId`? Menggabungkan matrix role + batas subtree.
 * - admin: bebas (tanpa batas supervisor tertentu), role di-refine validasi lain.
 * - pimpinan: target harus di bawahnya, dan atasan harus berada dalam subtree-nya.
 */
export function canCreateAs(
  creator: OrgRow,
  target: Role,
  supervisorId: string | null,
  hierarchy: OrgRow[]
): { ok: boolean; error?: string } {
  const creatorRole = creator.role;
  if (creatorRole === "admin") return { ok: true };
  if (!canCreateRole(creatorRole, target)) {
    return { ok: false, error: `${ROLE_LABEL[creatorRole]} tidak berwenang membuat ${ROLE_LABEL[target].toLowerCase()}.` };
  }
  if (creatorRole === "staf") {
    return { ok: false, error: "Staf tidak berwenang membuat akun." };
  }
  // Atasan harus berada dalam subtree pembuat (kecuali atasan otomatis = pembuat).
  if (supervisorId === creator.id) return { ok: true };
  if (!supervisorId) {
    return { ok: false, error: "Atasan wajib ditentukan untuk pegawai baru." };
  }
  const subs = new Set(descendantIds(hierarchy, creator.id));
  if (!subs.has(supervisorId)) {
    return { ok: false, error: "Atasan tidak berada dalam lingkup kewenangan Anda." };
  }
  return { ok: true };
}

/**
 * Apakah pengelola (manager) boleh MENGELOLA akun `target`.
 * Berbasis subtree supervisorId, bukan role semata:
 * - admin: selalu diizinkan (unrestricted).
 * - lainnya: hanya dirinya sendiri dan keturunan (subtree) nyata di bawahnya.
 * Sibling (atasan yang sama, role setara) TIDAK termasuk subtree — tidak bisa saling kelola.
 */
export function canManageTarget(
  manager: OrgRow,
  target: OrgRow,
  hierarchy: OrgRow[]
): { ok: boolean; error?: string } {
  if (manager.role === "admin") return { ok: true };
  if (manager.id === target.id) return { ok: true };
  if (manager.role === "staf") {
    return { ok: false, error: "Staf tidak berwenang mengelola akun lain." };
  }
  const subs = new Set(descendantIds(hierarchy, manager.id));
  if (!subs.has(target.id)) {
    return { ok: false, error: "Akun tersebut berada di luar lingkup kewenangan Anda." };
  }
  return { ok: true };
}

/**
 * Validasi perubahan atasan oleh pengelola non-admin:
 * atasan baru wajib tetap berada dalam subtree pengelola agar akun tidak berpindah keluar
 * dari kewenangannya.
 */
export function canAssignSupervisor(
  manager: OrgRow,
  newSupervisorId: string | null,
  hierarchy: OrgRow[]
): { ok: boolean; error?: string } {
  if (manager.role === "admin") return { ok: true };
  if (newSupervisorId == null) {
    return { ok: false, error: "Pimpinan tidak dapat menghapus relasi atasan akun dalam kekuasaannya." };
  }
  if (newSupervisorId === manager.id) return { ok: true };
  const subs = new Set(descendantIds(hierarchy, manager.id));
  if (!subs.has(newSupervisorId)) {
    return { ok: false, error: "Atasan baru berada di luar lingkup kewenangan Anda." };
  }
  return { ok: true };
}