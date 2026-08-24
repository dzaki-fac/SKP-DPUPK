"use client";
import { useState } from "react";
import { useSKP } from "@/lib/store";

export default function RealisasiPage() {
  const { realizations, plans, employees, attachments, currentUser, isSubordinate, setShowRealizationModal } = useSKP();
  const [tab, setTab] = useState<"saya" | "bawahan">("saya");
  if (!currentUser) return null;

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
        <p className="text-sm text-[#283338]/60 mt-1">Tugas Anda dan realisasi bawahan — tambah dan pantau progres.</p>
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
            Realisasi Bawahan <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#f2e8e2] text-xs font-mono">{bawahanRealisasi.length}</span>
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
            <div className="grid md:grid-cols-2 gap-4">
              {myPlans.map(plan => {
                const myReals = realizations.filter(r => r.planId === plan.id).sort((a,b) => b.date.localeCompare(a.date));
                const periode = plan.target;
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
                const hasChildren = descendantIds.size > 0;
                return (
                  <div key={plan.id} className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                    <h3 className="font-medium text-[#231e21] leading-tight">{plan.title}</h3>
                    <div className="font-mono text-xs text-[#283338]/60 mt-1">Target: <span className="font-bold text-[#1c5d5f]">{periode}</span> • Progress {plan.progress}%</div>
                    <div className="w-full h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1] mt-2"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(plan.progress, 100)}%` }} /></div>
                    {(() => {
                      const direct = realizations.filter(r => r.planId === plan.id).length;
                      const descendantIds = new Set<string>();
                      const queue: string[] = plans.filter(p => p.parentId === plan.id).map(p => p.id);
                      while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
                      const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
                      const total = direct + viaChildren;
                      const disp = Number.isInteger(total) ? total : Number(total.toFixed(1));
                      return <div className="font-mono text-[11px] text-[#1c5d5f] mt-1">{disp} / {plan.target} terealisasi</div>;
                    })()}

                    {/* Realisasi langsung untuk tugas ini */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Realisasi tugas ini</span>
                        <span className="font-mono text-xs text-[#283338]/60">{myReals.length} entri</span>
                      </div>
                      {myReals.length === 0 ? (
                        <div className="p-3 rounded-xl bg-[#f2f8f7] border border-dashed border-[#a2cbcd] text-xs text-[#283338]/60 text-center" style={{ borderRadius: 12 }}>
                          Belum ada realisasi — klik di bawah untuk menambah.
                        </div>
                      ) : (
                        myReals.slice(0, 3).map(r => (
                          <div key={r.id} className="p-2.5 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                            <div className="font-medium text-sm text-[#231e21] leading-tight truncate">{(r as any).title || plan.title}</div>
                            <div className="text-xs text-[#283338]/60 truncate">{r.description || "—"}</div>
                            <div className="font-mono text-[11px] text-[#283338]/50">{r.date}</div>
                          </div>
                        ))
                      )}
                      {attachments.filter(a => a.planId === plan.id).slice(0,2).map(a => (
                        <div key={a.id} className="text-xs text-[#1c5d5f]">📎 {a.fileName} • {a.fileSize}</div>
                      ))}
                    </div>

                    {/* Relasi: realisasi bawahan untuk tugas atasan ini */}
                    {hasChildren && (
                      <div className="mt-4 pt-3 border-t border-[#e4f0f1] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#1c5d5f] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1c5d5f] inline-block" /> Realisasi bawahan terkait</span>
                          <span className="font-mono text-xs text-[#283338]/60">{relatedReals.length} entri</span>
                        </div>
                        {relatedReals.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-[#f2f8f7] border border-dashed border-[#e4f0f1] text-xs text-[#283338]/60 text-center" style={{ borderRadius: 12 }}>
                            Belum ada realisasi dari bawahan untuk tugas ini.
                          </div>
                        ) : (
                          relatedReals.slice(0, 4).map(r => {
                            const childPlan = plans.find(p => p.id === r.planId);
                            const emp = childPlan ? employees.find(e => e.id === childPlan.assignedTo) : null;
                            return (
                              <div key={r.id} className="p-2.5 rounded-xl bg-[#e4f0f1] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                                <div className="font-mono text-xs font-semibold text-[#283338] truncate">{emp?.name?.split(",")[0] ?? "-"}</div>
                                <div className="font-medium text-sm text-[#231e21] leading-tight truncate">{(r as any).title || childPlan?.title}</div>
                                <div className="text-xs text-[#283338]/60 truncate">{r.description || "—"}</div>
                              </div>
                            );
                          })
                        )}
                        {relatedReals.length > 4 && <div className="text-center"><span className="font-mono text-xs text-[#283338]/50">+{relatedReals.length - 4} lagi di tab Realisasi Bawahan</span></div>}
                      </div>
                    )}

                    <button
                      onClick={() => setShowRealizationModal(plan)}
                      className="mt-3 w-full py-2 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90"
                      style={{ borderRadius: 48 }}
                    >
                      + Tambah Realisasi
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
                  <tr><th className="text-left px-4 py-3">Rencana (bawahan)</th><th className="text-left px-4 py-3">Pelaksana</th><th className="text-left px-4 py-3">Realisasi</th></tr>
                </thead>
                <tbody>
                  {bawahanRealisasi.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-[#283338]/60">Belum ada realisasi dari bawahan.<br/><span className="text-xs">Realisasi akan muncul di sini setelah bawahan menambah di tab Tugas Saya mereka.</span></td></tr>
                  ) : bawahanRealisasi.map(r => {
                    const plan = plans.find(p => p.id === r.planId);
                    const emp = plan ? employees.find(e => e.id === plan.assignedTo) : null;
                    return (
                      <tr key={r.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]">
                        <td className="px-4 py-3"><div className="font-medium truncate max-w-[260px]">{plan?.title}</div><div className="text-xs text-[#283338]/60 truncate">{r.description}</div><div className="font-mono text-xs text-[#283338]/50">{r.date}</div></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{emp?.avatar ?? "?"}</span><span className="text-xs">{emp?.name.split(",")[0]}</span></div><div className="font-mono text-[11px] text-[#283338]/50">{emp?.role}</div></td>
                        <td className="px-4 py-3"><div className="font-medium text-xs text-[#231e21] truncate">{(r as any).title || "Realisasi"}</div><div className="text-xs text-[#283338]/60 truncate">{r.description || "—"}</div>{attachments.filter(a => a.realizationId === r.id).map(a => <div key={a.id} className="text-xs text-[#1c5d5f] mt-1">📎 {a.fileName}</div>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
