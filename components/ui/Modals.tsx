"use client";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";
import { useEffect } from "react";

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
    <div className="border border-[#e4f0f1] rounded-xl p-3 bg-[#f2f8f7]/50 mt-3" style={{ borderRadius: 12 }}>
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Rincian Target</label>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/60">{planCustomTargets.length} / 5</span>
      </div>
      <p className="font-mono text-[11px] text-[#283338]/60 mt-1">Seperti form realisasi — Contoh: <span className="font-semibold">jumlah peserta</span> → <span className="font-mono">250</span> <span className="italic">orang</span>, <span className="font-semibold">honor</span> → <span className="font-mono">500000</span> <span className="italic">perjam</span> • Jika diisi, Target (jumlah) otomatis = jumlah baris</p>
      <div className="mt-3 space-y-2">
        {planCustomTargets.length === 0 && (
          <div className="text-xs text-[#283338]/60 text-center py-2 border border-dashed border-[#a2cbcd] rounded-xl" style={{ borderRadius: 12 }}>Belum ada rincian target — tambah di bawah (opsional, maks 5)</div>
        )}
        {planCustomTargets.map((ct, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_70px_70px_32px] sm:grid-cols-[1fr_80px_80px_36px] gap-1.5 sm:gap-2 items-end">
            <div>
              <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Nama target</label>
              <input value={ct.name} onChange={e => {
                const copy = [...planCustomTargets];
                copy[idx] = { ...copy[idx], name: e.target.value };
                setPlanCustomTargets(copy);
              }} placeholder="jumlah peserta" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 8 }} />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Nilai</label>
              <input value={ct.value} onChange={e => {
                const copy = [...planCustomTargets];
                let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 20);
                copy[idx] = { ...copy[idx], value: v };
                setPlanCustomTargets(copy);
              }} placeholder="250" maxLength={20} inputMode="numeric" title={ct.value} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd] font-mono truncate" style={{ borderRadius: 8, textOverflow: "ellipsis" }} onFocus={e => { const v = e.target.value; requestAnimationFrame(() => e.target.setSelectionRange(v.length, v.length)); }} />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Satuan</label>
              <input value={ct.unit} onChange={e => {
                const copy = [...planCustomTargets];
                copy[idx] = { ...copy[idx], unit: e.target.value };
                setPlanCustomTargets(copy);
              }} placeholder="orang" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 8 }} />
            </div>
            <button type="button" onClick={() => setPlanCustomTargets(planCustomTargets.filter((_, i) => i !== idx))} className="mb-0.5 w-8 h-8 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]">×</button>
          </div>
        ))}
        {planCustomTargets.length < 5 && (
          <button type="button" onClick={() => setPlanCustomTargets([...planCustomTargets, { name: "", value: "", unit: "" }])} className="w-full py-1.5 rounded-full border border-dashed border-[#a2cbcd] bg-white text-xs font-medium text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{ borderRadius: 48 }}>+ Tambah target</button>
        )}
        {planCustomTargets.length >= 5 && <p className="font-mono text-[11px] text-[#b91c1c]">Maksimal 5 target</p>}
      </div>
      {planCustomTargets.length > 0 && (
        <div className="mt-3 p-2 rounded-xl bg-white border border-[#e4f0f1] text-center" style={{ borderRadius: 12 }}>
          <span className="font-mono text-[11px] text-[#283338]/60">Target (jumlah) otomatis: </span>
          <span className="font-mono text-xs font-bold text-[#1c5d5f]">{planCustomTargets.length}</span>
          <span className="font-mono text-[11px] text-[#283338]/60"> kolom</span>
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
    plans, planCustomTargets, setPlanCustomTargets,
  } = useSKP();

  return (
    <>
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1]"><div className="eyebrow">PERFORMANCE_PLANS</div><h3 className="heading-serif text-xl mt-1">{editingPlan ? "Edit Rencana Kinerja" : "Buat Rencana Kinerja Baru"}</h3><p className="font-mono text-xs tracking-wide text-[#283338]/60">parent_id untuk cascading hierarkis</p></div>
            <div className="p-6 space-y-4">
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Judul Rencana</label><input value={planForm.title ?? ""} onChange={e => setPlanForm({ ...planForm, title: e.target.value })} placeholder="Contoh: Menyelenggarakan 6 webinar" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} /></div>
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Periode SKP</label><select value={planForm.skpPeriodId} onChange={e => setPlanForm({ ...planForm, skpPeriodId: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }}>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Tanggal Rencana Dijalankan</label>
                  <input type="date" value={(planForm as any).plannedDate ?? ""} onChange={e => setPlanForm({ ...planForm, plannedDate: e.target.value } as any)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Jam Rencana (24H)</label>
                  <div className="flex gap-2 mt-1">
                    {(() => {
                      const [hStr, mStr] = ((planForm as any).plannedTime || "09:00").split(":");
                      const hVal = (hStr || "09").padStart(2,"0");
                      const mVal = (mStr || "00").padStart(2,"0");
                      return (
                        <>
                          <select value={hVal} onChange={e => setPlanForm({ ...planForm, plannedTime: `${e.target.value}:${mVal}` } as any)} className="flex-1 px-2 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] font-mono" style={{ borderRadius: 12 }}>
                            {Array.from({length:24}, (_,i) => <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
                          </select>
                          <span className="flex items-center font-mono text-sm">:</span>
                          <select value={mVal} onChange={e => setPlanForm({ ...planForm, plannedTime: `${hVal}:${e.target.value}` } as any)} className="flex-1 px-2 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] font-mono" style={{ borderRadius: 12 }}>
                            {Array.from({length:60}, (_,i) => <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
                          </select>
                          <span className="flex items-center font-mono text-xs text-[#283338]/60">WIB</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Target (jumlah)</label>
                <input value={planCustomTargets.length > 0 ? String(planCustomTargets.length) : (planForm.target ?? "")} onChange={e => setPlanForm({ ...planForm, target: e.target.value })} placeholder="6" disabled={planCustomTargets.length > 0} title={planCustomTargets.length > 0 ? "Otomatis dari jumlah Rincian Target di bawah — hapus rincian untuk edit manual" : undefined} className={`mt-1 w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#a2cbcd] ${planCustomTargets.length > 0 ? "bg-[#e4f0f1] border-[#a2cbcd] text-[#1c5d5f] font-mono font-bold" : "bg-[#f2f8f7] border-[#e4f0f1]"}`} style={{ borderRadius: 12 }} />
                {planCustomTargets.length > 0 && <p className="font-mono text-[11px] text-[#1c5d5f] mt-1">Otomatis = {planCustomTargets.length} dari rincian di bawah</p>}
                {planCustomTargets.length === 0 && <p className="font-mono text-[11px] text-[#283338]/50 mt-1">Atau isi Rincian Target di bawah — jumlah baris akan jadi Target otomatis</p>}
              </div>
              <CustomTargetsEditorInline />
              <p className="font-mono text-[11px] text-[#283338]/50">Deskripsi, indikator, bobot & tanggal akan diisi otomatis.</p>
            </div>
            <div className="p-6 border-t border-[#e4f0f1] flex gap-2 justify-end"><button onClick={() => setShowPlanModal(false)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button><button onClick={handleCreatePlan} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>{editingPlan ? "Simpan Perubahan" : "Buat Rencana"}</button></div>
          </div>
        </div>
      )}

      {showCascadeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); setCascadeTitles({}); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" style={{ borderRadius: 12, border: "1px solid #e4f0f1" }}>
            <div className="p-5 border-b border-[#e4f0f1] shrink-0"><div className="eyebrow">PELIMPAHAN KINERJA</div><h3 className="heading-serif text-lg mt-1">Pelimpahan</h3><p className="text-sm text-[#283338]/70 mt-1 truncate">"{showCascadeModal.title}" • <span className="font-bold text-[#1c5d5f]">Target {showCascadeModal.target}</span></p></div>
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
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                      <span className="font-mono text-xs text-[#283338]/60">{existing.length} dilimpahkan • {existingTotal}{parentTarget>0?` / ${parentTarget}`:""} target</span>
                      <span className={`font-mono text-xs font-bold ${sisa < 0 ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>Sisa {sisa}</span>
                    </div>
                    {/* Sudah dilimpahkan — ringkas */}
                    {existing.length > 0 && (
                    <div>
                      <div className="eyebrow text-[11px]">DILIMPAHKAN ({existing.length})</div>
                      <div className="mt-2 space-y-2">
                        {existing.map(child=>{
                          const emp = employees.find(e=>e.id===child.assignedTo);
                          return (
                            <details key={child.id} className="group rounded-xl border bg-white border-[#e4f0f1] overflow-hidden" style={{ borderRadius: 12 }}>
                              <summary className="list-none flex items-center gap-2 p-2.5 cursor-pointer">
                                <div className="w-7 h-7 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{emp?.avatar ?? "?"}</div>
                                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate leading-none">{emp?.name?.split(",")[0] ?? child.assignedTo}</div><div className="font-mono text-[11px] text-[#283338]/50">{child.progress}% • porsi {child.target}</div></div>
                                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#e4f0f1] text-[#1c5d5f] shrink-0">{child.target}</span>
                                <span className="text-[#283338]/30 group-open:rotate-180 transition text-xs">▾</span>
                                <button onClick={(e)=>{ e.preventDefault(); handleDeleteDelegation(child.id, child.title); }} className="w-7 h-7 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2] shrink-0" title="Hapus">×</button>
                              </summary>
                              <div className="px-3 pb-3 space-y-2 border-t border-[#e4f0f1] bg-[#f2f8f7]/50 pt-3">
                                <div>
                                  <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Judul</label>
                                  <input type="text" defaultValue={child.title} placeholder={showCascadeModal.title} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}}
                                    onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==child.title) handleUpdateDelegation(child.id, child.target, v); }}
                                    onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-[#283338]/60">Porsi</span>
                                  <input type="number" min={1} defaultValue={child.target} className="w-20 px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm text-center focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}}
                                    onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==child.target) handleUpdateDelegation(child.id, v, child.title); }}
                                    onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                                  />
                                  <span className="font-mono text-xs text-[#283338]/50">/ {parentTarget || "—"}</span>
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                    )}
                    {existing.length===0 && <div className="p-3 rounded-xl bg-white border border-dashed border-[#a2cbcd] text-xs text-[#283338]/50 text-center" style={{borderRadius:12}}>Belum ada pelimpahan — pilih pegawai di bawah</div>}

                    {/* Tambah baru — simple checklist, porsi/judul collapsible */}
                    <div>
                      <div className="eyebrow text-[11px] flex items-center justify-between"><span>TAMBAH PELIMPAHAN</span>{cascadeTargets.length>0 && <span className="font-mono text-[11px] text-[#1c5d5f]">{cascadeTargets.length} dipilih • {selectedTotal} porsi</span>}</div>
                      {candidates.length===0 ? <div className="mt-2 text-xs text-[#283338]/60">Semua pegawai sudah dilimpahkan</div> :
                      <div className="mt-2 space-y-1.5">
                        {candidates.map(emp=>{
                          const checked = cascadeTargets.includes(emp.id);
                          return (
                            <div key={emp.id} className={`rounded-xl border px-3 py-2.5 ${checked? "bg-[#f2f8f7] border-[#a2cbcd]":"bg-white border-[#e4f0f1] hover:bg-[#f2f8f7]"}`} style={{borderRadius:12}}>
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
                                }} className="accent-[#1c5d5f] w-4 h-4" />
                                <div className="w-7 h-7 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{emp.avatar}</div>
                                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate leading-none">{emp.name.split(",")[0]}</div><div className="font-mono text-[11px] text-[#283338]/50 truncate">{roleLabel[emp.role]}</div></div>
                                {checked && <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-white border border-[#a2cbcd] text-[#1c5d5f]">{cascadePortions[emp.id] ?? "1"}</span>}
                              </label>
                              {checked && (
                                <details className="mt-2 group/details">
                                  <summary className="list-none font-mono text-[11px] text-[#1c5d5f] underline cursor-pointer">Ubah judul & porsi ▾</summary>
                                  <div className="mt-2 space-y-2 pl-6">
                                    <input type="text" value={cascadeTitles[emp.id] ?? showCascadeModal.title} onChange={e=> setCascadeTitles({...cascadeTitles, [emp.id]: e.target.value})} placeholder={showCascadeModal.title} className="w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}} />
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-[#283338]/60">Porsi</span>
                                      <input type="number" min={1} value={cascadePortions[emp.id] ?? "1"} onChange={e=> setCascadePortions({...cascadePortions, [emp.id]: e.target.value})} className="w-20 px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm text-center focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}} />
                                      <span className="font-mono text-[11px] text-[#283338]/50">default 1 • sisa {sisa - selectedTotal + (parseFloat(cascadePortions[emp.id] ?? "1")||0)}</span>
                                    </div>
                                  </div>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>}
                      {over && <div className="mt-2 p-2 rounded-xl bg-[#f2e8e2] border border-[#d6aec1] text-xs text-[#b91c1c]" style={{borderRadius:12}}>Total {totalAll} melebihi target induk {parentTarget}</div>}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-5 border-t border-[#e4f0f1] flex gap-2 justify-between items-center shrink-0 bg-white">
              <span className="font-mono text-xs text-[#283338]/50">{cascadeTargets.length} baru dipilih</span>
              <div className="flex gap-2"><button onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); setCascadeTitles({}); }} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Tutup</button><button onClick={handleCascade} disabled={cascadeTargets.length===0} className={`px-5 py-2 rounded-full text-sm font-medium ${cascadeTargets.length===0 ? "bg-[#e4f0f1] text-[#283338]/40 cursor-not-allowed" : "bg-[#1c5d5f] text-white hover:bg-[#156152]"}`} style={{ borderRadius: 48 }}>Limpahkan ({cascadeTargets.length})</button></div>
            </div>
          </div>
        </div>
      )}

      {showRealizationModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm overflow-y-auto" onClick={() => { setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] }); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg border border-[#e4f0f1] max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden my-4 sm:my-0" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1] shrink-0"><div className="eyebrow">REALISASI KINERJA</div><h3 className="heading-serif text-lg mt-1">{editingRealization ? "Edit Realisasi" : "Isi Realisasi"}</h3><p className="font-mono text-xs tracking-wide text-[#283338]/60">{showRealizationModal.title} • Target: {showRealizationModal.target}{editingRealization ? ` • Edit: ${editingRealization.title}` : ""}</p></div>
            <div className="p-6 space-y-3 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Judul Realisasi</label><input value={realForm.title} onChange={e => setRealForm({ ...realForm, title: e.target.value })} placeholder="Contoh: Webinar Registrasi 1" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} /></div>
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Deskripsi</label><textarea value={realForm.description} onChange={e => setRealForm({ ...realForm, description: e.target.value })} rows={2} placeholder="Jelaskan capaian..." className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} /></div>
              {/* Target terealisasi — diisi pengaju, max 5 — collapsed default (opsi 1 simplifikasi) */}
              <details className="border border-[#e4f0f1] rounded-xl bg-[#f2f8f7]/50 group" style={{ borderRadius: 12 }} open={realForm.targets.length > 0 ? true : undefined}>
                <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
                  <span className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Target Terealisasi <span className="normal-case font-normal text-[#283338]/50">• opsional</span></span>
                  <span className="flex items-center gap-2">
                    {realForm.targets.length > 0 && <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#1c5d5f] text-white">{realForm.targets.length}</span>}
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/60 group-open:hidden">+ tambah</span>
                    <span className="text-[#283338]/40 group-open:rotate-180 transition-transform">▾</span>
                  </span>
                </summary>
                <div className="px-3 pb-3">
                <p className="font-mono text-[11px] text-[#283338]/60">
                  Isi capaian per target. Contoh: <span className="font-semibold">jumlah peserta</span> → <span className="font-mono">250</span> <span className="italic">orang</span>
                  {showRealizationModal?.customTargets && showRealizationModal.customTargets.length>0 && (
                    <span> • <button type="button" onClick={()=>{
                      const tpl = (showRealizationModal as any).customTargets.map((ct:any)=>({ name: ct.name, value: ct.value, unit: ct.unit }));
                      const curNames = new Set(realForm.targets.map(t=>t.name.trim().toLowerCase()));
                      const toAdd = tpl.filter((ct:any)=> !curNames.has(ct.name.trim().toLowerCase())).map((ct:any)=>({ name: ct.name, value: "", unit: ct.unit }));
                      if (toAdd.length) setRealForm({ ...realForm, targets: [...realForm.targets, ...toAdd].slice(0,5) });
                    }} className="underline text-[#1c5d5f] hover:text-[#0e4749]">salin dari target rencana ({showRealizationModal.customTargets.length})</button></span>
                  )}
                </p>
                <div className="mt-3 space-y-2">
                  {realForm.targets.length === 0 && (
                    <div className="text-xs text-[#283338]/60 text-center py-2 border border-dashed border-[#a2cbcd] rounded-xl" style={{ borderRadius: 12 }}>Belum ada target — klik tambah di bawah</div>
                  )}
                  {realForm.targets.map((ct, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_70px_32px] sm:grid-cols-[1fr_80px_80px_36px] gap-1.5 sm:gap-2 items-end">
                      <div>
                        <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Nama target</label>
                        <input value={ct.name} onChange={e => {
                          const copy = [...realForm.targets];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setRealForm({ ...realForm, targets: copy });
                        }} placeholder="jumlah peserta" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 8 }} />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Capaian</label>
                        <input value={ct.value} onChange={e => {
                          const copy = [...realForm.targets];
                          let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 20);
                          copy[idx] = { ...copy[idx], value: v };
                          setRealForm({ ...realForm, targets: copy });
                        }} placeholder="250" maxLength={20} inputMode="numeric" title={ct.value} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd] font-mono truncate" style={{ borderRadius: 8 }} />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Satuan</label>
                        <input value={ct.unit} onChange={e => {
                          const copy = [...realForm.targets];
                          copy[idx] = { ...copy[idx], unit: e.target.value };
                          setRealForm({ ...realForm, targets: copy });
                        }} placeholder="orang" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 8 }} />
                      </div>
                      <button type="button" onClick={() => setRealForm({ ...realForm, targets: realForm.targets.filter((_, i) => i !== idx) })} className="mb-0.5 w-8 h-8 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]">×</button>
                    </div>
                  ))}
                  {realForm.targets.length < 5 && (
                    <button type="button" onClick={() => setRealForm({ ...realForm, targets: [...realForm.targets, { name: "", value: "", unit: "" }] })} className="w-full py-1.5 rounded-full border border-dashed border-[#a2cbcd] bg-white text-xs font-medium text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{ borderRadius: 48 }}>+ Tambah target terealisasi</button>
                  )}
                  {realForm.targets.length >= 5 && <p className="font-mono text-[11px] text-[#b91c1c]">Maksimal 5 target per realisasi</p>}
                </div>
                {realForm.targets.length > 0 && (
                  <div className="mt-2 font-mono text-[11px] text-[#283338]/50 text-center">{realForm.targets.length} target akan disimpan bersama realisasi</div>
                )}
                </div>
              </details>
              {/* Pegawai Terlibat + Peran — collapsed default */}
              <details className="border border-[#e4f0f1] rounded-xl bg-white group" style={{ borderRadius: 12 }} open={realForm.participants.length > 0 ? true : undefined}>
                <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
                  <span className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Pegawai Terlibat <span className="normal-case font-normal text-[#283338]/50">• opsional</span></span>
                  <span className="flex items-center gap-2">
                    {realForm.participants.length > 0 && <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#1c5d5f] text-white">{realForm.participants.length} orang</span>}
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#f2f8f7] border border-[#e4f0f1] text-[#283338]/60 group-open:hidden">+ tambah</span>
                    <span className="text-[#283338]/40 group-open:rotate-180 transition-transform">▾</span>
                  </span>
                </summary>
                <div className="px-3 pb-3">
                <p className="font-mono text-[11px] text-[#283338]/60">Pilih pegawai yang terlibat dan tulis perannya (mis. Narasumber, Moderator)</p>
                <div className="mt-3 space-y-2">
                  {realForm.participants.length === 0 && (
                    <div className="text-xs text-[#283338]/60 text-center py-2 border border-dashed border-[#a2cbcd] rounded-xl" style={{ borderRadius: 12 }}>Belum ada pegawai terlibat — tambah di bawah</div>
                  )}
                  {realForm.participants.map((p, idx) => {
                    const emp = employees.find(e=>e.id===p.employeeId);
                    const displayValue = p.employeeId ? (emp?.name ?? "") : (p.customName ?? "");
                    const filteredEmps = (() => {
                      const q = displayValue.toLowerCase().trim();
                      if (!q) return employees.filter(e => !realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===e.id)).slice(0,8);
                      return employees.filter(e => {
                        if (realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===e.id)) return false;
                        return e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q);
                      }).slice(0,8);
                    })();
                    const showDropdown = displayValue.trim().length > 0 && filteredEmps.length > 0 && !(emp && displayValue === emp.name);
                    const isCustom = !p.employeeId && displayValue.trim().length > 0 && !employees.some(e=>e.name.toLowerCase()===displayValue.toLowerCase().trim());
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="grid grid-cols-[1fr_110px_32px] sm:grid-cols-[1fr_120px_32px] gap-1.5 sm:gap-2 items-start">
                          <div className="relative">
                            <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Pegawai <span className="normal-case font-normal text-[#283338]/40">(ketik nama)</span></label>
                            <input
                              value={displayValue}
                              onChange={e=>{
                                const val = e.target.value;
                                const copy=[...realForm.participants];
                                const matched = employees.find(empOpt => empOpt.name.toLowerCase() === val.toLowerCase().trim() || empOpt.name.split(",")[0].toLowerCase() === val.toLowerCase().trim());
                                if (matched && !realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===matched.id)) {
                                  copy[idx]={...copy[idx], employeeId: matched.id, customName: undefined};
                                } else {
                                  const exactMatch = employees.find(empOpt => empOpt.name.toLowerCase() === val.toLowerCase().trim());
                                  if (exactMatch) {
                                    copy[idx]={...copy[idx], employeeId: exactMatch.id, customName: undefined};
                                  } else {
                                    copy[idx]={...copy[idx], employeeId: undefined, customName: val};
                                  }
                                }
                                setRealForm({...realForm, participants:copy});
                              }}
                              onBlur={()=>{
                                const val = displayValue.trim();
                                if (!val) return;
                                const matched = employees.find(empOpt => empOpt.name.toLowerCase() === val.toLowerCase() || empOpt.name.split(",")[0].toLowerCase() === val.toLowerCase());
                                if (matched && !realForm.participants.some((pp,i)=>i!==idx && pp.employeeId===matched.id)) {
                                  const copy=[...realForm.participants];
                                  copy[idx]={...copy[idx], employeeId: matched.id, customName: undefined};
                                  setRealForm({...realForm, participants:copy});
                                }
                              }}
                              placeholder="Ketik nama pegawai..."
                              className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}}
                            />
                            {showDropdown && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-[#e4f0f1] rounded-lg shadow-lg max-h-32 overflow-y-auto" style={{borderRadius:8}}>
                                {filteredEmps.map(empOpt=>(
                                  <div
                                    key={empOpt.id}
                                    onMouseDown={e=>{
                                      e.preventDefault();
                                      const copy=[...realForm.participants];
                                      copy[idx]={...copy[idx], employeeId: empOpt.id, customName: undefined};
                                      setRealForm({...realForm, participants:copy});
                                    }}
                                    className="px-2 py-1.5 hover:bg-[#f2f8f7] cursor-pointer text-xs flex items-center justify-between"
                                  >
                                    <span>{empOpt.name.split(",")[0]} <span className="text-[#283338]/60">— {empOpt.role}</span></span>
                                    <span className="text-[10px] bg-[#e4f0f1] px-1.5 py-0.5 rounded-full">Pilih</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Peran</label>
                            <input value={p.role} onChange={e=>{
                              const copy=[...realForm.participants];
                              copy[idx]={...copy[idx], role:e.target.value};
                              setRealForm({...realForm, participants:copy});
                            }} placeholder="Narasumber" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}} />
                          </div>
                          <button type="button" onClick={()=> setRealForm({...realForm, participants: realForm.participants.filter((_,i)=>i!==idx)})} className="mt-5 w-8 h-8 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2] shrink-0">×</button>
                        </div>
                        {isCustom && displayValue.trim() && (
                          <div className="font-mono text-[10px] text-[#1c5d5f] ml-1">↳ Nama custom (tidak di sistem) — akan disimpan sebagai "{displayValue.trim()}"</div>
                        )}
                      </div>
                    );
                  })}
                  {realForm.participants.length < 10 && (
                    <button type="button" onClick={()=> setRealForm({...realForm, participants:[...realForm.participants, {customName:"", role:""}]})} className="w-full py-1.5 rounded-full border border-dashed border-[#a2cbcd] bg-white text-xs font-medium text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{borderRadius:48}}>+ Tambah pegawai terlibat</button>
                  )}
                  {realForm.participants.length >= 10 && <p className="font-mono text-[11px] text-[#b91c1c]">Maksimal 10 pegawai</p>}
                </div>
                </div>
              </details>
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Tanggal</label><input type="date" value={realForm.date} onChange={e => setRealForm({ ...realForm, date: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
                <p className="font-mono text-[11px] text-[#283338]/50 mt-1">Jam otomatis WIB <span className="font-mono font-semibold text-[#1c5d5f]">{realForm.time || "09:00"} WIB</span> — ubah jika perlu:</p>
                <details className="mt-1 group">
                  <summary className="list-none font-mono text-xs text-[#1c5d5f] underline cursor-pointer select-none">Atur jam manual ▾</summary>
                  <div className="flex gap-2 mt-2">
                    {(() => {
                      const [hStr, mStr] = (realForm.time || "09:00").split(":");
                      const hVal = hStr?.padStart(2,"0") ?? "09";
                      const mVal = mStr?.padStart(2,"0") ?? "00";
                      return (
                        <>
                          <select value={hVal} onChange={e => setRealForm({ ...realForm, time: `${e.target.value}:${mVal}` })} className="flex-1 px-2 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] font-mono" style={{ borderRadius: 12 }}>
                            {Array.from({length:24}, (_,i) => {
                              const h = String(i).padStart(2,"0");
                              return <option key={h} value={h}>{h}</option>;
                            })}
                          </select>
                          <span className="flex items-center font-mono text-sm text-[#283338]">:</span>
                          <select value={mVal} onChange={e => setRealForm({ ...realForm, time: `${hVal}:${e.target.value}` })} className="flex-1 px-2 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] font-mono" style={{ borderRadius: 12 }}>
                            {Array.from({length:60}, (_,i) => {
                              const m = String(i).padStart(2,"0");
                              return <option key={m} value={m}>{m}</option>;
                            })}
                          </select>
                          <span className="flex items-center font-mono text-xs text-[#283338]/60 px-1">WIB</span>
                        </>
                      );
                    })()}
                  </div>
                </details>
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Bukti (upload file) {editingRealization ? "— tambah bukti baru (opsional)" : ""}</label>
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
                      const r = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
                      const j = await r.json();
                      if (!r.ok) alert(j.error || `Gagal upload ${f.name}`);
                      else uploaded.push({ fileName: j.fileName || f.name, filePath: j.filePath, fileSize: j.fileSize || `${(f.size/1024).toFixed(1)} KB` });
                    } catch { alert(`Gagal upload ${f.name}`); }
                  }
                  if (uploaded.length) setRealForm({ ...realForm, files: [...realForm.files, ...uploaded] });
                  // reset input
                  (e.target as HTMLInputElement).value = "";
                }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm file:mr-3 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-[#1c5d5f] file:text-white file:text-xs" style={{ borderRadius: 12 }} />
                {realForm.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {realForm.files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>
                        <span className="truncate">📎 {f.fileName} • {f.fileSize}</span>
                        <button onClick={() => setRealForm({ ...realForm, files: realForm.files.filter((_, i) => i !== idx) })} className="ml-2 text-[#b91c1c] hover:underline shrink-0">hapus</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="font-mono text-xs tracking-wide text-[#283338]/50 mt-1">PDF, JPG, PNG, DOCX, XLSX, CSV — maks 10MB per file, boleh pilih banyak sekaligus</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#e4f0f1] flex gap-2 justify-end shrink-0 bg-white">
              <button onClick={() => { setShowRealizationModal(null); setEditingRealization(null); setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: [], participants: [] }); }} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button>
              <button onClick={() => editingRealization ? handleEditRealization() : handleSubmitRealization()} className="px-5 py-2 rounded-full bg-[#16325a] text-white text-sm font-medium" style={{ borderRadius: 48 }}>{editingRealization ? "Simpan Perubahan" : "Kirim Realisasi"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
