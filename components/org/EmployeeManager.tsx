"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLES, ROLE_LABEL, ROLE_LEVEL, ROLE_SHORT, roleAbove, CREATEABLE_ROLES, canCreateAnyRole, descendantIds } from "@/lib/roles";
import type { Employee, Role } from "@/lib/types";

type Modal = { mode: "create"} | { mode: "edit"; emp: Employee } | null;

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

const inputCls = " w-full px-3 py-2 rounded-md border border-[#e8e6e5] bg-white text-[14px] text-[#0c0a09] focus:outline-none focus:border-[#3ba6f1] placeholder:text-[#0c0a09]/40";

export default function EmployeeManager() {
 const { employees, currentUser, createEmployee, updateEmployee, deleteEmployee } = useSKP();
 const [q, setQ] = useState("");
 const [roleFilter, setRoleFilter] = useState<"all"| Role>("all");
 const [statusFilter, setStatusFilter] = useState<"all"| "active"| "inactive">("all");
 const [modal, setModal] = useState<Modal>(null);
 const [form, setForm] = useState<Form>(EMPTY);
 const [busy, setBusy] = useState(false);

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
 .filter(e => (roleFilter === "all"|| e.role === roleFilter))
 .filter(e => (statusFilter === "all"|| ((e.isActive ?? true) === (statusFilter === "active"))))
 .filter(e => !query || e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.employeeNumber.includes(query))
 .sort(sortEmps);
 }, [manageable, q, roleFilter, statusFilter]);

 if (!canManage || !currentUser) {
 return (
 <div className="border border-dashed border-[#e8e6e5] bg-white px-6 py-12 text-center" style={{ borderRadius: 8 }}>
 <div className="subheading text-[20px]">Khusus pimpinan & administrator</div>
 <p className="mt-2 text-[14px] text-[#0c0a09]/70 max-w-md mx-auto">Pengelolaan pegawai & akun hanya dapat dilakukan oleh administrator atau pimpinan sesuai lingkup kewenangannya.</p>
 </div>
 );
 }

 // --- Kandidat atasan untuk akun baru ---
 const createableRoles = CREATEABLE_ROLES[role as Role] ?? [];

 // Atasan otomatis = pembuat ketika role target tepat satu tingkat di bawah pembuat.
 const autoSupervisor = modal?.mode === "create"&& !isAdmin && neededRole === role && currentUser.id;

 const supervisorOptions = autoSupervisor ? [] : manualSupervisorOptions;
 const effectiveSupervisorId = autoSupervisor ? currentUser.id : (supervisorOptions.some(s => s.id === form.supervisorId) ? form.supervisorId : "");

 const openCreate = () => {
 const initial = { ...EMPTY, role: createableRoles[0] ?? "staf"};
 const firstNeed = roleAbove(initial.role);
 if (!isAdmin && firstNeed === role && currentUser) initial.supervisorId = currentUser.id;
 setForm(initial);
 setModal({ mode: "create"});
 };
 const openEdit = (e: Employee) => { setForm({ name: e.name, email: e.email, employeeNumber: e.employeeNumber, role: e.role, supervisorId: e.supervisorId ?? "", password: "", isActive: e.isActive ?? true }); setModal({ mode: "edit", emp: e }); };
 const close = () => { setModal(null); setBusy(false); };

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
 if (res.ok) close();
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
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0c0a09]/40 text-[14px]" aria-hidden>⌕</span>
 <input
 value={q}
 onChange={e => setQ(e.target.value)}
 placeholder="Cari nama, email, atau NIP"
 className="w-full pl-9 pr-3 py-2 rounded-md border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#3ba6f1] placeholder:text-[#0c0a09]/40"
 />
 </div>
 <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as "all"| Role)} className="px-3 py-2 rounded-md border border-[#e8e6e5] bg-white text-[14px] text-[#0c0a09] focus:outline-none focus:border-[#3ba6f1]">
 <option value="all">Semua jabatan</option>
 {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
 </select>
 <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "all"| "active"| "inactive")} className="px-3 py-2 rounded-md border border-[#e8e6e5] bg-white text-[14px] text-[#0c0a09] focus:outline-none focus:border-[#3ba6f1]">
 <option value="all">Semua status</option>
 <option value="active">Aktif</option>
 <option value="inactive">Non-aktif</option>
 </select>
 {isAdmin && (
 <button onClick={openCreate} className="px-4 py-2 rounded-md bg-[#3ba6f1] text-white text-[14px] font-medium hover:bg-[#3398e1]">+ Tambah pegawai</button>
 )}
 </div>

 <div className="bg-white border border-[#e8e6e5] overflow-x-auto">
 <table className="w-full text-[14px]">
 <thead>
 <tr className="border-b border-[#e8e6e5] text-left text-[12px] uppercase tracking-[0.05em] text-[#0c0a09]/50">
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
 const sup = e.supervisorId ? employees.find(x => x.id === e.supervisorId) : null;
 return (
 <tr key={e.id} className="border-b border-[#e8e6e5] last:border-0 hover:bg-[#fafaf9]/60">
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-[12px] font-medium shrink-0 leading-none ${e.role === "admin"? " bg-[#0c0a09]": " bg-[#3ba6f1]"}`} style={{ borderRadius: 9999 }}>{e.avatar}</div>
 <div className="font-medium text-[#0c0a09]">{e.name}</div>
 </div>
 </td>
 <td className="px-4 py-3 text-[12px] text-[#0c0a09]/55">{e.employeeNumber || "—"}</td>
 <td className="px-4 py-3 hidden md:table-cell text-[#0c0a09]/70">{e.email}</td>
 <td className="px-4 py-3">
 <span className="text-[12px] whitespace-nowrap">{e.role === "admin"? "Admin": ROLE_SHORT[e.role]}</span>
 </td>
 <td className="px-4 py-3 hidden sm:table-cell text-[#0c0a09]/70">{sup ? sup.name : "—"}</td>
 <td className="px-4 py-3">
 <span className={`text-[12px] ${(e.isActive ?? true) ? " text-[#3ba6f1]": " text-[#b91c1c]"}`}>{(e.isActive ?? true) ? "Aktif": "Non-aktif"}</span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-2">
 <button onClick={() => openEdit(e)} className="px-3 py-1.5 rounded-md border border-[#e8e6e5] text-[12px] font-medium text-[#3ba6f1] hover:border-[#3ba6f1] hover:bg-[#fafaf9]">Ubah</button>
 {e.id !== currentUser?.id && (
 <button onClick={() => remove(e)} className="px-3 py-1.5 rounded-md border border-[#eed8cd] text-[12px] font-medium text-[#b91c1c] hover:border-[#e3b5a3] hover:bg-[#fcf4f0]">Hapus</button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 {list.length === 0 && (
 <tr><td colSpan={7} className="px-4 py-12 text-center text-[#0c0a09]/50">Tidak ada pegawai yang cocok.</td></tr>
 )}
 </tbody>
 </table>
 </div>

 <p className="text-[12px] text-[#0c0a09]/50">
 {employees.length} total akun.
 </p>

 {open && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={close}>
 <div className="w-full max-w-lg bg-white border border-[#e8e6e5]" style={{ borderRadius: 10 }} onClick={e => e.stopPropagation()}>
 <div className="px-6 pt-6 flex items-start justify-between">
 <div>
 <p className="eyebrow text-[#3ba6f1] text-[12px]">{modal.mode === "create"? " Tambah pegawai": " Ubah akun & jabatan"}</p>
 <h3 className="subheading text-[20px] mt-1">{modal.mode === "create"? " Pegawai baru": form.name || " Perbarui data"}</h3>
 </div>
 <button onClick={close} className="w-8 h-8 rounded-full border border-[#e8e6e5] text-[#0c0a09]/60 hover:border-[#3ba6f1] hover:text-[#0c0a09]" style={{ borderRadius: 9999 }}>✕</button>
 </div>

 <div className="mt-5 px-6 space-y-3">
 <input placeholder="Nama lengkap (min. 3 karakter)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
 <div className="grid sm:grid-cols-2 gap-3">
 <input placeholder="Email (untuk login)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
 <input placeholder="NIP (opsional)" value={form.employeeNumber} onChange={e => setForm({ ...form, employeeNumber: e.target.value })} className={inputCls} />
 </div>
 <div className="grid sm:grid-cols-2 gap-3">
 <label className="block">
 <span className="text-[12px] uppercase tracking-[0.06em] text-[#0c0a09]/50">Jabatan</span>
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
 {(modal.mode === "create"? createableRoles : ROLES).map((r: Role) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
 {modal.mode === "create"&& form.role === "pimpinan_1"&& employees.some(x => x.role === "pimpinan_1") && (
 <option value="" disabled>⚠ Direktur sudah ada</option>
 )}
 </select>
 </label>
 <label className="block">
 <span className="text-[12px] uppercase tracking-[0.06em] text-[#0c0a09]/50">Atasan langsung</span>
 {autoSupervisor ? (
 <div className={`${inputCls} mt-1 flex items-center justify-between`}>
 <span className="text-[#0c0a09]">{currentUser.name.split(",")[0]} (Anda)</span>
 <span className="text-[10px] uppercase tracking-[0.06em] text-[#3ba6f1]">otomatis</span>
 </div>
 ) : (
 <select value={effectiveSupervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} className={`${inputCls} mt-1`}>
 <option value="">{(form.role === "admin"|| form.role === "pimpinan_1") ? "— Tanpa atasan —": "— Pilih atasan —"}</option>
 {supervisorOptions.map(s => <option key={s.id} value={s.id}>{s.name} • {ROLE_SHORT[s.role]}</option>)}
 </select>
 )}
 </label>
 </div>
 {form.role !== "admin"&& form.role !== "pimpinan_1"&& neededRole && !autoSupervisor && supervisorOptions.length === 0 && (
 <p className="text-[12px] text-[#b91c1c]">Belum ada pegawai berjabatan {ROLE_LABEL[neededRole]} sebagai calon atasan untuk jabatan {ROLE_LABEL[form.role]}.</p>
 )}
 <input placeholder={modal.mode === "edit"? " Password baru (kosongkan jika tidak diubah)": " Password default 'password'"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} />
 <label className="flex items-center gap-2 text-[14px] text-[#0c0a09]">
 <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[#3ba6f1]"/>
 Akun aktif (dapat login)
 </label>
 {form.role === "pimpinan_1"&& <p className="text-[12px] text-[#0c0a09]/60">• Hanya boleh ada 1 Direktur (pimpinan_1).</p>}
 </div>

 <div className="mt-6 px-6 py-5 border-t border-[#e8e6e5] flex gap-2 justify-end">
 <button onClick={close} className="px-5 py-2 rounded-md border border-[#e8e6e5] text-[14px] font-medium text-[#0c0a09] hover:border-[#3ba6f1]">Batal</button>
 <button onClick={submit} disabled={busy} className="px-5 py-2 rounded-md bg-[#3ba6f1] text-white text-[14px] font-medium hover:bg-[#3398e1] disabled:opacity-50">
 {busy ? "Menyimpan…": (modal.mode === "create"? " Simpan pegawai": " Simpan perubahan")}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
