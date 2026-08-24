"use client";
import { useSKP } from "@/lib/store";
import { getPosition, getDept } from "@/lib/data";

export function GlobalModals() {
  const {
    showPlanModal, setShowPlanModal, editingPlan, setEditingPlan, planForm, setPlanForm, periods, handleCreatePlan,
    showCascadeModal, setShowCascadeModal, cascadeTargets, setCascadeTargets, cascadePortions, setCascadePortions, handleCascade, handleUpdateDelegation, handleDeleteDelegation, employees, getSubordinates, currentUser,
    showRealizationModal, setShowRealizationModal, realForm, setRealForm, handleSubmitRealization,
    selectedPlanDetail, setSelectedPlanDetail, plans, realizations, attachments,
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
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Target (jumlah)</label><input value={planForm.target ?? ""} onChange={e => setPlanForm({ ...planForm, target: e.target.value })} placeholder="6" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} /></div>
              <p className="font-mono text-[11px] text-[#283338]/50">Deskripsi, indikator, bobot & tanggal akan diisi otomatis.</p>
            </div>
            <div className="p-6 border-t border-[#e4f0f1] flex gap-2 justify-end"><button onClick={() => setShowPlanModal(false)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button><button onClick={handleCreatePlan} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>{editingPlan ? "Simpan Perubahan" : "Buat Rencana"}</button></div>
          </div>
        </div>
      )}

      {showCascadeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1]"><div className="eyebrow">PELIMPAHAN KINERJA</div><h3 className="heading-serif text-lg mt-1">Kelola pelimpahan</h3><p className="text-sm text-[#283338]/70 mt-1">"{showCascadeModal.title}" • Target induk: <span className="font-bold text-[#1c5d5f]">{showCascadeModal.target}</span></p><p className="font-mono text-xs tracking-wide text-[#283338]/60 mt-1">Kelola porsi per bawahan — total tidak boleh melebihi target induk</p></div>
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
              {(() => {
                if (!currentUser) return null;
                const existing = plans.filter(p => p.parentId === showCascadeModal.id);
                const existingTotal = existing.reduce((s,p)=> s + (parseFloat(String(p.target).replace(",","."))||0),0);
                const parentTarget = parseFloat(String(showCascadeModal.target).replace(",","."))||0;
                const candidatesRaw = getSubordinates(currentUser.id);
                const allCandidates = currentUser.role === "admin" ? employees.filter(e => e.id !== currentUser.id) : candidatesRaw;
                const existingIds = new Set(existing.map(e=>e.assignedTo));
                const candidates = allCandidates.filter(e=> !existingIds.has(e.id));
                const selectedTotal = cascadeTargets.reduce((s,id)=> s + (parseFloat(String(cascadePortions[id] ?? showCascadeModal.target).replace(",","."))||0),0);
                const totalAll = existingTotal + selectedTotal;
                const over = parentTarget>0 && totalAll > parentTarget;
                return (
                  <>
                    {/* Sudah dilimpahkan — CRUD porsi */}
                    <div>
                      <div className="eyebrow text-[11px] flex items-center justify-between"><span>DILIMPAHKAN ({existing.length})</span><span className={`font-mono text-xs ${over ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{existingTotal}{parentTarget>0?` / ${parentTarget}`:""} {over && "• melebihi!"}</span></div>
                      {existing.length===0 ? <div className="mt-2 p-3 rounded-xl bg-[#f2f8f7] border border-dashed border-[#a2cbcd] text-xs text-[#283338]/60 text-center" style={{borderRadius:12}}>Belum ada pelimpahan</div> :
                      <div className="mt-2 space-y-2">
                        {existing.map(child=>{
                          const emp = employees.find(e=>e.id===child.assignedTo);
                          return (
                            <div key={child.id} className="flex items-center gap-3 p-3 rounded-xl border bg-[#e4f0f1] border-[#a2cbcd]" style={{borderRadius:12}}>
                              <div className="w-8 h-8 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-xs font-bold shrink-0">{emp?.avatar ?? "?"}</div>
                              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{emp?.name ?? child.assignedTo}</div><div className="font-mono text-xs text-[#283338]/60">{child.title.slice(0,32)} • {child.progress}%</div></div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input type="number" min={1} defaultValue={child.target} placeholder={child.target} className="w-16 px-2 py-1 rounded-lg border border-[#e4f0f1] bg-white text-sm text-center focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}}
                                  onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==child.target) handleUpdateDelegation(child.id, v); }}
                                  onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                                />
                                <button onClick={()=> handleDeleteDelegation(child.id, child.title)} className="w-7 h-7 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]" title="Hapus pelimpahan">×</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>}
                      {parentTarget>0 && <div className="mt-2 font-mono text-xs text-[#283338]/60">Sisa kapasitas: <span className={parentTarget - existingTotal <0 ? "text-[#b91c1c] font-bold":"text-[#1c5d5f] font-bold"}>{parentTarget - existingTotal}</span></div>}
                    </div>

                    {/* Tambah baru — pilih bawahan + porsi */}
                    <div>
                      <div className="eyebrow text-[11px]">TAMBAH PELIMPAHAN {cascadeTargets.length>0 && <span className="font-mono text-xs text-[#1c5d5f]">• {selectedTotal} porsi baru {parentTarget>0 && `/ sisa ${parentTarget - existingTotal}`}</span>}</div>
                      {candidates.length===0 ? <div className="mt-2 text-xs text-[#283338]/60">Semua bawahan sudah dilimpahkan</div> :
                      <div className="mt-2 space-y-2">
                        {candidates.map(emp=>{
                          const checked = cascadeTargets.includes(emp.id);
                          return (
                            <div key={emp.id} className={`p-3 rounded-xl border ${checked? "bg-[#f2f8f7] border-[#a2cbcd]":"bg-white border-[#e4f0f1] hover:bg-[#f2f8f7]"}`} style={{borderRadius:12}}>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={e=>{
                                  if(e.target.checked){ setCascadeTargets([...cascadeTargets, emp.id]); if(!cascadePortions[emp.id]) setCascadePortions({...cascadePortions, [emp.id]: showCascadeModal.target}); }
                                  else { setCascadeTargets(cascadeTargets.filter(x=>x!==emp.id)); const { [emp.id]:_, ...rest}=cascadePortions; setCascadePortions(rest); }
                                }} className="accent-[#1c5d5f]" />
                                <div className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold shrink-0">{emp.avatar}</div>
                                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{emp.name}</div><div className="font-mono text-xs text-[#283338]/60 truncate">{getPosition(emp.positionId)} • {getDept(emp.departmentId)}</div></div>
                                <span className="font-mono text-xs px-2 py-1 rounded-full bg-[#1c5d5f] text-white" style={{borderRadius:100}}>{emp.role.toUpperCase()}</span>
                              </label>
                              {checked && (
                                <div className="mt-2 flex items-center gap-2 pl-8">
                                  <span className="font-mono text-xs text-[#283338]/60">Porsi:</span>
                                  <input type="number" min={1} value={cascadePortions[emp.id] ?? showCascadeModal.target} onChange={e=> setCascadePortions({...cascadePortions, [emp.id]: e.target.value})} className="w-20 px-2 py-1 rounded-lg border border-[#e4f0f1] bg-white text-sm text-center focus:outline-none focus:border-[#a2cbcd]" style={{borderRadius:8}} />
                                  <span className="font-mono text-xs text-[#283338]/50">/ {parentTarget || "—"} total</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>}
                      {over && <div className="mt-2 p-2 rounded-xl bg-[#f2e8e2] border border-[#d6aec1] text-xs text-[#b91c1c]" style={{borderRadius:12}}>Total porsi ({totalAll}) melebihi target induk ({parentTarget}). Kurangi porsi sebelum menyimpan.</div>}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-6 border-t border-[#e4f0f1] flex gap-2 justify-between items-center">
              <span className="font-mono text-xs text-[#283338]/60">{plans.filter(p=>p.parentId===showCascadeModal.id).length} dilimpahkan • pilih {cascadeTargets.length} baru</span>
              <div className="flex gap-2"><button onClick={() => { setShowCascadeModal(null); setCascadeTargets([]); setCascadePortions({}); }} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Tutup</button><button onClick={handleCascade} disabled={cascadeTargets.length===0} className={`px-5 py-2 rounded-full text-sm font-medium ${cascadeTargets.length===0 ? "bg-[#e4f0f1] text-[#283338]/40 cursor-not-allowed" : "bg-[#1c5d5f] text-white hover:bg-[#156152]"}`} style={{ borderRadius: 48 }}>Limpahkan ({cascadeTargets.length})</button></div>
            </div>
          </div>
        </div>
      )}

      {showRealizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setShowRealizationModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1]"><div className="eyebrow">REALISASI KINERJA</div><h3 className="heading-serif text-lg mt-1">Isi Realisasi</h3><p className="font-mono text-xs tracking-wide text-[#283338]/60">{showRealizationModal.title} • Target: {showRealizationModal.target}</p></div>
            <div className="p-6 space-y-3">
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Judul Realisasi</label><input value={realForm.title} onChange={e => setRealForm({ ...realForm, title: e.target.value })} placeholder="Contoh: Webinar Registrasi 1" className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} /></div>
              <div><label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Deskripsi</label><textarea value={realForm.description} onChange={e => setRealForm({ ...realForm, description: e.target.value })} rows={3} placeholder="Jelaskan capaian..." className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} /></div>
              <div>
                <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold">Bukti (upload file)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 10*1024*1024) { alert("File maksimal 10MB"); return; }
                  setRealForm({ ...realForm, fileName: f.name });
                  // upload immediately
                  const fd = new FormData();
                  fd.append("file", f);
                  if (showRealizationModal) fd.append("planId", showRealizationModal.id);
                  try {
                    const r = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
                    const j = await r.json();
                    if (!r.ok) alert(j.error || "Gagal upload");
                    else setRealForm({ ...realForm, fileName: j.fileName });
                  } catch { alert("Gagal upload"); }
                }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm file:mr-3 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-[#1c5d5f] file:text-white file:text-xs" style={{ borderRadius: 12 }} />
                {realForm.fileName && <div className="mt-1 font-mono text-xs text-[#1c5d5f]">📎 {realForm.fileName} terpilih — akan diunggah saat Kirim</div>}
                <p className="font-mono text-xs tracking-wide text-[#283338]/50 mt-1">PDF, JPG, PNG, DOCX, XLSX — maks 10MB, disimpan di /public/uploads</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#e4f0f1] flex gap-2 justify-end"><button onClick={() => setShowRealizationModal(null)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button><button onClick={handleSubmitRealization} className="px-5 py-2 rounded-full bg-[#16325a] text-white text-sm font-medium" style={{ borderRadius: 48 }}>Kirim Realisasi</button></div>
          </div>
        </div>
      )}

      {selectedPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setSelectedPlanDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-[560px] max-h-[85vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1] sticky top-0 bg-white" style={{ borderRadius: "12px 12px 0 0" }}>
              <div className="flex items-start justify-between gap-3"><h3 className="heading-serif text-[20px] leading-tight">{selectedPlanDetail.title}</h3><button onClick={() => setSelectedPlanDetail(null)} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center shrink-0">×</button></div>
              <div className="mt-2 flex gap-2 flex-wrap"><span className="font-mono text-xs tracking-wide px-2 py-1 rounded-full bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}>{periods.find(p => p.id === selectedPlanDetail.skpPeriodId)?.name}</span></div>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div><div className="eyebrow text-[11px]">DETAIL</div><div className="text-[#283338]/80 mt-1">{selectedPlanDetail.title}</div></div>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}><div className="font-mono text-xs tracking-[0.06em] uppercase text-[#283338]/60">Target</div><div className="font-bold mt-1">{selectedPlanDetail.target}</div></div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}><div className="font-mono text-xs tracking-wide uppercase text-[#283338]/60">Progress</div><div className="flex items-center gap-3 mt-1"><div className="flex-1 h-2 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(selectedPlanDetail.progress, 100)}%` }} /></div><span className="font-mono font-bold text-[#1c5d5f]">{selectedPlanDetail.progress}%</span></div>
              {(() => {
                const direct = realizations.filter(r => r.planId === selectedPlanDetail.id).length;
                const descendantIds2 = new Set<string>();
                const queue2: string[] = plans.filter(p => p.parentId === selectedPlanDetail.id).map(p => p.id);
                while (queue2.length) { const cur = queue2.shift()!; if (descendantIds2.has(cur)) continue; descendantIds2.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue2.push(ch.id)); }
                const viaChildren = realizations.filter(r => descendantIds2.has(r.planId)).length;
                const total = direct + viaChildren;
                const disp = Number.isInteger(total) ? total : Number(total.toFixed(1));
                return <div className="font-mono text-[11px] text-[#1c5d5f] mt-1">{disp} / {selectedPlanDetail.target} terealisasi</div>;
              })()}
              </div>
              <div><div className="eyebrow text-[11px]">PELAKSANA</div><div className="flex items-center gap-2 mt-1"><span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{employees.find(e => e.id === selectedPlanDetail.assignedTo)?.avatar}</span>{employees.find(e => e.id === selectedPlanDetail.assignedTo)?.name}</div></div>
              {selectedPlanDetail.parentId && <div className="p-3 rounded-xl bg-[#f2e8e2] border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}><span className="font-bold">Induk:</span> {plans.find(p => p.id === selectedPlanDetail.parentId)?.title}</div>}
              <div><div className="eyebrow text-[11px]">TURUNAN ({plans.filter(p => p.parentId === selectedPlanDetail.id).length})</div>{plans.filter(p => p.parentId === selectedPlanDetail.id).map(c => <div key={c.id} className="mt-1 p-2 rounded-xl bg-white border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>{c.title} — {employees.find(e=>e.id===c.assignedTo)?.name.split(",")[0]} • {c.progress}%</div>)}{plans.filter(p=>p.parentId===selectedPlanDetail.id).length===0 && <div className="font-mono text-xs text-[#283338]/60">Belum ada turunan</div>}</div>
              <div><div className="eyebrow text-[11px]">REALISASI</div>{realizations.filter(r=>r.planId===selectedPlanDetail.id).map(r=> <div key={r.id} className="mt-1 p-2 rounded-xl border border-[#e4f0f1] bg-white font-mono text-xs" style={{ borderRadius: 12 }}><div className="font-medium text-[#231e21] truncate">{(r as any).title || "Realisasi"}</div><div className="flex justify-between"><span>{r.value}</span><span>{r.date}</span></div></div>)}{realizations.filter(r=>r.planId===selectedPlanDetail.id).length===0 && <div className="font-mono text-xs text-[#283338]/60">Belum ada realisasi</div>}</div>
              <div><div className="eyebrow text-[11px]">BUKTI</div>{attachments.filter(a=>a.planId===selectedPlanDetail.id).map(a=> <div key={a.id} className="mt-1 p-2 rounded-xl bg-white border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>📎 {a.fileName} • {a.fileSize} • {a.date}</div>)}{attachments.filter(a=>a.planId===selectedPlanDetail.id).length===0 && <div className="font-mono text-xs text-[#283338]/60">Belum ada bukti</div>}</div>
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex justify-end sticky bottom-0 bg-white" style={{ borderRadius: "0 0 12px 12px" }}>
              <button onClick={() => setSelectedPlanDetail(null)} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
