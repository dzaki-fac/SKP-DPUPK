"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLES, ROLE_LABEL, ROLE_LEVEL, ROLE_SHORT, roleAbove, CREATEABLE_ROLES, canCreateAnyRole, descendantIds } from "@/lib/roles";
import type { Employee, Role } from "@/lib/types";
type Modal = { mode: "create" } | { mode: "edit"; emp: Employee } | null;

interface Form {
  name: string;
  email: string;
  employeeNumber: string;
  role: Role;
  supervisorId: string;
  password: string;
  isActive: boolean;
}

const EMPTY: Form = { name: "", email: "", employeeNumber: "", role: "staf", supervisorId: "", password: "", isActive: true };

function sortEmps(a: Employee, b: Employee) {
  const la = ROLE_LEVEL[a.role] ?? 99;
  const lb = ROLE_LEVEL[b.role] ?? 99;
  if (la !== lb) return la - lb;
  return a.name.localeCompare(b.name);
}

const inputCls = "w-full px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#283338] focus:outline-none focus:border-[#0e7490] placeholder:text-[#283338]/40";

export default function EmployeeManager() {
  const { employees, currentUser, createEmployee, updateEmployee, deleteEmployee, updateSupervisors, getActiveSupervisors, getSupervisorHistory } = useSKP();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  // Relasi Staff ↔ Pimpinan (multi + periode) untuk mode edit, terpisah dari form.supervisorId.
  // key = supervisorId, value = { startDate, endDate ('' = masih aktif/sekarang) }.
  const [editSup, setEditSup] = useState<Record<string, { startDate: string; endDate: string }>>({});

  // Riwayat pimpinan untuk target edit.
  const historyRows = modal?.mode === "edit" ? getSupervisorHistory(modal.emp.id) : [];
  const today = new Date().toISOString().slice(0, 10);

  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const canManage = !!role && canCreateAnyRole(role);

  // Lingkup kewenangan: admin melihat seluruh organisasi; pimpinan HANYA subtree-nya
  // (akun sendiri tidak tampil karena tidak boleh diubah/dihapus).
  const scopeIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    if (isAdmin) return new Set(employees.map(e => e.id));
    return new Set<string>(descendantIds(employees.map(e => ({ id: e.id, role: e.role, supervisorId: e.supervisorId })), currentUser.id));
  }, [employees, currentUser, isAdmin]);

  const manageable = useMemo(() => employees.filter(e => scopeIds.has(e.id)), [employees, scopeIds]);

  const neededRole = roleAbove(form.role);
  const manualSupervisorOptions = useMemo(() => {
    if (!neededRole) return [];
    let opts = employees.filter(e => e.role === neededRole);
    if (!isAdmin) opts = opts.filter(e => scopeIds.has(e.id) && e.id !== currentUser?.id);
    return opts.sort(sortEmps);
  }, [employees, neededRole, isAdmin, scopeIds, currentUser]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return manageable
      .filter(e => (roleFilter === "all" || e.role === roleFilter))
      .filter(e => (statusFilter === "all" || ((e.isActive ?? true) === (statusFilter === "active"))))
      .filter(e => !query || e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.employeeNumber.includes(query))
      .sort(sortEmps);
  }, [manageable, q, roleFilter, statusFilter]);

  if (!canManage || !currentUser) {
    return (
      <div className="border border-dashed border-[#d1d5db] bg-white px-6 py-12 text-center" style={{ borderRadius: 8 }}>
        <div className="heading-serif text-[20px]">Khusus pimpinan & administrator</div>
        <p className="mt-2 text-sm text-[#283338]/70 max-w-md mx-auto">Pengelolaan pegawai & akun hanya dapat dilakukan oleh administrator atau pimpinan sesuai lingkup kewenangannya.</p>
      </div>
    );
  }

  // --- Kandidat atasan untuk akun baru ---
  const createableRoles = CREATEABLE_ROLES[role as Role] ?? [];

  // Atasan otomatis = pembuat ketika role target tepat satu tingkat di bawah pembuat.
  const autoSupervisor = modal?.mode === "create" && !isAdmin && neededRole === role && currentUser.id;

  const supervisorOptions = autoSupervisor ? [] : manualSupervisorOptions;
  const effectiveSupervisorId = autoSupervisor ? currentUser.id : (supervisorOptions.some(s => s.id === form.supervisorId) ? form.supervisorId : "");

  const openCreate = () => {
    const initial = { ...EMPTY, role: createableRoles[0] ?? "staf" };
    const firstNeed = roleAbove(initial.role);
    if (!isAdmin && firstNeed === role && currentUser) initial.supervisorId = currentUser.id;
    setForm(initial);
    setModal({ mode: "create" });
  };
  const openEdit = (e: Employee) => {
    setForm({ name: e.name, email: e.email, employeeNumber: e.employeeNumber, role: e.role, supervisorId: e.supervisorId ?? "", password: "", isActive: e.isActive ?? true });
    // Prefill dari relasi AKTIF (periode mulai dipertahankan; selesai kosong = masih aktif).
    const map: Record<string, { startDate: string; endDate: string }> = {};
    getActiveSupervisors(e.id).forEach(s => { map[s.supervisorId] = { startDate: s.startDate, endDate: "" }; });
    setEditSup(map);
    setModal({ mode: "edit", emp: e });
  };
  const close = () => { setModal(null); setBusy(false); setEditSup({}); };

  const submit = async () => {
    if (busy) return;
    if (form.name.trim().length < 3) { window.alert("Nama minimal 3 karakter"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { window.alert("Email tidak valid"); return; }
    if (form.password && form.password.length < 6) { window.alert("Password minimal 6 karakter"); return; }
    setBusy(true);
    const payload: {
      name: string; email: string; employeeNumber?: string; password?: string;
      supervisorId: string | null; role: Role; isActive: boolean;
    } = {
      name: form.name.trim(), email: form.email.trim(),
      employeeNumber: form.employeeNumber.trim() || undefined,
      role: form.role, supervisorId: effectiveSupervisorId || null,
      isActive: form.isActive,
      password: form.password || undefined,
    };
    if (modal?.mode === "create") {
      const res = await createEmployee(payload);
      if (res.ok) close();
    } else if (modal?.mode === "edit") {
      const res = await updateEmployee(modal.emp.id, payload);
      if (res.ok) {
        // Update relasi Staff ↔ Pimpinan (multi) + periode. Relasi yang diakhiri jadi riwayat.
        const today = new Date().toISOString().slice(0, 10);
        const supervisors = Object.entries(editSup).map(([sid, p]) => ({
          supervisorId: sid,
          startDate: p.startDate || today,
          endDate: p.endDate || null,
        }));
        await updateSupervisors(modal.emp.id, { supervisors });
        close();
      }
    }
    setBusy(false);
  };

  const remove = (e: Employee) => {
    if (window.confirm(`Hapus ${e.name}?\nPastikan tidak memiliki bawahan dan tidak terkait rencana kinerja.`)) {
      deleteEmployee(e.id);
    }
  };

  const open = !!modal;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#283338]/40 text-[14px]" aria-hidden>⌕</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari nama, email, atau NIP"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:border-[#0e7490] placeholder:text-[#283338]/40"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as "all" | Role)} className="px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#283338] focus:outline-none focus:border-[#0e7490]">
          <option value="all">Semua jabatan</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "all" | "active" | "inactive")} className="px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#283338] focus:outline-none focus:border-[#0e7490]">
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Non-aktif</option>
        </select>
        {isAdmin && (
          <button onClick={openCreate} className="px-4 py-2 rounded-md bg-[#0e7490] text-white text-sm font-medium hover:bg-[#155e75]">+ Tambah pegawai</button>
        )}
      </div>

      <div className="bg-white border border-[#e5e7eb] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-left font-mono text-[11px] uppercase tracking-[0.05em] text-[#283338]/50">
              <th className="px-4 py-3 font-medium">Pegawai</th>
              <th className="px-4 py-3 font-medium">NIP</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Jabatan</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Atasan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => {
              const activeSps = getActiveSupervisors(e.id);
              const supNames = activeSps.map(s => employees.find(x => x.id === s.supervisorId)?.name).filter(Boolean);
              return (
                <tr key={e.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#f3f4f6]/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0 leading-none ${e.role === "admin" ? "bg-[#16325a]" : "bg-[#1c5d5f]"}`} style={{ borderRadius: 9999 }}>{e.avatar}</div>
                      <div className="font-medium text-[#283338]">{e.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#283338]/55">{e.employeeNumber || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#283338]/70">{e.email}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] whitespace-nowrap">{e.role === "admin" ? "Admin" : ROLE_SHORT[e.role]}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#283338]/70">
                    {supNames.length ? supNames.join(", ") : "—"}
                    {activeSps.length > 1 && <span className="ml-1 font-mono text-[10px] text-[#0e7490]">×{activeSps.length}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] ${(e.isActive ?? true) ? "text-[#17643a]" : "text-[#b91c1c]"}`}>{(e.isActive ?? true) ? "Aktif" : "Non-aktif"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[12px] font-medium text-[#0e7490] hover:border-[#0e7490] hover:bg-[#f3f4f6]">Ubah</button>
                      {e.id !== currentUser?.id && (
                        <button onClick={() => remove(e)} className="px-3 py-1.5 rounded-md border border-[#eed8cd] text-[12px] font-medium text-[#b91c1c] hover:border-[#e3b5a3] hover:bg-[#fcf4f0]">Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[#283338]/50">Tidak ada pegawai yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[11px] text-[#283338]/50">
        {employees.length} total akun.
      </p>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={close}>
          <div className="w-full max-w-lg bg-white border border-[#e5e7eb] flex flex-col overflow-hidden" style={{ borderRadius: 10 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-[#e5e7eb]">
              <div>
                <p className="eyebrow text-[#0e7490] text-[12px]">{modal.mode === "create" ? "Tambah pegawai" : "Ubah akun & jabatan"}</p>
                <h3 className="heading-serif text-[19px] mt-0.5 truncate pr-4">{modal.mode === "create" ? "Pegawai baru" : form.name || "Perbarui data"}</h3>
              </div>
              <button onClick={close} className="w-7 h-7 shrink-0 rounded-full border border-[#e5e7eb] text-[#283338]/60 hover:border-[#0e7490] hover:text-[#283338] flex items-center justify-center" style={{ borderRadius: 9999 }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: "65vh" }}>
              <input placeholder="Nama lengkap (min. 3 karakter)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Email (untuk login)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                <input placeholder="NIP (opsional)" value={form.employeeNumber} onChange={e => setForm({ ...form, employeeNumber: e.target.value })} className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">Jabatan</span>
                  <select
                    value={form.role}
                    onChange={e => {
                      const nr = e.target.value as Role;
                      const need = roleAbove(nr);
                      let sup = "";
                      if (!isAdmin && need === role && currentUser) sup = currentUser.id;
                      setForm({ ...form, role: nr, supervisorId: sup });
                    }}
                    className={`${inputCls} mt-1`}
                  >
                    {(modal.mode === "create" ? createableRoles : ROLES).map((r: Role) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    {modal.mode === "create" && form.role === "pimpinan_1" && employees.some(x => x.role === "pimpinan_1") && (
                      <option value="" disabled>⚠ Direktur sudah ada</option>
                    )}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">Status akun</span>
                  <select value={form.isActive ? "active" : "inactive"} onChange={e => setForm({ ...form, isActive: e.target.value === "active" })} className={`${inputCls} mt-1`}>
                    <option value="active">Aktif (dapat login)</option>
                    <option value="inactive">Non-aktif</option>
                  </select>
                </label>
              </div>

              {/* Atasan Langsung — section */}
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/60">Atasan Langsung</span>
                  {modal.mode === "edit" && form.role !== "admin" && form.role !== "pimpinan_1" && (
                    <span className="font-mono text-[10px] text-[#0e7490]">{Object.keys(editSup).length} dipilih · riwayat tersimpan</span>
                  )}
                </div>
                {autoSupervisor ? (
                  <div className={`${inputCls} flex items-center justify-between`}>
                    <span className="truncate text-[#283338]">{currentUser.name.split(",")[0]} (Anda)</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#0e7490] shrink-0">otomatis</span>
                  </div>
                ) : modal?.mode === "edit" ? (
                  form.role === "admin" || form.role === "pimpinan_1" ? (
                    <p className="font-mono text-[11px] text-[#283338]/60">Tanpa atasan — berada di puncak/ luar hierarki.</p>
                  ) : (
                    <>
                      <p className="mb-1.5 font-mono text-[10px] text-[#283338]/50">Pilih satu atau lebih pimpinan aktif — periode selesai kosong = masih berlaku.</p>
                      <div className="rounded-md border border-[#e5e7eb] bg-white divide-y divide-[#e5e7eb] max-h-56 overflow-auto">
                        {supervisorOptions.length === 0 && <p className="px-3 py-2 font-mono text-[11px] text-[#b91c1c]">Belum ada pegawai berjabatan {ROLE_LABEL[neededRole!]} sebagai calon pimpinan.</p>}
                        {supervisorOptions.map(s => {
                          const sel = editSup[s.id];
                          return (
                            <div key={s.id} className={sel ? "bg-[#f8fafc]" : ""}>
                              <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#f3f4f6]">
                                <input
                                  type="checkbox"
                                  checked={!!sel}
                                  onChange={e => {
                                    if (e.target.checked) setEditSup(prev => ({ ...prev, [s.id]: prev[s.id] ?? { startDate: today, endDate: "" } }));
                                    else setEditSup(prev => { const next = { ...prev }; delete next[s.id]; return next; });
                                  }}
                                  className="w-3.5 h-3.5 accent-[#0e7490] shrink-0"
                                />
                                <span className="text-[13px] text-[#283338] truncate">{s.name}</span>
                                <span className="ml-auto font-mono text-[10px] text-[#0e7490] shrink-0">{ROLE_SHORT[s.role]}</span>
                              </label>
                              {sel && (
                                <div className="px-3 pb-2.5 pl-9 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#283338]/50 shrink-0">Periode</span>
                                  <input
                                    type="date"
                                    value={sel.startDate}
                                    onChange={e => setEditSup(prev => ({ ...prev, [s.id]: { ...prev[s.id], startDate: e.target.value } }))}
                                    className="flex-1 min-w-[118px] px-2 py-1 rounded-md border border-[#e5e7eb] bg-white text-[12px] text-[#283338] focus:outline-none focus:border-[#0e7490]"
                                  />
                                  <span className="text-[#9ca3af] shrink-0">–</span>
                                  {sel.endDate ? (
                                    <>
                                      <input
                                        type="date"
                                        value={sel.endDate}
                                        onChange={e => setEditSup(prev => ({ ...prev, [s.id]: { ...prev[s.id], endDate: e.target.value } }))}
                                        className="flex-1 min-w-[118px] px-2 py-1 rounded-md border border-[#e5e7eb] bg-white text-[12px] text-[#283338] focus:outline-none focus:border-[#0e7490]"
                                      />
                                      <button
                                        type="button"
                                        title="Kembalikan ke masih berlaku (sekarang)"
                                        onClick={() => setEditSup(prev => ({ ...prev, [s.id]: { ...prev[s.id], endDate: "" } }))}
                                        className="w-6 h-6 shrink-0 rounded-md border border-[#e5e7eb] text-[12px] text-[#6b7280] hover:border-[#0e7490] hover:text-[#0e7490]"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex-1 min-w-[118px] px-2 py-1 rounded-md border border-dashed border-[#e5e7eb] bg-transparent text-[12px] text-[#0e7490] font-mono">Sekarang</div>
                                      <button
                                        type="button"
                                        title="Tetapkan tanggal selesai"
                                        onClick={() => setEditSup(prev => ({ ...prev, [s.id]: { ...prev[s.id], endDate: today } }))}
                                        className="w-6 h-6 shrink-0 rounded-md border border-[#e5e7eb] text-[12px] text-[#6b7280] hover:border-[#0e7490] hover:text-[#0e7490]"
                                      >
                                        ⌚
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {historyRows.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#eef2f6]">
                          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#9ca3af]">Riwayat pimpinan</div>
                          <ul className="mt-1 space-y-0.5">
                            {historyRows.map(h => (
                              <li key={h.id} className="flex items-center gap-2 text-[12px] text-[#283338]/60">
                                <span className="truncate">{employees.find(x => x.id === h.supervisorId)?.name ?? h.supervisorId}</span>
                                <span className="ml-auto font-mono text-[11px] text-[#9ca3af] whitespace-nowrap">{h.startDate} → {h.endDate ?? "sekarang"}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <select value={effectiveSupervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} className={inputCls}>
                      <option value="">{(form.role === "admin" || form.role === "pimpinan_1") ? "— Tanpa atasan —" : "— Pilih atasan —"}</option>
                      {supervisorOptions.map(s => <option key={s.id} value={s.id}>{s.name} • {ROLE_SHORT[s.role]}</option>)}
                    </select>
                    {form.role !== "admin" && form.role !== "pimpinan_1" && neededRole && supervisorOptions.length === 0 && (
                      <p className="mt-1.5 font-mono text-[11px] text-[#b91c1c]">Belum ada pegawai berjabatan {ROLE_LABEL[neededRole]} sebagai calon atasan untuk jabatan {ROLE_LABEL[form.role]}.</p>
                    )}
                  </>
                )}
              </div>

              <input placeholder={modal.mode === "edit" ? "Password baru (kosongkan jika tidak diubah)" : "Password default 'password'"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} />
              {form.role === "pimpinan_1" && <p className="font-mono text-[11px] text-[#283338]/60">• Hanya boleh ada 1 Direktur (pimpinan_1).</p>}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#e5e7eb] bg-[#fafafa] flex items-center justify-end gap-2">
              <button onClick={close} className="px-4 py-1.5 rounded-md border border-[#e5e7eb] text-[13px] font-medium text-[#283338] hover:border-[#0e7490]">Batal</button>
              <button onClick={submit} disabled={busy} className="px-4 py-1.5 rounded-md bg-[#0e7490] text-white text-[13px] font-medium hover:bg-[#155e75] disabled:opacity-50">
                {busy ? "Menyimpan…" : (modal.mode === "create" ? "Simpan pegawai" : "Simpan perubahan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
