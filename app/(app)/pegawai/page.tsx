"use client";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";

export default function PegawaiPage() {
  const { employees, setEmployees, currentUser, empForm, setEmpForm, notify, addLog } = useSKP();
  if (!currentUser) return null;
  if (currentUser.role !== "admin") return <div className="p-8 text-center border border-dashed bg-white" style={{ borderRadius: 12 }}>Hanya Admin dapat mengakses halaman ini.</div>;
  return (
    <div className="space-y-4">
      <div><p className="eyebrow">MANAJEMEN PEGAWAI</p><h2 className="heading-serif text-[28px]">Daftar pegawai</h2></div>
      <div className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1] font-mono text-xs tracking-[0.04em] uppercase text-[#283338]/60"><tr><th className="text-left px-4 py-3">Pegawai</th><th className="text-left px-4 py-3">NIP</th><th className="text-left px-4 py-3">Jabatan</th><th className="text-left px-4 py-3">Atasan</th><th className="text-left px-4 py-3">Role</th></tr></thead>
            <tbody>{employees.map(e => <tr key={e.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]"><td className="px-4 py-3 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{e.avatar}</span><span><div className="font-medium">{e.name}</div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{e.email}</div></span></td><td className="px-4 py-3 font-mono text-xs">{e.employeeNumber}</td><td className="px-4 py-3 text-xs">{roleLabel[e.role]}</td><td className="px-4 py-3 font-mono text-xs">{e.supervisorId ? employees.find(x => x.id === e.supervisorId)?.name.split(",")[0] : "—"}</td><td className="px-4 py-3"><span className="font-mono text-xs tracking-wide px-2 py-1 rounded-full bg-[#1c5d5f] text-white" style={{ borderRadius: 100 }}>{e.role.toUpperCase()}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow">TAMBAH PEGAWAI</div>
          <div className="mt-3 space-y-2">
            <input placeholder="Nama lengkap" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }} />
            <input placeholder="Email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }} />
            <select value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value as any })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}><option value="staff">staff</option><option value="supervisor">supervisor</option><option value="direktur">direktur</option><option value="admin">admin</option></select>
            <select value={empForm.supervisorId} onChange={e => setEmpForm({ ...empForm, supervisorId: e.target.value })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 12 }}><option value="">— Tanpa atasan —</option>{employees.map(em => <option key={em.id} value={em.id}>{em.name.split(",")[0]}</option>)}</select>
            <button onClick={async () => {
              if (!empForm.name || !empForm.email) { notify("Nama & email wajib"); return; }
              const ne = { id: "e" + Date.now(), userId: "u" + Date.now(), employeeNumber: "199" + Math.floor(Math.random() * 10000000), name: empForm.name, email: empForm.email, supervisorId: empForm.supervisorId || null, role: empForm.role, avatar: empForm.name.slice(0, 2).toUpperCase() };
              setEmployees(prev => [...prev, ne]);
              try { await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(ne) }); } catch {}
              addLog("Menambah pegawai", `Menambah pegawai ${ne.name}`, "employee", ne.id); notify("Pegawai ditambahkan"); setEmpForm({ name: "", email: "", supervisorId: "", role: "staff" });
            }} className="w-full py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Tambah Pegawai</button>
          </div>
        </div>
        <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow">DISTRIBUSI ROLE</div>
          <div className="mt-3 space-y-2 text-sm">
            {(["direktur","supervisor","staff","admin"] as const).map(r => {
              const count = employees.filter(e=>e.role===r).length;
              return <div key={r} className="flex justify-between py-1 border-b border-[#e4f0f1] font-mono text-xs tracking-wide"><span>{roleLabel[r]}</span><span className="text-[#1c5d5f] font-bold">{count} orang</span></div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
