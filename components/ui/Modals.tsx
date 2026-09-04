"use client";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";
import { useEffect, useState } from "react";
import { DatePicker } from "./date-picker";

function CustomTargetsEditorInline() {
 const { planCustomTargets, setPlanCustomTargets, editingPlan } = useSKP();
 // Saat edit, isi dari editingPlan.customTargets
 useEffect(() => {
 if (editingPlan?.customTargets) {
 setPlanCustomTargets(editingPlan.customTargets.map(ct => ({ name: ct.name, value: ct.value, unit: ct.unit })));
 } else if (!editingPlan) {
 // untuk buat baru, jangan reset otomatis jika user sudah isi
 }
 }, [editingPlan?.id]);
 // Reset saat modal buat baru dibuka (editingPlan null) — handled di page saat open

 return (
 <div className="border border-[#e8e6e5] rounded-xl p-3 bg-[#fafaf9]/50 mt-3" style={{ borderRadius: 12 }}>
 <div className="flex items-center justify-between">
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Rincian Target</label>
 <span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09]/60">{planCustomTargets.length} / 5</span>
 </div>
  <p className="text-[12px] text-[#0c0a09]/60 mt-1">Rincian terpisah dari Target jumlah. Contoh: <span className="font-semibold">jumlah peserta</span> → <span className="">250</span> <span className="italic">orang</span>, <span className="font-semibold">honor</span> → <span className="">500000</span> <span className="italic">perjam</span> • Opsional, maks 5</p>
 <div className="mt-3 space-y-2">
 {planCustomTargets.length === 0 && (
 <div className="text-[12px] text-[#0c0a09]/60 text-center py-2 border border-dashed border-[#d6d3d1] rounded-xl" style={{ borderRadius: 12 }}>Belum ada rincian target — tambah di bawah (opsional, maks 5)</div>
 )}
 {planCustomTargets.map((ct, idx) => (
 <div key={idx} className="grid grid-cols-[1fr_70px_70px_32px] sm:grid-cols-[1fr_80px_80px_36px] gap-1.5 sm:gap-2 items-end">
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Nama target</label>
 <input value={ct.name} onChange={e => {
 const copy = [...planCustomTargets];
 copy[idx] = { ...copy[idx], name: e.target.value };
 setPlanCustomTargets(copy);
 }} placeholder="jumlah peserta" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{ borderRadius: 8 }} />
 </div>
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Nilai</label>
 <input value={ct.value} onChange={e => {
 const copy = [...planCustomTargets];
 let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 20);
 copy[idx] = { ...copy[idx], value: v };
 setPlanCustomTargets(copy);
 }} placeholder="250" maxLength={20} inputMode="numeric" title={ct.value} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1] truncate" style={{ borderRadius: 8, textOverflow: "ellipsis"}} onFocus={e => { const v = e.target.value; requestAnimationFrame(() => e.target.setSelectionRange(v.length, v.length)); }} />
 </div>
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Satuan</label>
 <input value={ct.unit} onChange={e => {
 const copy = [...planCustomTargets];
 copy[idx] = { ...copy[idx], unit: e.target.value };
 setPlanCustomTargets(copy);
 }} placeholder="orang" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{ borderRadius: 8 }} />
 </div>
 <button type="button" onClick={() => setPlanCustomTargets(planCustomTargets.filter((_, i) => i !== idx))} className="mb-0.5 w-8 h-8 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center hover:bg-[#fafaf9]">×</button>
 </div>
 ))}
 {planCustomTargets.length < 5 && (
 <button type="button" onClick={() => setPlanCustomTargets([...planCustomTargets, { name: "", value: "", unit: ""}])} className="w-full py-1.5 rounded-full border border-dashed border-[#d6d3d1] bg-white text-[12px] font-medium text-[#3ba6f1] hover:bg-[#fafaf9]" style={{ borderRadius: 48 }}>+ Tambah target</button>
 )}
 {planCustomTargets.length >= 5 && <p className="text-[12px] text-[#b91c1c]">Maksimal 5 target</p>}
 </div>
  {planCustomTargets.length > 0 && (
  <div className="mt-3 p-2 rounded-xl bg-white border border-[#e8e6e5] text-center" style={{ borderRadius: 12 }}>
  <span className="text-[12px] text-[#0c0a09]/60">{planCustomTargets.length} rincian terpisah • tidak mempengaruhi Target jumlah</span>
  </div>
  )}
 </div>
 );
}

export function GlobalModals() {
 const {
 showPlanModal, setShowPlanModal, editingPlan, setEditingPlan, planForm, setPlanForm, periods, handleCreatePlan,
 showCascadeModal, setShowCascadeModal, cascadeTargets, setCascadeTargets, cascadePortions, setCascadePortions, cascadeTitles, setCascadeTitles, handleCascade, handleUpdateDelegation, handleDeleteDelegation, employees, currentUser,
 showRealizationModal, setShowRealizationModal, realForm, setRealForm, handleSubmitRealization, handleEditRealization, editingRealization, setEditingRealization,
 plans, planCustomTargets, setPlanCustomTargets, notify,
 } = useSKP() as any;
 const [pickerOpen, setPickerOpen] = useState(false);
 const [pickerQ, setPickerQ] = useState("");
 const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());

 return (
 <>
 {showPlanModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}>
 <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#e8e6e5]" style={{ borderRadius: 12 }}>
 <div className="p-6 border-b border-[#e8e6e5]"><div className="eyebrow">PERFORMANCE_PLANS</div><h3 className="subheading mt-1">{editingPlan ? " Edit Rencana Kinerja": " Buat Rencana Kinerja Baru"}</h3><p className="text-[12px] tracking-wide text-[#0c0a09]/60">parent_id untuk cascading hierarkis</p></div>
 <div className="p-6 space-y-4">
 <div><label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Judul Rencana</label><input value={planForm.title ?? ""} onChange={e => setPlanForm({ ...planForm, title: e.target.value })} placeholder="Contoh: Menyelenggarakan 6 webinar" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{ borderRadius: 12 }} /></div>
 <div><label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Periode SKP</label><select value={planForm.skpPeriodId} onChange={e => setPlanForm({ ...planForm, skpPeriodId: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px]" style={{ borderRadius: 12 }}>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tanggal Rencana Dijalankan</label>
 <DatePicker value={(planForm as any).plannedDate ?? ""} onChange={v => setPlanForm({ ...planForm, plannedDate: v } as any)} placeholder="Pilih tanggal rencana" className="mt-1" />
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Jam Rencana (24H)</label>
 <div className="flex gap-2 mt-1">
 {(() => {
 const [hStr, mStr] = ((planForm as any).plannedTime || "09:00").split(":");
 const hVal = (hStr || "09").padStart(2,"0");
 const mVal = (mStr || "00").padStart(2,"0");
 return (
 <>
 <select value={hVal} onChange={e => setPlanForm({ ...planForm, plannedTime: `${e.target.value}:${mVal}` } as any)} className="flex-1 px-2 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1] " style={{ borderRadius: 12 }}>
 {Array.from({length:24}, (_,i) => <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
 </select>
 <span className="flex items-center text-[14px]">:</span>
 <select value={mVal} onChange={e => setPlanForm({ ...planForm, plannedTime: `${hVal}:${e.target.value}` } as any)} className="flex-1 px-2 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1] " style={{ borderRadius: 12 }}>
 {Array.from({length:60}, (_,i) => <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
 </select>
 <span className="flex items-center text-[12px] text-[#0c0a09]/60">WIB</span>
 </>
 );
 })()}
 </div>
 </div>
 </div>
  <div>
  <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Target (jumlah realisasi)</label>
  <input value={planForm.target ?? ""} onChange={e => setPlanForm({ ...planForm, target: e.target.value })} placeholder="6" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{ borderRadius: 12 }} />
  <p className="text-[12px] text-[#0c0a09]/50 mt-1">Jumlah realisasi yang diharapkan — terpisah dari rincian di bawah. Saat dilimpahkan, hanya jumlah ini yang dibagi.</p>
  </div>
 <CustomTargetsEditorInline />
 <p className="text-[12px] text-[#0c0a09]/50">Deskripsi, indikator, bobot & tanggal akan diisi otomatis.</p>
 </div>
 <div className="p-6 border-t border-[#e8e6e5] flex gap-2 justify-end"><button onClick={() => setShowPlanModal(false)} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{ borderRadius: 48 }}>Batal</button><button onClick={handleCreatePlan} className="px-5 py-2 rounded-full bg-[#3ba6f1] text-white text-[14px] font-medium hover:bg-[#3398e1]" style={{ borderRadius: 48 }}>{editingPlan ? " Simpan Perubahan": " Buat Rencana"}</button></div>
 </div>
 </div>
 )}

 {showCascadeModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); setCascadeTitles({}); }}>
 <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" style={{ borderRadius: 12, border: "1px solid #e8e6e5"}}>
 <div className="p-5 border-b border-[#e8e6e5] shrink-0"><div className="eyebrow">PELIMPAHAN KINERJA</div><h3 className="subheading mt-1">Pelimpahan</h3><p className="text-[14px] text-[#0c0a09]/70 mt-1 truncate">"{showCascadeModal.title}"• <span className="font-normal text-[#3ba6f1]">Target {showCascadeModal.target}</span></p></div>
 <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
 {(() => {
 if (!currentUser) return null;
 const existing = plans.filter(p => p.parentId === showCascadeModal.id);
 const existingTotal = existing.reduce((s,p)=> s + (parseFloat(String(p.target).replace(",","."))||0),0);
 const parentTarget = parseFloat(String(showCascadeModal.target).replace(",","."))||0;
 const allCandidates = employees.filter(e => e.id !== currentUser.id);
 const existingIds = new Set(existing.map(e=>e.assignedTo));
 const candidates = allCandidates.filter(e=> !existingIds.has(e.id));
 const selectedTotal = cascadeTargets.reduce((s,id)=> s + (parseFloat(String(cascadePortions[id] ?? "1").replace(",","."))||0),0);
 const totalAll = existingTotal + selectedTotal;
 const over = parentTarget>0 && totalAll > parentTarget;
 const sisa = parentTarget - existingTotal;
 return (
 <>
 {/* Ringkasan */}
 <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#fafaf9] border border-[#e8e6e5]" style={{ borderRadius: 12 }}>
 <span className="text-[12px] text-[#0c0a09]/60">{existing.length} dilimpahkan • {existingTotal}{parentTarget>0?` / ${parentTarget}`:""} target</span>
 <span className={`text-[12px] font-medium ${sisa < 0 ? " text-[#b91c1c]": " text-[#3ba6f1]"}`}>Sisa {sisa}</span>
 </div>
 {/* Sudah dilimpahkan — ringkas */}
 {existing.length > 0 && (
 <div>
 <div className="eyebrow">DILIMPAHKAN ({existing.length})</div>
 <div className="mt-2 space-y-2">
 {existing.map(child=>{
 const emp = employees.find(e=>e.id===child.assignedTo);
 return (
 <details key={child.id} className="group rounded-xl border bg-white border-[#e8e6e5] overflow-hidden" style={{ borderRadius: 12 }}>
 <summary className="list-none flex items-center gap-2 p-2.5 cursor-pointer">
 <div className="w-7 h-7 rounded-full bg-[#3ba6f1] text-white flex items-center justify-center text-[12px] font-medium shrink-0">{emp?.avatar ?? "?"}</div>
 <div className="flex-1 min-w-0"><div className="text-[14px] font-medium truncate leading-none">{emp?.name?.split(",")[0] ?? child.assignedTo}</div><div className="text-[12px] text-[#0c0a09]/50">{child.progress}% • porsi {child.target}</div></div>
 <span className="text-[12px] px-2 py-0.5 rounded-full bg-white text-[#3ba6f1] shrink-0">{child.target}</span>
 <span className="text-[#0c0a09]/30 group-open:rotate-180 transition text-[12px]">▾</span>
 <button onClick={(e)=>{ e.preventDefault(); handleDeleteDelegation(child.id, child.title); }} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center hover:bg-[#fafaf9] shrink-0" title="Hapus">×</button>
 </summary>
 <div className="px-3 pb-3 space-y-2 border-t border-[#e8e6e5] bg-[#fafaf9]/50 pt-3">
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Judul</label>
 <input type="text" defaultValue={child.title} placeholder={showCascadeModal.title} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}}
 onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==child.title) handleUpdateDelegation(child.id, child.target, v); }}
 onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
 />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[12px] text-[#0c0a09]/60">Porsi</span>
 <input type="number" min={1} defaultValue={child.target} className="w-20 px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] text-center focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}}
 onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==child.target) handleUpdateDelegation(child.id, v, child.title); }}
 onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
 />
 <span className="text-[12px] text-[#0c0a09]/50">/ {parentTarget || "—"}</span>
 </div>
 </div>
 </details>
 );
 })}
 </div>
 </div>
 )}
 {existing.length===0 && <div className="p-3 rounded-xl bg-white border border-dashed border-[#d6d3d1] text-[12px] text-[#0c0a09]/50 text-center" style={{borderRadius:12}}>Belum ada pelimpahan — pilih pegawai di bawah</div>}

 {/* Tambah baru — simple checklist, porsi/judul collapsible */}
 <div>
 <div className="eyebrow flex items-center justify-between"><span>TAMBAH PELIMPAHAN</span>{cascadeTargets.length>0 && <span className="text-[12px] text-[#3ba6f1]">{cascadeTargets.length} dipilih • {selectedTotal} porsi</span>}</div>
 {candidates.length===0 ? <div className="mt-2 text-[12px] text-[#0c0a09]/60">Semua pegawai sudah dilimpahkan</div> :
 <div className="mt-2 space-y-1.5">
 {candidates.map(emp=>{
 const checked = cascadeTargets.includes(emp.id);
 return (
 <div key={emp.id} className={`rounded-xl border px-3 py-2.5 ${checked? " bg-[#fafaf9] border-[#d6d3d1]":"bg-white border-[#e8e6e5] hover:bg-[#fafaf9]"}`} style={{borderRadius:12}}>
 <label className="flex items-center gap-2.5 cursor-pointer">
 <input type="checkbox" checked={checked} onChange={e=>{
 if(e.target.checked){
 setCascadeTargets([...cascadeTargets, emp.id]);
 if(!cascadePortions[emp.id]) setCascadePortions({...cascadePortions, [emp.id]: "1"});
 if(!cascadeTitles[emp.id]) setCascadeTitles({...cascadeTitles, [emp.id]: showCascadeModal.title});
 } else {
 setCascadeTargets(cascadeTargets.filter(x=>x!==emp.id));
 const { [emp.id]:_, ...rest}=cascadePortions; setCascadePortions(rest);
 const { [emp.id]:__, ...restT}=cascadeTitles; setCascadeTitles(restT);
 }
 }} className="accent-[#3ba6f1] w-4 h-4"/>
 <div className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[12px] font-medium shrink-0">{emp.avatar}</div>
 <div className="flex-1 min-w-0"><div className="text-[14px] font-medium truncate leading-none">{emp.name.split(",")[0]}</div><div className="text-[12px] text-[#0c0a09]/50 truncate">{roleLabel[emp.role]}</div></div>
 {checked && <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-white border border-[#d6d3d1] text-[#3ba6f1]">{cascadePortions[emp.id] ?? "1"}</span>}
 </label>
 {checked && (
 <details className="mt-2 group/details">
 <summary className="list-none text-[12px] text-[#3ba6f1] underline cursor-pointer">Ubah judul & porsi ▾</summary>
 <div className="mt-2 space-y-2 pl-6">
 <input type="text" value={cascadeTitles[emp.id] ?? showCascadeModal.title} onChange={e=> setCascadeTitles({...cascadeTitles, [emp.id]: e.target.value})} placeholder={showCascadeModal.title} className="w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 <div className="flex items-center gap-2">
 <span className="text-[12px] text-[#0c0a09]/60">Porsi</span>
 <input type="number" min={1} value={cascadePortions[emp.id] ?? "1"} onChange={e=> setCascadePortions({...cascadePortions, [emp.id]: e.target.value})} className="w-20 px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] text-center focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 <span className="text-[12px] text-[#0c0a09]/50">default 1 • sisa {sisa - selectedTotal + (parseFloat(cascadePortions[emp.id] ?? "1")||0)}</span>
 </div>
 </div>
 </details>
 )}
 </div>
 );
 })}
 </div>}
 {over && <div className="mt-2 p-2 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[12px] text-[#b91c1c]" style={{borderRadius:12}}>Total {totalAll} melebihi target induk {parentTarget}</div>}
 </div>
 </>
 );
 })()}
 </div>
 <div className="p-5 border-t border-[#e8e6e5] flex gap-2 justify-between items-center shrink-0 bg-white">
 <span className="text-[12px] text-[#0c0a09]/50">{cascadeTargets.length} baru dipilih</span>
 <div className="flex gap-2"><button onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); setCascadeTitles({}); }} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{ borderRadius: 48 }}>Tutup</button><button onClick={handleCascade} disabled={cascadeTargets.length===0} className={`px-5 py-2 rounded-full text-[14px] font-medium ${cascadeTargets.length===0 ? " bg-white text-[#0c0a09]/40 cursor-not-allowed": " bg-[#3ba6f1] text-white hover:bg-[#3398e1]"}`} style={{ borderRadius: 48 }}>Limpahkan ({cascadeTargets.length})</button></div>
 </div>
 </div>
 </div>
 )}

 {showRealizationModal && (
 <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm overflow-y-auto" onClick={() => { setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] }); }}>
 <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg border border-[#e8e6e5] max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden my-4 sm:my-0" style={{ borderRadius: 12 }}>
 <div className="p-6 border-b border-[#e8e6e5] shrink-0"><div className="eyebrow">REALISASI KINERJA</div><h3 className="subheading mt-1">{editingRealization ? " Edit Realisasi": " Isi Realisasi"}</h3><p className="text-[12px] tracking-wide text-[#0c0a09]/60">{showRealizationModal.title} • Target: {showRealizationModal.target}{editingRealization ? ` • Edit: ${editingRealization.title}` : ""}</p></div>
 <div className="p-6 space-y-3 overflow-y-auto flex-1 min-h-0 overscroll-contain">
 <div><label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Judul Realisasi</label><input value={realForm.title} onChange={e => setRealForm({ ...realForm, title: e.target.value })} placeholder="Contoh: Webinar Registrasi 1" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{ borderRadius: 12 }} /></div>
 <div><label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Deskripsi</label><textarea value={realForm.description} onChange={e => setRealForm({ ...realForm, description: e.target.value })} rows={2} placeholder="Jelaskan capaian..." className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px]" style={{ borderRadius: 12 }} /></div>
  {/* Target terealisasi — warisi dari induk jika dilimpahkan agar tetap terbaca */}
  {(() => {
  const getEffective = (plan: any): any[] => {
  if (!plan) return [];
  if (plan.customTargets && plan.customTargets.length) return plan.customTargets;
  let cur: any = plan;
  while (cur?.parentId) {
  const parent = plans.find((p: any) => p.id === cur.parentId);
  if (!parent) break;
  if (parent.customTargets && parent.customTargets.length) return parent.customTargets;
  cur = parent;
  }
  return [];
  };
  const effective = getEffective(showRealizationModal);
  const hasEffective = effective.length > 0;
  const isInherited = hasEffective && !(showRealizationModal as any)?.customTargets?.length;
 if (!hasEffective) return null;
 const filledCount = realForm.targets.filter(t => String(t.value).trim().length > 0).length;
 return (
 <details className="border border-[#e8e6e5] rounded-xl bg-[#fafaf9]/50 group" style={{ borderRadius: 12 }} open>
 <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
 <span className="text-[12px] tracking-[0.04em] uppercase font-semibold">Target Terealisasi <span className="normal-case font-normal text-[#0c0a09]/50">• {effective.length} kolom {isInherited ? "warisan induk" : "dari rencana"}</span></span>
 <span className="flex items-center gap-2">
 {filledCount > 0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white">{filledCount}/{effective.length} terisi</span>}
 {filledCount === 0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09]/60">{effective.length} kolom</span>}
 <span className="text-[#0c0a09]/40 group-open:rotate-180 transition-transform">▾</span>
 </span>
 </summary>
 <div className="px-3 pb-3">
 <p className="text-[12px] text-[#0c0a09]/60">Isi capaian sesuai target dari rencana. Kosongkan jika tidak terealisasi.</p>
 <div className="mt-3 space-y-2">
 {effective.map((eff: any, idx: number) => {
 const curVal = realForm.targets[idx]?.value ?? "";
 return (
 <div key={eff.id ?? `${eff.name}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e6e5] bg-white" style={{ borderRadius: 12 }}>
 <div className="flex-1 min-w-0">
 <div className="text-[14px] font-medium text-[#0c0a09] leading-tight truncate" title={eff.name}>{eff.name}</div>
 <div className="text-[12px] text-[#0c0a09]/60 mt-0.5">{eff.value} {eff.unit} <span className="text-[#0c0a09]/40">• target</span></div>
 </div>
 <div className="shrink-0 w-[110px]">
 <input
 value={curVal}
 onChange={e => {
 const copy = [...realForm.targets];
 while (copy.length < effective.length) {
 const ei = effective[copy.length];
 copy.push({ name: ei.name, value: "", unit: ei.unit });
 }
 let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 20);
 copy[idx] = { name: eff.name, value: v, unit: eff.unit };
 if (copy.length > effective.length) copy.length = effective.length;
 setRealForm({ ...realForm, targets: copy });
 }}
 placeholder="0"
 maxLength={20}
 inputMode="numeric"
 title={curVal}
 className="w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] text-center focus:outline-none focus:border-[#d6d3d1] focus:bg-white"
 style={{ borderRadius: 12 }}
 />
 <div className="text-[10px] text-[#0c0a09]/50 text-center mt-1">{eff.unit}</div>
 </div>
 </div>
 );
 })}
 </div>
 <div className="mt-2 text-[12px] text-[#0c0a09]/50 text-center">{filledCount}/{effective.length} terisi — kosongkan jika tidak ada capaian</div>
 </div>
 </details>
 );
 })()}
 {/* Pegawai Terlibat + Peran — collapsed default */}
 <details className="border border-[#e8e6e5] rounded-xl bg-white group" style={{ borderRadius: 12 }} open={realForm.participants.length > 0 ? true : undefined}>
 <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
 <span className="text-[12px] tracking-[0.04em] uppercase font-semibold">Pegawai Terlibat <span className="normal-case font-normal text-[#0c0a09]/50">• opsional</span></span>
 <span className="flex items-center gap-2">
 {realForm.participants.length > 0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white">{realForm.participants.length} orang</span>}
 <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#0c0a09]/60 group-open:hidden">+ tambah</span>
 <span className="text-[#0c0a09]/40 group-open:rotate-180 transition-transform">▾</span>
 </span>
 </summary>
 <div className="px-3 pb-3">
 <div className="mt-3 space-y-2">
 {realForm.participants.map((p, idx) => {
 return (
 <div key={idx} className="space-y-1">
 <div className="grid grid-cols-[1fr_110px_32px] sm:grid-cols-[1fr_120px_32px] gap-1.5 sm:gap-2 items-start">
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Pegawai</label>
 <select value={p.employeeId ?? ""} onChange={e=>{
 const val=e.target.value;
 if (!val) return;
 if (realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===val)) { notify("Pegawai sudah dipilih"); return; }
 const copy=[...realForm.participants];
 copy[idx]={...copy[idx], employeeId: val, customName: undefined as any};
 setRealForm({...realForm, participants:copy});
 }} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}}>
 <option value="">-- Pilih pegawai --</option>
 {employees.filter(e=> !realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===e.id)).map(e=>(
 <option key={e.id} value={e.id}>{e.name.split(",")[0]} — {roleLabel[e.role] ?? e.role}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Peran</label>
 <input value={p.role} onChange={e=>{
 const copy=[...realForm.participants];
 copy[idx]={...copy[idx], role:e.target.value};
 setRealForm({...realForm, participants:copy});
 }} placeholder="Narasumber" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 </div>
 <button type="button" onClick={()=> setRealForm({...realForm, participants: realForm.participants.filter((_,i)=>i!==idx)})} className="mt-5 w-8 h-8 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center hover:bg-[#fafaf9] shrink-0">×</button>
 </div>
 </div>
 );
 })}
 {realForm.participants.length < 10 && (
 <div className="relative">
 <button type="button" onClick={()=>{ if(!pickerOpen){ setTempSelected(new Set()); setPickerQ(""); } setPickerOpen(v=>!v); }} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#e8e6e5] bg-white hover:border-[#d6d3d1] text-left transition-colors" style={{borderRadius:8}}>
 <span className="text-[13px] text-[#78716c] truncate">Pilih pegawai untuk ditambah...</span>
 <span className="flex items-center gap-1.5 shrink-0">
 {tempSelected.size>0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#3ba6f1] text-white font-medium">{tempSelected.size}</span>}
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`text-[#a8a29e] transition-transform ${pickerOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
 </span>
 </button>
 {pickerOpen && (
 <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#e8e6e5] rounded-lg shadow-lg overflow-hidden" style={{borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.08)"}}>
 <div className="p-2 border-b border-[#e8e6e5] bg-[#fafaf9]/60 flex items-center gap-2">
 <input value={pickerQ} onChange={e=>setPickerQ(e.target.value)} placeholder="Cari nama / jabatan / NIP..." className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[13px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 <button type="button" onClick={()=>{
 const available = employees.filter(e => {
 if (realForm.participants.some(pp=>pp.employeeId===e.id)) return false;
 if (!pickerQ.trim()) return true;
 const q = pickerQ.toLowerCase();
 return e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q)) || (e.employeeNumber && String(e.employeeNumber).toLowerCase().includes(q));
 });
 const remaining = 10 - realForm.participants.length;
 if (tempSelected.size >= Math.min(available.length, remaining) && available.length>0) {
 setTempSelected(new Set());
 } else {
 setTempSelected(new Set(available.slice(0, remaining).map(e=>e.id)));
 }
 }} className="text-[12px] font-medium text-[#3ba6f1] hover:underline whitespace-nowrap shrink-0">Pilih semua</button>
 </div>
 <div className="max-h-48 overflow-y-auto bg-white divide-y divide-[#e8e6e5]">
 {(() => {
 const available = employees.filter(e => {
 if (realForm.participants.some(pp=>pp.employeeId===e.id)) return false;
 if (!pickerQ.trim()) return true;
 const q = pickerQ.toLowerCase();
 return e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q)) || (e.employeeNumber && String(e.employeeNumber).toLowerCase().includes(q));
 });
 if (available.length === 0) return <div className="p-3 text-[12px] text-[#a8a29e] text-center">Tidak ada pegawai</div>;
 return available.map(e => {
 const checked = tempSelected.has(e.id);
 return (
 <label key={e.id} className="flex items-center gap-2 px-2 py-2 hover:bg-[#fafaf9] cursor-pointer">
 <input type="checkbox" checked={checked} onChange={ev=>{ const ns=new Set(tempSelected); if(ev.target.checked) ns.add(e.id); else ns.delete(e.id); setTempSelected(ns); }} className="accent-[#3ba6f1] w-4 h-4" />
 <span className="flex-1 min-w-0 text-[13px] truncate"><span className="font-medium text-[#0c0a09]">{e.name.split(",")[0]}</span> <span className="text-[#78716c] text-[11px]">— {roleLabel[e.role] ?? e.role}</span></span>
 <span className="text-[11px] text-[#a8a29e] hidden sm:inline">{e.employeeNumber ?? ""}</span>
 </label>
 );
 });
 })()}
 </div>
 <div className="p-2 border-t border-[#e8e6e5] bg-[#fafaf9]/50 flex items-center justify-between gap-2">
 <span className="text-[11px] text-[#78716c]">{tempSelected.size} dipilih • {realForm.participants.length}/10</span>
 <div className="flex gap-2">
 <button type="button" onClick={()=> setPickerOpen(false)} className="px-3 py-1.5 rounded-full border border-[#e8e6e5] bg-white text-[12px]">Batal</button>
 <button type="button" disabled={tempSelected.size===0} onClick={()=>{
 const remaining = 10 - realForm.participants.length;
 const toAdd = Array.from(tempSelected).slice(0, remaining);
 if (!toAdd.length) return;
 const newParts = toAdd.map(id=>({ employeeId: id, role: "Peserta" } as any));
 setRealForm({...realForm, participants: [...realForm.participants, ...newParts]});
 setPickerOpen(false);
 setTempSelected(new Set());
 setPickerQ("");
 }} className="px-4 py-1.5 rounded-full bg-[#3ba6f1] text-white text-[12px] font-medium disabled:opacity-40 hover:bg-[#3398e1]">Tambah {tempSelected.size ? `(${tempSelected.size})` : ""}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 {realForm.participants.length >= 10 && <p className="text-[12px] text-[#b91c1c]">Maksimal 10 pegawai</p>}
 </div>
 </div>
 </details>
 <div><label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tanggal</label><DatePicker value={realForm.date} onChange={v => setRealForm({ ...realForm, date: v })} placeholder="Pilih tanggal realisasi" className="mt-1" />
 <p className="text-[12px] text-[#0c0a09]/50 mt-1">Jam otomatis WIB <span className="font-semibold text-[#3ba6f1]">{realForm.time || "09:00"} WIB</span> — ubah jika perlu:</p>
 <details className="mt-1 group">
 <summary className="list-none text-[12px] text-[#3ba6f1] underline cursor-pointer select-none">Atur jam manual ▾</summary>
 <div className="flex gap-2 mt-2">
 {(() => {
 const [hStr, mStr] = (realForm.time || "09:00").split(":");
 const hVal = hStr?.padStart(2,"0") ?? "09";
 const mVal = mStr?.padStart(2,"0") ?? "00";
 return (
 <>
 <select value={hVal} onChange={e => setRealForm({ ...realForm, time: `${e.target.value}:${mVal}` })} className="flex-1 px-2 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1] " style={{ borderRadius: 12 }}>
 {Array.from({length:24}, (_,i) => {
 const h = String(i).padStart(2,"0");
 return <option key={h} value={h}>{h}</option>;
 })}
 </select>
 <span className="flex items-center text-[14px] text-[#0c0a09]">:</span>
 <select value={mVal} onChange={e => setRealForm({ ...realForm, time: `${hVal}:${e.target.value}` })} className="flex-1 px-2 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1] " style={{ borderRadius: 12 }}>
 {Array.from({length:60}, (_,i) => {
 const m = String(i).padStart(2,"0");
 return <option key={m} value={m}>{m}</option>;
 })}
 </select>
 <span className="flex items-center text-[12px] text-[#0c0a09]/60 px-1">WIB</span>
 </>
 );
 })()}
 </div>
 </details>
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Bukti (upload file) {editingRealization ? "— tambah bukti baru (opsional)": ""}</label>
 <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv" onChange={async e => {
 const files = Array.from(e.target.files ?? []);
 if (!files.length) return;
 const valid = files.filter(f => {
 if (f.size > 10*1024*1024) { alert(`${f.name} melebihi 10MB — dilewati`); return false; }
 return true;
 });
 if (!valid.length) return;
 // upload semua sekaligus
 const uploaded: Array<{fileName: string, filePath: string, fileSize: string}> = [];
 for (const f of valid) {
 const fd = new FormData();
 fd.append("file", f);
 if (showRealizationModal) fd.append("planId", showRealizationModal.id);
 try {
 const r = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include"});
 const j = await r.json();
 if (!r.ok) alert(j.error || `Gagal upload ${f.name}`);
 else uploaded.push({ fileName: j.fileName || f.name, filePath: j.filePath, fileSize: j.fileSize || `${(f.size/1024).toFixed(1)} KB` });
 } catch { alert(`Gagal upload ${f.name}`); }
 }
 if (uploaded.length) setRealForm({ ...realForm, files: [...realForm.files, ...uploaded] });
 // reset input
 (e.target as HTMLInputElement).value = "";
 }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] file:mr-3 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-[#3ba6f1] file:text-white file:text-[12px]" style={{ borderRadius: 12 }} />
 {realForm.files.length > 0 && (
 <div className="mt-2 space-y-1">
 {realForm.files.map((f, idx) => (
 <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[12px]" style={{ borderRadius: 12 }}>
 <span className="truncate">📎 {f.fileName} • {f.fileSize}</span>
 <button onClick={() => setRealForm({ ...realForm, files: realForm.files.filter((_, i) => i !== idx) })} className="ml-2 text-[#b91c1c] hover:underline shrink-0">hapus</button>
 </div>
 ))}
 </div>
 )}
 <p className="text-[12px] tracking-wide text-[#0c0a09]/50 mt-1">PDF, JPG, PNG, DOCX, XLSX, CSV — maks 10MB per file, boleh pilih banyak sekaligus</p>
 </div>
 </div>
 <div className="p-6 border-t border-[#e8e6e5] flex gap-2 justify-end shrink-0 bg-white">
 <button onClick={() => { setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] }); }} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{ borderRadius: 48 }}>Batal</button>
 <button onClick={() => editingRealization ? handleEditRealization() : handleSubmitRealization()} className="px-5 py-2 rounded-full bg-[#0c0a09] text-white text-[14px] font-medium" style={{ borderRadius: 48 }}>{editingRealization ? " Simpan Perubahan": " Kirim Realisasi"}</button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
