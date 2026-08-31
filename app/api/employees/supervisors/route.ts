import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { validateOrgChange, canCreateAnyRole, roleAbove, ROLE_LABEL } from "@/lib/roles";
import type { OrgRow } from "@/lib/roles";

function toDTO(s: { id: string; employeeId: string; supervisorId: string; startDate: string; endDate: string | null; createdAt: string }) {
  return { id: s.id, employeeId: s.employeeId, supervisorId: s.supervisorId, startDate: s.startDate, endDate: s.endDate, createdAt: s.createdAt };
}

// Settle relasi Staff ↔ Pimpinan untuk satu pegawai (employeeId).
// Body: { employeeId, supervisors: [{ supervisorId, startDate?, endDate? }] }
// (kompatibel juga dengan { employeeId, supervisorIds: string[] } tanpa periode).
// - endDate KOSONG/null = relasi AKTIF; endDate terisi = relasi berakhir (riwayat).
// - Relasi aktif yang tidak lagi terpilih diakhiri (endDate=hari ini) → tetap tersimpan.
// - Keterbatasan jabatan (role satu tingkat di atas) tetap divalidasi.
export async function PATCH(req: Request) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const employeeId = body?.employeeId;
  if (!employeeId || typeof employeeId !== "string") return Response.json({ error: "employeeId wajib" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  let norms: Array<{ supervisorId: string; startDate: string; endDate: string | null }>;
  if (Array.isArray(body?.supervisors)) {
    norms = body.supervisors.map((s: { supervisorId?: string; startDate?: string; endDate?: string | null }) => ({
      supervisorId: String(s?.supervisorId ?? ""),
      startDate: (s?.startDate || today).slice(0, 10),
      endDate: s?.endDate ? String(s.endDate).slice(0, 10) : null,
    }));
  } else if (Array.isArray(body?.supervisorIds)) {
    norms = body.supervisorIds.filter(Boolean).map((sid: string) => ({ supervisorId: sid, startDate: today, endDate: null }));
  } else {
    return Response.json({ error: "supervisors wajib (array)" }, { status: 400 });
  }
  norms = [...new Map(norms.map(n => [n.supervisorId, n])).values()];
  const norm = norms.map(n => n.supervisorId);

  const target = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!target) return Response.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  if (target.id === payload.id) return Response.json({ error: "Tidak bisa mengubah pimpinan pada akun sendiri" }, { status: 400 });

  const manager = await prisma.employee.findUnique({ where: { id: payload.id } });
  if (!manager) return Response.json({ error: "Sesi tidak valid" }, { status: 401 });
  if (!canCreateAnyRole(manager.role as OrgRow["role"]) && manager.role !== "admin") {
    return Response.json({ error: "Anda tidak berwenang mengubah relasi organisasi" }, { status: 403 });
  }

  // Muat hierarki untuk validasi.
  const all = (await prisma.employee.findMany({ select: { id: true, role: true, supervisorId: true } })) as OrgRow[];
  const targetRow: OrgRow = { id: target.id, role: target.role as OrgRow["role"], supervisorId: target.supervisorId };

  const expected = roleAbove(target.role as OrgRow["role"]);

  // pimpinan_1 (direktur) & admin tidak punya atasan → tidak boleh punya relasi pimpinan.
  if ((target.role === "pimpinan_1" || target.role === "admin") && norm.length > 0) {
    return Response.json({ error: "Direktur & Administrator berada di puncak/ di luar hierarki dan tidak memiliki pimpinan." }, { status: 400 });
  }
  if (target.role !== "pimpinan_1" && target.role !== "admin" && norm.length === 0) {
    return Response.json({ error: `${ROLE_LABEL[target.role as OrgRow["role"]]} harus memiliki minimal satu pimpinan aktif.` }, { status: 400 });
  }

  // Validasi setiap pimpinan terpilih: harus role satu tingkat di atas, bukan admin, tanpa siklus.
  for (const sid of norm) {
    const supRow = all.find(x => x.id === sid);
    if (!supRow) return Response.json({ error: "Pimpinan yang dipilih tidak ditemukan." }, { status: 400 });
    if (supRow.role === "admin") return Response.json({ error: "Administrator tidak bisa menjadi pimpinan pegawai." }, { status: 400 });
    if (!expected || supRow.role !== expected) {
      return Response.json({ error: `Pimpinan ${ROLE_LABEL[target.role as OrgRow["role"]]} harus berjabatan ${ROLE_LABEL[expected ?? target.role as OrgRow["role"]]} (satu tingkat di atas).` }, { status: 400 });
    }
    // Anti-siklus: pimpinan terpilih tidak boleh berada di bawah target.
    if (targetRow.role !== "admin") {
      const check = validateOrgChange(all, target.id, targetRow, { supervisorId: sid });
      if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
    }
  }

  // Otorisasi non-admin: semua pimpinan baru harus berada dalam subtree pengelola.
  if (manager.role !== "admin") {
    const { descendantIds } = await import("@/lib/roles");
    const subs = new Set(descendantIds(all, manager.id));
    for (const sid of norm) {
      if (!subs.has(sid) && sid !== manager.id) {
        return Response.json({ error: "Salah satu pimpinan berada di luar lingkup kewenangan Anda." }, { status: 403 });
      }
    }
  }

  const existing = await prisma.employeeSupervisor.findMany({ where: { employeeId } });
  const active = existing.filter(s => s.endDate == null);

  // Akhiri relasi aktif yang tidak lagi terpilih.
  const incomingIds = new Set(norm);
  const toEnd = active.filter(s => !incomingIds.has(s.supervisorId));
  if (toEnd.length) {
    await prisma.employeeSupervisor.updateMany({ where: { id: { in: toEnd.map(s => s.id) }, endDate: null }, data: { endDate: today } });
  }

  // Terapkan relasi terpilih beserta periodenya.
  for (const n of norms) {
    const activeForSup = existing.find(s => s.supervisorId === n.supervisorId && s.endDate == null);
    if (activeForSup) {
      await prisma.employeeSupervisor.update({ where: { id: activeForSup.id }, data: { startDate: n.startDate, endDate: n.endDate } });
    } else {
      await prisma.employeeSupervisor.create({ data: { employeeId, supervisorId: n.supervisorId, startDate: n.startDate, endDate: n.endDate } });
    }
  }

  // Pimpinan utama Employee.supervisorId = pimpinan aktif pertama (atau null).
  const after = await prisma.employeeSupervisor.findMany({ where: { employeeId } });
  const afterActive = after.filter(s => s.endDate == null);
  const primarySupervisorId = afterActive.length ? afterActive[0].supervisorId : null;
  await prisma.employee.update({ where: { id: employeeId }, data: { supervisorId: primarySupervisorId } });

  const serialized = after.map(toDTO);
  return Response.json({ supervisors: serialized, supervisorId: primarySupervisorId });
}
