"use client";
import { useState } from "react";
import { OrgTree } from "@/components/ui/TreeViews";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";
import type { Role } from "@/lib/types";

export default function OrganisasiPage() {
  const {
    currentUser, employees, setEmployees,
    updateEmployeeOrg, deleteEmployee, notify, addLog,
  } = useSKP();
  const [tab, setTab] = useState<"struktur" | "pegawai">("struktur");
  const canManage = !!currentUser && ["admin","direktur"].includes(currentUser.role);
  const isAdmin = currentUser?.role === "admin";

  // edit pegawai (atasan/role)
  const [editingEmpId, setEditingEmpId] = useState<string|null>(null);
  const [empSupervisorId, setEmpSupervisorId] = useState("");
  const [empRole, setEmpRole] = useState<Role>("staff");
  // tambah pegawai baru
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpSupervisorId, setNewEmpSupervisorId] = useState("");
  const [newEmpRole, setNewEmpRole] = useState<Role>("staff");
  // detail pegawai
  const [detailEmpId, setDetailEmpId] = useState<string|null>(null);

  if (!currentUser) return null;

  const startEditEmp = (id: string) => {
    const e = employees.find(x=>x.id===id);
    if (!e) return;
    setEditingEmpId(id); setEmpSupervisorId(e.supervisorId ?? ""); setEmpRole(e.role);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">MANAJEMEN ORGANISASI</p>
          <h2 className="heading-serif text-[28px]">Struktur & master data</h2>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {([["struktur","Struktur"],["pegawai","Pegawai"]] as const).map(([k,label]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${tab===k ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : "bg-[#e4f0f1] border-[#e4f0f1] text-[#283338]"}`} style={{borderRadius:100}}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {!canManage && (
        <>
          <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <OrgTree />
          </div>
          <div className="p-4 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs leading-5 text-[#283338]/70" style={{ borderRadius: 12 }}><span className="font-semibold">Catatan:</span> supervisor_id ≠ parent_id. Yang pertama untuk struktur orang, yang kedua untuk pelimpahan rencana. Ubah struktur hanya oleh admin/direktur.</div>
        </>
      )}

      {canManage && tab === "struktur" && (
        <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <OrgTree />
          <p className="mt-4 font-mono text-xs text-[#283338]/60">Atur atasan & role per pegawai di tab <b>Pegawai</b>.</p>
        </div>
      )}

      {canManage && tab === "pegawai" && (
        <div className="space-y-4">
          <div className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1] font-mono text-xs tracking-[0.04em] uppercase text-[#283338]/60">
                  <tr><th className="text-left px-4 py-3">Pegawai</th><th className="text-left px-4 py-3">Atasan</th><th className="text-left px-4 py-3">Jabatan</th>{canManage && <th className="text-right px-4 py-3">Aksi</th>}</tr>
                </thead>
                <tbody>
                  {employees.map(e => {
                    const editing = editingEmpId === e.id;
                    return (
                      <tr key={e.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]/50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{e.avatar}</span><span><div className="font-medium">{e.name}</div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{e.email}</div></span></div></td>
                        <td className="px-4 py-3">
                          {editing ? (
                            <select value={empSupervisorId} onChange={ev=>setEmpSupervisorId(ev.target.value)} className="w-full max-w-[180px] px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{borderRadius:8}}>
                              <option value="">— Tanpa atasan —</option>
                              {employees.filter(x=>x.id!==e.id).map(em => <option key={em.id} value={em.id}>{em.name.split(",")[0]}</option>)}
                            </select>
                          ) : <span className="font-mono text-xs">{e.supervisorId ? employees.find(x=>x.id===e.supervisorId)?.name.split(",")[0] : "—"}</span>}
                        </td>
                        <td className="px-4 py-3">
                          {editing ? (
                            <select value={empRole} onChange={ev=>setEmpRole(ev.target.value as Role)} className="px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{borderRadius:8}}><option value="staff">staff</option><option value="supervisor">supervisor</option><option value="direktur">direktur</option><option value="admin">admin</option></select>
                          ) : <span className="text-xs">{roleLabel[e.role]}</span>}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            <div className="flex justify-end items-center gap-1">
                              {editing ? (
                                <>
                                  <button onClick={async ()=>{ const ok = await updateEmployeeOrg(e.id,{ supervisorId: empSupervisorId || null, role: empRole }); if(ok) setEditingEmpId(null); }} className="px-3 py-1.5 rounded-full bg-[#1c5d5f] text-white text-xs font-medium" style={{borderRadius:48}}>Simpan</button>
                                  <button onClick={()=>setEditingEmpId(null)} className="px-3 py-1.5 rounded-full bg-white border border-[#e4f0f1] text-xs" style={{borderRadius:48}}>Batal</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={()=>setDetailEmpId(e.id)} title="Detail pegawai" className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/70 flex items-center justify-center hover:border-[#a2cbcd] hover:text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{borderRadius:9999}}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                                  </button>
                                  <button onClick={()=>startEditEmp(e.id)} title="Ubah atasan/jabatan" className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center hover:border-[#a2cbcd] hover:text-[#1c5d5f]" style={{borderRadius:9999}}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
                                  </button>
                                  {isAdmin && (
                                    <button onClick={()=>{ if(confirm(`Hapus ${e.name}?`)) deleteEmployee(e.id); }} title="Hapus pegawai" className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]" style={{borderRadius:9999}}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Tambah pegawai — CRUD langsung di tab organisasi */}
          <div className="p-5 border bg-[#f2f8f7]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow text-[11px]">TAMBAH PEGAWAI</div>
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              <input placeholder="Nama lengkap" value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{borderRadius:12}} />
              <input placeholder="Email" value={newEmpEmail} onChange={e=>setNewEmpEmail(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{borderRadius:12}} />
              <select value={newEmpRole} onChange={e=>setNewEmpRole(e.target.value as Role)} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{borderRadius:12}}><option value="staff">staff</option><option value="supervisor">supervisor</option><option value="direktur">direktur</option><option value="admin">admin</option></select>
              <select value={newEmpSupervisorId} onChange={e=>setNewEmpSupervisorId(e.target.value)} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm" style={{borderRadius:12}}><option value="">— Tanpa atasan —</option>{employees.map(em=> <option key={em.id} value={em.id}>{em.name.split(",")[0]}</option>)}</select>
              <button onClick={async ()=>{
                if(!newEmpName.trim() || !newEmpEmail.trim()){ notify("Nama & email wajib"); return; }
                const ne = { id: "e" + Date.now(), userId: "u" + Date.now(), employeeNumber: "199" + Math.floor(Math.random()*10000000), name: newEmpName.trim(), email: newEmpEmail.trim(), supervisorId: newEmpSupervisorId || null, role: newEmpRole, avatar: newEmpName.trim().slice(0,2).toUpperCase() };
                setEmployees(prev=>[...prev, ne]);
                try{ await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(ne) }); }catch{}
                addLog("Menambah pegawai", `Menambah pegawai ${ne.name} via Organisasi`, "employee", ne.id); notify("Pegawai ditambahkan"); setNewEmpName(""); setNewEmpEmail(""); setNewEmpSupervisorId(""); setNewEmpRole("staff");
              }} className="px-4 py-2 rounded-full bg-[#1c5d5f] text-white text-xs font-medium hover:bg-[#156152] md:col-span-2" style={{borderRadius:48}}>Tambah Pegawai</button>
            </div>
            <p className="font-mono text-[11px] text-[#283338]/50 mt-2">Hapus hanya bisa jika pegawai tidak punya delegasi penerima & tidak terkait rencana.</p>
          </div>
        </div>
      )}

      {/* Detail pegawai — icon mata */}
      {detailEmpId && (() => {
        const emp = employees.find(x=>x.id===detailEmpId);
        if (!emp) return null;
        const bawahanCount = employees.filter(x=>x.supervisorId===emp.id).length;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={()=>setDetailEmpId(null)}>
            <div onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e4f0f1] overflow-hidden" style={{borderRadius:12}}>
              <div className="p-6 border-b border-[#e4f0f1] flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#16325a] text-white flex items-center justify-center text-sm font-bold">{emp.avatar}</span>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{emp.name}</div><div className="font-mono text-xs text-[#283338]/60 truncate">{emp.email}</div></div>
                <button onClick={()=>setDetailEmpId(null)} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center shrink-0">×</button>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{borderRadius:12}}><div className="font-mono text-[11px] uppercase text-[#283338]/60">NIP</div><div className="font-mono text-xs mt-1">{emp.employeeNumber}</div></div>
                  <div className="p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{borderRadius:12}}><div className="font-mono text-[11px] uppercase text-[#283338]/60">Role</div><div className="mt-1"><span className="font-mono text-xs px-2 py-1 rounded-full bg-[#1c5d5f] text-white" style={{borderRadius:100}}>{emp.role.toUpperCase()}</span></div></div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e4f0f1]" style={{borderRadius:12}}><div className="font-mono text-[11px] uppercase text-[#283338]/60">Jabatan</div><div className="font-medium mt-1">{roleLabel[emp.role]}</div></div>
                <div className="p-3 rounded-xl bg-white border border-[#e4f0f1]" style={{borderRadius:12}}><div className="font-mono text-[11px] uppercase text-[#283338]/60">Atasan</div><div className="font-medium mt-1">{emp.supervisorId ? employees.find(x=>x.id===emp.supervisorId)?.name ?? "-" : "— Tanpa atasan"}</div><div className="font-mono text-xs text-[#283338]/60 mt-1">{bawahanCount} delegasi penerima langsung</div></div>
              </div>
              <div className="p-4 border-t border-[#e4f0f1] flex gap-2 justify-end">
                <button onClick={()=>{ setDetailEmpId(null); startEditEmp(emp.id); }} className="px-4 py-2 rounded-full bg-white border border-[#e4f0f1] text-xs flex items-center gap-1.5" style={{borderRadius:48}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg> Edit</button>
                <button onClick={()=>setDetailEmpId(null)} className="px-4 py-2 rounded-full bg-white border border-[#e4f0f1] text-sm" style={{borderRadius:48}}>Tutup</button>
                <button onClick={()=>{ if(confirm(`Hapus ${emp.name}?`)){ setDetailEmpId(null); deleteEmployee(emp.id); } }} className="px-4 py-2 rounded-full bg-[#b91c1c] text-white text-sm font-medium" style={{borderRadius:48}}>Hapus</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
