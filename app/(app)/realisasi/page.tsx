"use client";
import { useState } from "react";
import { useSKP } from "@/lib/store";

export default function RealisasiPage() {
  const { realizations, plans, employees, attachments, currentUser, isSubordinate, setShowRealizationModal } = useSKP();
  const [tab, setTab] = useState<"saya" | "bawahan">("saya");
  const [selectedRealId, setSelectedRealId] = useState<string | null>(null);
  if (!currentUser) return null;

  const selectedReal = selectedRealId ? realizations.find(r => r.id === selectedRealId) ?? null : null;
  const selectedRealPlan = selectedReal ? plans.find(p => p.id === selectedReal.planId) ?? null : null;
  const selectedRealEmp = selectedRealPlan ? employees.find(e => e.id === selectedRealPlan.assignedTo) ?? null : null;

  const isAtasan = ["direktur", "supervisor", "admin"].includes(currentUser.role);
  
  // Tugas saya: rencana yang assigned ke saya
  const myPlans = plans.filter(p => p.assignedTo === currentUser.id);

  // Realisasi bawahan: realisasi dari bawahan langsung/tidak langsung
  const bawahanRealisasi = realizations.filter(r => {
    const plan = plans.find(p => p.id === r.planId);
    if (!plan) return false;
    return isSubordinate(currentUser.id, plan.assignedTo) || (currentUser.role === "admin" && plan.assignedTo !== currentUser.id);
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">REALISASI</p>
        <h2 className="heading-serif text-[28px]">Kelola realisasi</h2>
        <p className="text-sm text-[#283338]/60 mt-1">Tugas Anda dan realisasi delegasi penerima — tambah dan pantau progres.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e4f0f1] pb-0">
        <button
          onClick={() => setTab("saya")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === "saya" ? "border-[#1c5d5f] text-[#1c5d5f]" : "border-transparent text-[#283338]/60 hover:text-[#283338]"}`}
        >
          Tugas Saya <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#e4f0f1] text-xs font-mono">{myPlans.length}</span>
        </button>
        {isAtasan && (
          <button
            onClick={() => setTab("bawahan")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition relative ${tab === "bawahan" ? "border-[#1c5d5f] text-[#1c5d5f]" : "border-transparent text-[#283338]/60 hover:text-[#283338]"}`}
          >
            Realisasi Delegasi Penerima <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#f2e8e2] text-xs font-mono">{bawahanRealisasi.length}</span>
          </button>
        )}
      </div>

      {/* Tab: Tugas Saya */}
      {tab === "saya" && (
        <div className="space-y-4">
          {myPlans.length === 0 ? (
            <div className="p-8 text-center border border-dashed bg-white rounded-xl" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>
              <p className="heading-serif text-lg">Belum ada tugas</p>
              <p className="text-sm text-[#283338]/60 mt-1">Tugas akan muncul di sini setelah atasan melimpahkan rencana kepada Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPlans.map(plan => {
                const myReals = realizations.filter(r => r.planId === plan.id).sort((a,b) => b.date.localeCompare(a.date));
                // Kumpulkan semua turunan (descendants) dari rencana ini untuk relasi bawahan
                const descendantIds = (() => {
                  const ids = new Set<string>();
                  const queue: string[] = [plan.id];
                  const visited = new Set<string>();
                  while (queue.length) {
                    const cur = queue.shift()!;
                    if (visited.has(cur)) continue;
                    visited.add(cur);
                    const children = plans.filter(p => p.parentId === cur);
                    children.forEach(c => { ids.add(c.id); queue.push(c.id); });
                  }
                  return ids;
                })();
                const relatedReals = realizations.filter(r => descendantIds.has(r.planId)).sort((a,b) => b.date.localeCompare(a.date));
                return (
                  <div key={plan.id} className="px-4 py-3 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                    <h3 className="font-medium text-[#231e21] leading-tight">{plan.title}</h3>
                      {(() => {
                        const allReals = [
                          ...myReals.map(r => ({ r, empId: plan.assignedTo })),
                          ...relatedReals.map(r => {
                            const childPlan = plans.find(p => p.id === r.planId);
                            return { r, empId: childPlan?.assignedTo ?? "" };
                          }),
                        ].sort((a,b) => b.r.date.localeCompare(a.r.date));
                        if (allReals.length === 0) {
                          return <div className="mt-2 font-mono text-xs text-[#283338]/50">Belum ada realisasi.</div>;
                        }
                        // Kelompokkan per orang
                        const byEmp = new Map<string, typeof allReals>();
                        for (const item of allReals) {
                          const arr = byEmp.get(item.empId) ?? [];
                          arr.push(item);
                          byEmp.set(item.empId, arr);
                        }
                        return (
                          <div className="mt-3 space-y-2">
                            {[...byEmp.entries()].map(([empId, items]) => {
                              const emp = employees.find(e => e.id === empId);
                              return (
                                <table key={empId} className="w-full border border-[#e4f0f1]" style={{ borderRadius: 8 }}>
                                  <thead className="bg-[#e4f0f1]">
                                    <tr>
                                      <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-[#231e21]">{emp?.name?.split(",")[0] ?? "-"}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map(({ r }) => (
                                      <tr key={r.id} className="border-t border-[#e4f0f1] bg-white">
                                        <td className="px-2.5 py-1.5">
                                          <button onClick={() => setSelectedRealId(r.id)} className="text-sm text-[#283338] text-left hover:text-[#1c5d5f] hover:underline underline-offset-2" title="Lihat detail realisasi">
                                            {(r as any).title || "Realisasi"}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            })}
                          </div>
                        );
                      })()}
                    <button
                      onClick={() => setShowRealizationModal(plan)}
                      className="mt-3 w-full py-2 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90"
                      style={{ borderRadius: 48 }}
                    >
                      + Realisasi
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Realisasi Bawahan */}
      {tab === "bawahan" && isAtasan && (
        <div className="space-y-4">
          <div className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1] font-mono text-xs tracking-[0.04em] uppercase text-[#283338]/60">
                  <tr><th className="text-left px-4 py-3">Rencana (Delegasi Penerima)</th><th className="text-left px-4 py-3">Pelaksana</th><th className="text-left px-4 py-3">Realisasi</th></tr>
                </thead>
                <tbody>
                  {bawahanRealisasi.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-[#283338]/60">Belum ada realisasi dari delegasi penerima.<br/><span className="text-xs">Realisasi akan muncul di sini setelah delegasi penerima menambah di tab Tugas Saya mereka.</span></td></tr>
                  ) : bawahanRealisasi.map(r => {
                    const plan = plans.find(p => p.id === r.planId);
                    const emp = plan ? employees.find(e => e.id === plan.assignedTo) : null;
                    return (
                      <tr key={r.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]">
                        <td className="px-4 py-3"><div className="font-medium truncate max-w-[260px]">{plan?.title}</div><div className="text-xs text-[#283338]/60 truncate">{r.description}</div><div className="font-mono text-xs text-[#283338]/50">{r.date}</div></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{emp?.avatar ?? "?"}</span><span className="text-xs">{emp?.name.split(",")[0]}</span></div><div className="font-mono text-[11px] text-[#283338]/50">{emp?.role}</div></td>
                         <td className="px-4 py-3"><button onClick={() => setSelectedRealId(r.id)} className="font-medium text-xs text-[#231e21] truncate text-left hover:text-[#1c5d5f] hover:underline underline-offset-2" title="Lihat detail realisasi">{(r as any).title || "Realisasi"}</button><div className="text-xs text-[#283338]/60 truncate">{r.description || "—"}</div>{attachments.filter(a => a.realizationId === r.id).map(a => <div key={a.id} className="text-xs text-[#1c5d5f] mt-1">📎 {a.fileName}</div>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Realisasi */}
      {selectedReal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setSelectedRealId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1] flex items-start justify-between gap-3">
              <h3 className="heading-serif text-lg leading-tight">{(selectedReal as any).title || "Realisasi"}</h3>
              <button onClick={() => setSelectedRealId(null)} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center shrink-0">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div><div className="eyebrow text-[11px]">PENGIRIM</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{selectedRealEmp?.avatar ?? "?"}</span>
                  <div><div className="font-medium">{selectedRealEmp?.name ?? "-"}</div><div className="font-mono text-xs text-[#283338]/60">{selectedRealEmp?.role}</div></div>
                </div>
              </div>
              <div><div className="eyebrow text-[11px]">TUGAS</div><div className="mt-1 text-[#283338]/80">{selectedRealPlan?.title ?? "-"}</div></div>
              <div><div className="eyebrow text-[11px]">TANGGAL</div><div className="font-mono text-xs mt-1 text-[#283338]/70">{selectedReal.date}</div></div>
              <div><div className="eyebrow text-[11px]">DESKRIPSI</div><div className="mt-1 leading-relaxed text-[#283338]/80 whitespace-pre-wrap">{selectedReal.description || "—"}</div></div>
              <div><div className="eyebrow text-[11px]">BUKTI</div>
                {attachments.filter(a => a.realizationId === selectedReal.id).length === 0 ? (
                  <div className="font-mono text-xs text-[#283338]/60 mt-1">Tidak ada bukti terlampir</div>
                ) : attachments.filter(a => a.realizationId === selectedReal.id).map(a => (
                  <div key={a.id} className="mt-1 p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>📎 {a.fileName} • {a.fileSize} • {a.date}</div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex justify-end">
              <button onClick={() => setSelectedRealId(null)} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
