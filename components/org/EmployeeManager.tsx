"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLES, ROLE_LABEL, ROLE_LEVEL, roleAbove } from "@/lib/roles";
import type { Employee, Role } from "@/lib/types";

const ROLE_CHIP: Record<string, string> = {
  admin: "bg-[#16325a] text-white",
  pimpinan_1: "bg-[#1c5d5f] text-white",
  pimpinan_2: "bg-[#e4f0f1] text-[#1c5d5f] border border-[#a2cbcd]",
  pimpinan_3: "bg-[#f2f8f7] text-[#1c5d5f] border border-[#d5e6e8]",
  staf: "bg-white text-[#283338] border border-[#e4f0f1]",
};

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

export default function EmployeeManager() {
  const { employees, currentUser, createEmployee, updateEmployee, deleteEmployee } = useSKP();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return employees
      .filter(e => (roleFilter === "all" || e.role === roleFilter))
      .filter(e => (statusFilter === "all" || ((e.isActive ?? true) === (statusFilter === "active"))))
      .filter(e => !query || e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.employeeNumber.includes(query))
      .sort(sortEmps);
  }, [employees, q, roleFilter, statusFilter]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center border border-dashed bg-white text-[#283338]/70" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>
        <div className="heading-serif text-lg">Khusus administrator</div>
        <p className="mt-2 text-sm">Kelola pegawai & akun (tambah, ubah, reset password, non-aktifkan) hanya dapat dilakukan oleh administrator.</p>
      </div>
    );
  }

  const neededRole = roleAbove(form.role);
  const supervisorOptions = neededRole ? employees.filter(e => e.role === neededRole) : [];
  const effectiveSupervisorId = supervisorOptions.some(s => s.id === form.supervisorId) ? form.supervisorId : "";

  const openCreate = () => { setForm(EMPTY); setModal({ mode: "create" }); };
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Cari nama, email, NIP…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]"
          style={{ borderRadius: 12 }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as "all" | Role)} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}>
          <option value="all">Semua jabatan</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "all" | "active" | "inactive")} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}>
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Non-aktif</option>
        </select>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>+ Tambah Pegawai</button>
      </div>

      <div className="bg-white border border-[#e4f0f1] overflow-x-auto" style={{ borderRadius: 12 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f2f8f7] border-b border-[#e4f0f1] font-mono text-xs tracking-[0.04em] uppercase text-[#283338]/60">
              <th className="text-left px-4 py-3">Pegawai</th>
              <th className="text-left px-4 py-3">NIP</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3">Jabatan</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Atasan</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map(e => {
              const sup = e.supervisorId ? employees.find(x => x.id === e.supervisorId) : null;
              return (
                <tr key={e.id} className="border-b border-[#e4f0f1] last:border-0 hover:bg-[#f2f8f7]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${e.role === "admin" ? "bg-[#16325a]" : "bg-[#1c5d5f]"}`} style={{ borderRadius: 9999 }}>{e.avatar}</div>
                      <div className="font-medium text-[#283338]">{e.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#283338]/60">{e.employeeNumber}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#283338]/70">{e.email}</td>
                  <td className="px-4 py-3"><span className={`font-mono text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_CHIP[e.role]}`} style={{ borderRadius: 100 }}>{ROLE_LABEL[e.role]}</span></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#283338]/70">{sup ? sup.name : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border ${(e.isActive ?? true) ? "bg-[#e4f2e2] text-[#17643a] border-[#c4e2c9]" : "bg-[#f2e8e2] text-[#b91c1c] border-[#edd5c9]"}`} style={{ borderRadius: 100 }}>{(e.isActive ?? true) ? "Aktif" : "Non-aktif"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="px-3 py-1.5 rounded-full border border-[#e4f0f1] text-xs font-medium text-[#1c5d5f] hover:border-[#a2cbcd]" style={{ borderRadius: 48 }}>Ubah</button>
                      <button onClick={() => remove(e)} className="px-3 py-1.5 rounded-full border border-[#edd5c9] text-xs font-medium text-[#b91c1c] hover:bg-[#f2e8e2]" style={{ borderRadius: 48 }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#283338]/50">Tidak ada pegawai yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[11px] text-[#283338]/50">• {employees.length} pegawai total. Direktur (pimpinan_1) & administrator tampil di luar relasi atasan.</p>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={close}>
          <div className="w-full max-w-lg bg-white border border-[#e4f0f1] p-6" style={{ borderRadius: 16 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">{modal.mode === "create" ? "TAMBAH PEGAWAI" : "UBAH AKUN & JABATAN"}</p>
                <h3 className="heading-serif text-[20px]">{modal.mode === "create" ? "Pegawai baru" : form.name || "Perbarui data"}</h3>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full border border-[#e4f0f1] text-[#283338]/60 hover:border-[#a2cbcd]" style={{ borderRadius: 9999 }}>✕</button>
            </div>

            <div className="mt-5 space-y-3">
              <input placeholder="Nama lengkap (min. 3 karakter)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Email (untuk login)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
                <input placeholder="NIP (opsional)" value={form.employeeNumber} onChange={e => setForm({ ...form, employeeNumber: e.target.value })} className="px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[11px] uppercase text-[#283338]/50">Jabatan</span>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role, supervisorId: "" })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    {modal.mode === "create" && form.role === "pimpinan_1" && employees.some(x => x.role === "pimpinan_1") && (
                      <option value="" disabled>⚠ Direktur sudah ada</option>
                    )}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[11px] uppercase text-[#283338]/50">Atasan langsung</span>
                  <select value={effectiveSupervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}>
                    <option value="">{(form.role === "admin" || form.role === "pimpinan_1") ? "— Tanpa atasan —" : "— Pilih atasan —"}</option>
                    {supervisorOptions.map(s => <option key={s.id} value={s.id}>{s.name} • {ROLE_LABEL[s.role]}</option>)}
                  </select>
                </label>
              </div>
              {form.role !== "admin" && form.role !== "pimpinan_1" && neededRole && supervisorOptions.length === 0 && (
                <p className="font-mono text-[11px] text-[#b91c1c]">Belum ada pegawai berjabatan {ROLE_LABEL[neededRole]} sebagai calon atasan untuk jabatan {ROLE_LABEL[form.role]}.</p>
              )}
              <input placeholder={modal.mode === "edit" ? "Password baru (kosongkan jika tidak diubah)" : "Password default 'password'" } value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
              <label className="flex items-center gap-2 text-sm text-[#283338]">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[#1c5d5f]" />
                Akun aktif (dapat login)
              </label>
              {form.role === "pimpinan_1" && <p className="font-mono text-[11px] text-[#283338]/60">• Hanya boleh ada 1 Direktur (pimpinan_1).</p>}
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={close} className="px-5 py-2.5 rounded-full border border-[#e4f0f1] text-sm font-medium text-[#283338] hover:border-[#a2cbcd]" style={{ borderRadius: 48 }}>Batal</button>
              <button onClick={submit} disabled={busy} className="px-5 py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152] disabled:opacity-50" style={{ borderRadius: 48 }}>
                {busy ? "Menyimpan…" : (modal.mode === "create" ? "Simpan Pegawai" : "Simpan Perubahan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}