"use client";
import { useState, useRef, useEffect } from "react";
import { useSKP } from "@/lib/store";
import type { PerformancePlan } from "@/lib/types";

type Scope = "mine" | "team";

export default function RencanaPage() {
  const {
    myPlans, filteredPlans, search, setSearch, currentUser, setEditingPlan, setPlanForm, setShowPlanModal,
    employees, periods, realizations, plans, setSelectedPlanDetail, setShowCascadeModal, setShowRealizationModal,
    handleDeletePlan,
  } = useSKP();
  const [scope, setScope] = useState<Scope>("mine");
  const [openMenu, setOpenMenu] = useState<{ id: string; plan: PerformancePlan; x: number; y: number } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  if (!currentUser) return null;

  const isStaff = currentUser.role === "staff";
  // Staff selalu "mine"; atasan bisa pilih
  const activeScope: Scope = isStaff ? "mine" : scope;

  const basePlans = activeScope === "mine" ? myPlans : filteredPlans;
  const shown = basePlans.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const confirmPlan = confirmId ? plans.find(x => x.id === confirmId) ?? null : null;
  const closeMenu = () => setOpenMenu(null);

  useEffect(() => {
    if (!openMenu) return;
    const h = () => closeMenu();
    window.addEventListener("scroll", h, true);
    window.addEventListener("resize", h);
    return () => { window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h); };
  }, [openMenu]);

  useEffect(() => {
    if (!openMenu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenu]);

  const openActions = (e: React.MouseEvent<HTMLButtonElement>, p: PerformancePlan) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_W = 176, MENU_H = 190;
    const openUp = rect.bottom + MENU_H > window.innerHeight - 8;
    setOpenMenu({ id: p.id, plan: p, x: Math.min(rect.right - MENU_W + 8, window.innerWidth - MENU_W - 8), y: openUp ? rect.top - MENU_H - 4 : rect.bottom + 4 });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">RENCANA KINERJA</p>
          <h2 className="heading-serif text-[24px]">{activeScope === "mine" ? "Tugas saya" : "Rencana tim saya"}</h2>
          <p className="text-xs text-[#283338]/60 mt-0.5">
            {activeScope === "mine"
              ? "Hanya rencana yang ditugaskan kepada Anda."
              : `Semua rencana milik Anda dan bawahan (${employees.filter(e => e.supervisorId === currentUser.id).length} langsung).`}
          </p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="px-3 py-1.5 rounded-full border bg-white text-sm border-[#e4f0f1] w-40 focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 100 }} />
          {(currentUser.role === "direktur" || currentUser.role === "admin" || currentUser.role === "supervisor") && (
            <button onClick={() => { setEditingPlan(null); setPlanForm({ title: "", target: "", skpPeriodId: periods[0]?.id ?? "sp2026" }); setShowPlanModal(true); }} className="px-4 py-1.5 rounded-full bg-[#1c5d5f] text-white text-xs font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>+ Buat</button>
          )}
        </div>
      </div>

      {/* Toggle cakupan — hanya untuk atasan */}
      {!isStaff && (
        <div className="flex gap-2">
          <button onClick={() => setScope("mine")} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${activeScope === "mine" ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : "bg-[#e4f0f1] border-[#e4f0f1] text-[#283338]"}`} style={{ borderRadius: 100 }}>
            Tugas Saya ({myPlans.length})
          </button>
          <button onClick={() => setScope("team")} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${activeScope === "team" ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : "bg-[#e4f0f1] border-[#e4f0f1] text-[#283338]"}`} style={{ borderRadius: 100 }}>
            Seluruh Tim ({filteredPlans.length})
          </button>
          {search && <button onClick={() => setSearch("")} className="px-3 py-1.5 rounded-full text-xs bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}>Reset cari ×</button>}
        </div>
      )}

      {/* Konfirmasi hapus */}
      {confirmPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setConfirmId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e4f0f1] overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2e8e2] border border-[#d6aec1] flex items-center justify-center text-[#b91c1c] font-bold shrink-0">!</div>
                <div>
                  <h3 className="heading-serif text-lg leading-tight">Hapus rencana ini?</h3>
                  <p className="font-mono text-xs tracking-wide text-[#283338]/60 mt-0.5">Aksi tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-sm text-[#283338]/80 mt-3 leading-6">"{confirmPlan.title}"</p>
              {(() => {
                const ids = new Set<string>([confirmPlan.id]);
                let changed = true;
                while (changed) { changed = false; for (const x of plans) { if (x.parentId && ids.has(x.parentId) && !ids.has(x.id)) { ids.add(x.id); changed = true; } } }
                const total = ids.size - 1;
                return total > 0 ? (
                  <div className="mt-2 p-3 rounded-xl bg-[#f2e8e2] border border-[#e4f0f1] text-xs leading-5" style={{ borderRadius: 12 }}>
                    <span className="font-semibold">{total} rencana turunan</span> akan ikut terhapus, termasuk realisasi, bukti, dan penilaiannya.
                    <div className="mt-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                      {plans.filter(x => ids.has(x.id) && x.id !== confirmPlan.id).map(x => <div key={x.id} className="truncate">↳ {x.title}</div>)}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex gap-2 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button>
              <button onClick={async () => { const plan = confirmPlan; setConfirmId(null); if (plan) await handleDeletePlan(plan.id, plan.title); }} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-sm font-medium hover:bg-[#991b1b]" style={{ borderRadius: 48 }}>Ya, Hapus Semua</button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown aksi fixed */}
      {openMenu && (
        <div ref={menuRef} className="fixed z-50 w-44 bg-white border border-[#e4f0f1] shadow-sm overflow-hidden" style={{ borderRadius: 12, left: openMenu.x, top: openMenu.y }}>
          {(() => {
            const p = openMenu.plan;
            const canCascade = ["direktur","supervisor","admin"].includes(currentUser.role);
            const canRealize = p.assignedTo === currentUser.id;
            const canEdit = p.createdBy === currentUser.id || currentUser.role === "admin";
            const canDelete = canEdit;
            const childCount = plans.filter(x => x.parentId === p.id).length;
            return (
              <>
                {canCascade && <button onClick={() => { closeMenu(); setShowCascadeModal(p); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1c5d5f]" /> Limpahkan</button>}
                {canRealize && <button onClick={() => { closeMenu(); setShowRealizationModal(p); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#16325a]" /> Isi Realisasi</button>}
                {canEdit && <button onClick={() => { closeMenu(); setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setShowPlanModal(true); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#a2cbcd]" /> Edit</button>}
                {canDelete && <button onClick={() => { closeMenu(); setConfirmId(p.id); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-[#b91c1c] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Hapus{childCount > 0 ? ` (+${childCount})` : ""}</button>}
                {!canCascade && !canRealize && !canEdit && <div className="px-3 py-2 text-xs text-[#283338]/50">Hanya Detail</div>}
              </>
            );
          })()}
        </div>
      )}

      {/* Tabel */}
      <div className="border bg-white overflow-hidden relative" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1]">
              <tr className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">
                <th className="text-left px-3 py-2 font-semibold">Rencana</th>
                {activeScope === "team" && <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Pelaksana</th>}
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Target</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Delegasi</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Progress</th>
                <th className="text-right px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(p => {
                const assignee = employees.find(e => e.id === p.assignedTo);
                const period = periods.find(s => s.id === p.skpPeriodId);
                return (
                  <tr key={p.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]/50">
                    <td className="px-3 py-2.5 max-w-[360px]">
                      <div className="font-medium text-[#231e21] leading-tight truncate">{p.title}</div>
                      <div className="font-mono text-[11px] text-[#283338]/60 truncate">{period?.name}</div>
                    </td>
                    {activeScope === "team" && <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[#283338]">{assignee?.name.split(",")[0]}</td>}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#1c5d5f]">{p.target}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-14 h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]"><span className="block h-full bg-[#1c5d5f]" style={{ width: `${Math.min(p.progress, 100)}%` }} /></span>
                        <span className="font-mono text-xs font-semibold text-[#1c5d5f]">{p.progress}%</span>
                      </div>
                      {(() => {
                        const direct = realizations.filter(r => r.planId === p.id).length;
                        const descendantIds = new Set<string>();
                        const queue: string[] = plans.filter(x => x.parentId === p.id).map(x => x.id);
                        while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
                        const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
                        const total = direct + viaChildren;
                        const disp = Number.isInteger(total) ? total : Number(total.toFixed(1));
                        return <div className="font-mono text-[11px] text-[#1c5d5f] mt-1">{disp} / {p.target} terealisasi</div>;
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end items-center gap-1.5">
                        <button onClick={() => setSelectedPlanDetail(p)} className="px-3 py-1 rounded-full bg-white border border-[#e4f0f1] text-xs hover:border-[#a2cbcd] hover:bg-[#f2f8f7]" style={{ borderRadius: 48 }}>Detail</button>
                        <button onClick={e => openActions(e, p)} className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${openMenu?.id === p.id ? "bg-[#e4f0f1] border-[#a2cbcd] text-[#1c5d5f]" : "bg-white border-[#e4f0f1] text-[#283338]/60 hover:border-[#a2cbcd] hover:text-[#1c5d5f]"}`} style={{ borderRadius: 9999 }} aria-label="Aksi">⋯</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={activeScope === "team" ? 5 : 4} className="px-3 py-10 text-center">
                    {activeScope === "mine" ? (
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="heading-serif text-lg">Belum ada tugas untuk Anda</div>
                        <p className="text-sm text-[#283338]/60 leading-6">Tugas muncul otomatis di sini setelah atasan melimpahkan rencana kepada Anda melalui menu ⋯ → Limpahkan.</p>
                      </div>
                    ) : (
                      <span className="text-sm text-[#283338]/60">Tidak ada rencana kinerja</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
