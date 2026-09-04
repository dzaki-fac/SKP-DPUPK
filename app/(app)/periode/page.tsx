"use client";
import { useState } from "react";
import { useSKP } from "@/lib/store";
import { DatePicker } from "@/components/ui/date-picker";

export default function PeriodePage() {
 const { periods, setPeriods, plans, currentUser, periodForm, setPeriodForm, notify, addLog } = useSKP();
 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [confirmId, setConfirmId] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);
 if (!currentUser) return null;

 const canManage = ["admin","pimpinan_1"].includes(currentUser.role);
 const confirmPeriod = confirmId ? periods.find(p=>p.id===confirmId) ?? null : null;
 const confirmUsed = confirmPeriod ? plans.filter(pl=>pl.skpPeriodId===confirmPeriod.id).length : 0;

 const openCreate = () => {
 setEditingId(null);
 setPeriodForm({ name: "", year: 2027, startDate: "", endDate: "" });
 setShowModal(true);
 };

 const startEdit = (id: string) => {
 const p = periods.find(x=>x.id===id);
 if (!p) return;
 setEditingId(id);
 setPeriodForm({ name: p.name, year: p.year, startDate: p.startDate, endDate: p.endDate });
 setShowModal(true);
 };

 const closeModal = () => {
 setShowModal(false);
 setEditingId(null);
 setPeriodForm({ name: "", year: 2027, startDate: "", endDate: "" });
 };

 const handleSave = async () => {
 if (!periodForm.name || periodForm.name.trim().length < 3) { notify("Nama periode minimal 3 karakter"); return; }
 if (!periodForm.startDate || !periodForm.endDate) { notify("Lengkapi tanggal mulai & selesai"); return; }
 if (periodForm.startDate > periodForm.endDate) { notify("Tanggal mulai tidak boleh > tanggal selesai"); return; }
 setSaving(true);
 try {
 if (editingId) {
 const res = await fetch("/api/periods", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: editingId, name: periodForm.name.trim(), year: Number(periodForm.year), startDate: periodForm.startDate, endDate: periodForm.endDate }) });
 const j = await res.json().catch(()=>({}));
 if (!res.ok) { notify(j.error || "Gagal ubah periode"); return; }
 setPeriods(prev => prev.map(p => p.id===editingId ? { ...p, name: j.name ?? periodForm.name.trim(), year: j.year ?? Number(periodForm.year), startDate: j.startDate ?? periodForm.startDate, endDate: j.endDate ?? periodForm.endDate } : p));
 addLog("Mengubah periode", `Mengubah periode ${periodForm.name.trim()}`, "skp_period", editingId);
 notify("Periode diperbarui");
 } else {
 const res = await fetch("/api/periods", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: periodForm.name.trim(), year: Number(periodForm.year), startDate: periodForm.startDate, endDate: periodForm.endDate }) });
 const j = await res.json().catch(()=>({}));
 if (!res.ok) { notify(j.error || "Gagal tambah periode"); return; }
 const np = { id: j.id ?? "sp"+Date.now(), name: j.name ?? periodForm.name.trim(), year: j.year ?? Number(periodForm.year), startDate: j.startDate ?? periodForm.startDate, endDate: j.endDate ?? periodForm.endDate };
 setPeriods(prev => [np, ...prev]);
 addLog("Membuat periode", `Membuat periode ${np.name}`, "skp_period", np.id);
 notify("Periode ditambahkan");
 }
 closeModal();
 } catch (e:any) {
 notify(e?.message || "Gagal simpan");
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = async () => {
 if (!confirmPeriod) return;
 const id = confirmPeriod.id;
 const title = confirmPeriod.name;
 setConfirmId(null);
 const backup = periods;
 setPeriods(prev => prev.filter(p=>p.id!==id));
 try {
 const res = await fetch("/api/periods", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
 const j = await res.json().catch(()=>({}));
 if (!res.ok) throw new Error(j.error || res.statusText);
 addLog("Menghapus periode", `Menghapus periode ${title}`, "skp_period", id);
 notify(`Periode "${title}" dihapus`);
 } catch (e:any) {
 setPeriods(backup);
 notify("Gagal hapus: "+(e?.message || "error"));
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="eyebrow">PERIODE SKP</p>
 <h2 className="heading-sm">Kelola periode</h2>
 <p className="text-[14px] text-[#78716c] mt-1">Rentang waktu penilaian — setiap rencana terikat pada satu periode.</p>
 </div>
 {canManage && (
 <button onClick={openCreate} className="shrink-0 mt-1 w-10 h-10 rounded-full bg-[#0c0a09] text-white text-[20px] font-medium hover:bg-[#1c1917] flex items-center justify-center" title="Tambah periode">+</button>
 )}
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {periods.map(p => {
 const used = plans.filter(pl => pl.skpPeriodId === p.id).length;
 return (
 <div key={p.id} className={`seline-card ${editingId===p.id && showModal ? "!border-[#3ba6f1]" : ""}`}>
 <div className="flex items-start justify-between gap-2">
 <div className="text-[20px] font-normal tracking-[-0.1px] text-[#0c0a09] leading-tight" style={{ fontFamily: "var(--font-roobert)"}}>{p.name}</div>
 {canManage && (
 <div className="flex items-center gap-1 shrink-0">
 <button onClick={()=>startEdit(p.id)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:text-[#0c0a09]" title="Edit">
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
 </button>
 <button onClick={()=>setConfirmId(p.id)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#a8a29e] flex items-center justify-center hover:bg-[#fef2f2] hover:text-[#b91c1c]" title="Hapus">
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
 </button>
 </div>
 )}
 </div>
 <div className="text-[12px] tracking-wide text-[#78716c] mt-1">{p.startDate} → {p.endDate} • {p.year}</div>
 <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[12px] text-[#78716c]" style={{ borderRadius: 9999 }}>
 <span className="w-1.5 h-1.5 rounded-full bg-[#3ba6f1]"/>
 {used} rencana
 </div>
 </div>
 );
 })}
 </div>

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={closeModal}>
 <div onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5]" style={{borderRadius:12}}>
 <div className="p-6 border-b border-[#e8e6e5] bg-white" style={{borderRadius:"12px 12px 0 0"}}>
 <div className="eyebrow">{editingId ? "EDIT PERIODE" : "TAMBAH PERIODE"}</div>
 <h3 className="subheading mt-1">{editingId ? "Ubah periode" : "Periode baru"}</h3>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Nama</label>
 <input placeholder="SKP 2027" value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:12}} />
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tahun</label>
 <input type="number" placeholder="2027" value={periodForm.year} onChange={e => setPeriodForm({ ...periodForm, year: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:12}} />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tanggal Mulai</label>
 <DatePicker value={periodForm.startDate} onChange={v => setPeriodForm({ ...periodForm, startDate: v })} placeholder="Tanggal mulai" />
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tanggal Selesai</label>
 <DatePicker value={periodForm.endDate} onChange={v => setPeriodForm({ ...periodForm, endDate: v })} placeholder="Tanggal selesai" />
 </div>
 </div>
 </div>
 <div className="p-4 border-t border-[#e8e6e5] bg-white flex gap-2 justify-end" style={{borderRadius:"0 0 12px 12px"}}>
 <button onClick={closeModal} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{borderRadius:48}}>Batal</button>
 <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-full bg-[#0c0a09] text-white text-[14px] font-medium hover:bg-[#1c1917] disabled:opacity-50" style={{borderRadius:48}}>{saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Periode"}</button>
 </div>
 </div>
 </div>
 )}

 {confirmPeriod && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={()=>setConfirmId(null)}>
 <div onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5] overflow-hidden" style={{borderRadius:12}}>
 <div className="p-6">
 <h3 className="subheading leading-tight">Hapus periode ini?</h3>
 <p className="text-[14px] text-[#0c0a09]/80 mt-2">"{confirmPeriod.name}" ({confirmPeriod.startDate} → {confirmPeriod.endDate})</p>
 {confirmUsed>0 && <p className="text-[13px] text-[#b91c1c] mt-2">Dipakai {confirmUsed} rencana — hapus/pindahkan dulu.</p>}
 </div>
 <div className="p-4 border-t border-[#e8e6e5] flex gap-2 justify-end">
 <button onClick={()=>setConfirmId(null)} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{borderRadius:48}}>Batal</button>
 <button onClick={handleDelete} disabled={confirmUsed>0} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-[14px] font-medium hover:bg-[#991b1b] disabled:opacity-40" style={{borderRadius:48}}>Ya, Hapus</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
