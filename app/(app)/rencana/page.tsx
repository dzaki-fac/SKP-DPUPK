"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useSKP } from "@/lib/store";
import type { PerformancePlan } from "@/lib/types";

type Scope = "mine" | "team" | "delegasi";

export default function RencanaPage() {
  const {
    myPlans, filteredPlans, search, setSearch, currentUser, setEditingPlan, setPlanForm, setShowPlanModal,
    employees, periods, realizations, plans, setShowCascadeModal, setShowRealizationModal,
    handleDeletePlan, handleUpdateDelegation, handleDeleteDelegation, setPlanCustomTargets,
  } = useSKP();
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("mine");
  const [openMenu, setOpenMenu] = useState<{ id: string; plan: PerformancePlan; x: number; y: number } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmDelegasiId, setConfirmDelegasiId] = useState<{ id: string; title: string; empName: string } | null>(null);
  const [openOthersSection, setOpenOthersSection] = useState(false);
  const [autoCascadePlanId, setAutoCascadePlanId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  if (!currentUser) return null;

  const isStaff = currentUser.role === "staff";
  // Staff selalu "mine"; atasan bisa pilih
  const activeScope: Scope = isStaff ? "mine" : scope;
  const canManage = ["direktur","supervisor","admin"].includes(currentUser.role);

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

  // Pindah ke tab delegasi lalu langsung buka modal + Delegasi untuk rencana terpilih
  useEffect(() => {
    if (activeScope === "delegasi" && autoCascadePlanId) {
      const plan = plans.find(p => p.id === autoCascadePlanId);
      if (plan) setShowCascadeModal(plan);
      setAutoCascadePlanId(null);
    }
  }, [activeScope, autoCascadePlanId, plans]);

  useEffect(() => {
    if (!openMenu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenu]);

  const openActions = (e: React.MouseEvent<HTMLButtonElement>, p: PerformancePlan) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_W = 176, MENU_H = 190;
    const openUp = rect.bottom + MENU_H > window.innerHeight - 8;
    setOpenMenu({ id: p.id, plan: p, x: Math.min(rect.right - MENU_W + 8, window.innerWidth - MENU_W - 8), y: openUp ? rect.top - MENU_H - 4 : rect.bottom + 4 });
  };

  // Kelompokkan rencana tim: role → pelaksana
  const teamGroups = (() => {
    const byEmp = new Map<string, PerformancePlan[]>();
    for (const p of shown) {
      const arr = byEmp.get(p.assignedTo) ?? [];
      arr.push(p);
      byEmp.set(p.assignedTo, arr);
    }
    // kelompokkan per role, urut hierarki lalu nama
    const order: Record<string, number> = { direktur: 1, supervisor: 2, staff: 3, admin: 4 };
    const byRole = new Map<string, { empId: string; items: PerformancePlan[] }[]>();
    for (const [empId, items] of byEmp) {
      const emp = employees.find(e => e.id === empId);
      const roleId = emp?.role ?? "staff";
      const arr = byRole.get(roleId) ?? [];
      arr.push({ empId, items });
      byRole.set(roleId, arr);
    }
    return [...byRole.entries()]
      .map(([roleId, emps]) => ({
        roleId,
        roleName: roleId.charAt(0).toUpperCase() + roleId.slice(1),
        posLevel: order[roleId] ?? 99,
        emps: emps.sort((a, b) => {
          const na = employees.find(e => e.id === a.empId)?.name ?? "";
          const nb = employees.find(e => e.id === b.empId)?.name ?? "";
          return na.localeCompare(nb);
        }),
      }))
      .sort((a, b) => a.posLevel - b.posLevel || a.roleName.localeCompare(b.roleName));
  })();

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
    const dateOnly = dateStr.split(" ")[0];
    const [y, m, d] = dateOnly.split("-");
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[parseInt(m,10)-1] || m;
    return `${parseInt(d,10)} ${monthName} ${y}`;
  };

  const renderPlanRow = (p: PerformancePlan) => {
    const period = periods.find(s => s.id === p.skpPeriodId);
    // Jumlah target: untuk direktur dengan customTargets, tampilkan jumlah kolom kustom, untuk yang lain tampilkan target biasa
    const jumlahTarget = p.customTargets && p.customTargets.length > 0 ? p.customTargets.length : p.target;
    return (
      <tr key={p.id} onClick={() => router.push(`/rencana/${p.id}`)} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]/50 cursor-pointer">
        <td className="px-3 py-2.5 max-w-[360px]">
          <div className="font-medium text-[#231e21] leading-tight truncate">{p.title}</div>
          <div className="font-mono text-[11px] text-[#283338]/60 truncate">{period?.name}</div>
          <div className="font-mono text-[11px] text-[#283338]/50 mt-0.5">Dibuat: {formatTanggalIndo((p as any).createdAt || p.createdAt || "")}{p.createdAt && p.createdAt.includes(" ") ? `, ${p.createdAt.split(" ")[1]} WIB` : ""}</div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-center">
          <span className="font-mono text-xs font-bold text-[#1c5d5f]">{jumlahTarget}</span>
          <span className="font-mono text-[11px] text-[#283338]/60"> target</span>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="font-mono text-xs text-[#283338]">
            {(p as any).plannedDate ? <><span>{formatTanggalIndo((p as any).plannedDate)}</span><span className="text-[#283338]/60">, {(p as any).plannedTime || "09:00"} WIB</span></> : <span className="text-[#283338]/40">—</span>}
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          {(() => {
            const children = plans.filter(x => x.parentId === p.id);
            const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);
            const parentTarget = parseFloat(String(p.target).replace(",","."))||0;
            return (
              <div className="text-xs">
                <div className="font-mono font-semibold text-[#283338]">{children.length} delegasi penerima</div>
                <div className={`font-mono text-[11px] ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c] font-bold" : "text-[#283338]/60"}`}>{totalPorsi || 0} / {p.target} porsi</div>
              </div>
            );
          })()}
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
          <div className="flex justify-end items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); router.push(`/rencana/${p.id}`); }} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/70 flex items-center justify-center hover:border-[#a2cbcd] hover:text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{ borderRadius: 9999 }} title="Detail" aria-label="Detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            {activeScope === "mine" ? (() => {
              const canCascade = ["direktur","supervisor","admin"].includes(currentUser.role);
              const canEdit = p.createdBy === currentUser.id || currentUser.role === "admin";
              const canDelete = canEdit;
              return (
                <>
                  {canCascade && (
                    <button onClick={(e) => { e.stopPropagation(); setScope("delegasi"); setAutoCascadePlanId(p.id); }} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#1c5d5f] flex items-center justify-center hover:border-[#a2cbcd] hover:bg-[#f2f8f7]" style={{ borderRadius: 9999 }} title="Kelola Pelimpahan" aria-label="Kelola Pelimpahan">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setPlanCustomTargets(p.customTargets?.map(ct => ({ name: ct.name, value: ct.value, unit: ct.unit })) ?? []); setShowPlanModal(true); }} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/70 flex items-center justify-center hover:border-[#a2cbcd] hover:text-[#1c5d5f] hover:bg-[#f2f8f7]" style={{ borderRadius: 9999 }} title="Edit" aria-label="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmId(p.id); }} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] text-[#b91c1c] flex items-center justify-center hover:bg-red-50 hover:border-[#d6aec1]" style={{ borderRadius: 9999 }} title="Hapus" aria-label="Hapus">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  )}
                </>
              );
            })() : (
              <button onClick={e => openActions(e, p)} className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${openMenu?.id === p.id ? "bg-[#1c5d5f] border-[#1c5d5f] text-white" : "bg-white border-[#e4f0f1] text-[#283338]/60 hover:border-[#a2cbcd] hover:text-[#1c5d5f]"}`} style={{ borderRadius: 9999 }} title="Aksi lainnya" aria-label="Aksi">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/></svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">RENCANA KINERJA</p>
          <h2 className="heading-serif text-[24px]">{activeScope === "mine" ? "Tugas saya" : activeScope === "delegasi" ? "Delegasi penerima" : "Rencana tim saya"}</h2>
          <p className="text-xs text-[#283338]/60 mt-0.5">
            {activeScope === "mine"
              ? "Hanya rencana yang ditugaskan kepada Anda."
              : activeScope === "delegasi"
              ? "Kelompok per tugas — siapa saja penerima delegasi dan porsinya."
              : `Semua rencana milik Anda dan delegasi penerima (${employees.filter(e => e.supervisorId === currentUser.id).length} langsung).`}
          </p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="px-3 py-1.5 rounded-full border bg-white text-sm border-[#e4f0f1] w-40 focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 100 }} />
          {(currentUser.role === "direktur" || currentUser.role === "admin" || currentUser.role === "supervisor") && (
            <button onClick={() => { setEditingPlan(null); setPlanForm({ title: "", target: "", skpPeriodId: periods[0]?.id ?? "sp2026" }); setPlanCustomTargets([]); setShowPlanModal(true); }} className="px-4 py-1.5 rounded-full bg-[#1c5d5f] text-white text-xs font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>+ Buat</button>
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
          <button onClick={() => setScope("delegasi")} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${activeScope === "delegasi" ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : "bg-[#e4f0f1] border-[#e4f0f1] text-[#283338]"}`} style={{ borderRadius: 100 }}>
            Delegasi Penerima
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
                {canCascade && <button onClick={() => { closeMenu(); setShowCascadeModal(p); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2 text-[#1c5d5f]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Kelola Pelimpahan</button>}
                {canRealize && <button onClick={() => { closeMenu(); setShowRealizationModal(p); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2 text-[#16325a]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg> Isi Realisasi</button>}
                {canEdit && <button onClick={() => { closeMenu(); setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setPlanCustomTargets(p.customTargets?.map(ct => ({ name: ct.name, value: ct.value, unit: ct.unit })) ?? []); setShowPlanModal(true); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#f2f8f7] flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg> Edit</button>}
                {canDelete && <button onClick={() => { closeMenu(); setConfirmId(p.id); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-[#b91c1c] flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg> Hapus{childCount > 0 ? ` (+${childCount})` : ""}</button>}
                {!canCascade && !canRealize && !canEdit && <div className="px-3 py-2 text-xs text-[#283338]/50">Hanya Detail</div>}
              </>
            );
          })()}
        </div>
      )}

      {/* Delegasi Penerima — dikelompokkan per tugas, dipisah sumbernya */}
      {activeScope === "delegasi" && (() => {
        // tugas saya: tampilkan semua (dengan atau tanpa delegasi)
        const fromMine = shown.filter(p => p.assignedTo === currentUser.id);
        // tugas orang lain: tampilkan semua (dengan atau tanpa delegasi)
        const fromOthers = shown.filter(p => p.assignedTo !== currentUser.id);
        const renderCard = (p: PerformancePlan, showTable = true) => {
          const children = plans.filter(c => c.parentId === p.id).sort((a,b) => {
            const na = employees.find(e=>e.id===a.assignedTo)?.name ?? "";
            const nb = employees.find(e=>e.id===b.assignedTo)?.name ?? "";
            return na.localeCompare(nb);
          });
          const parentTarget = parseFloat(String(p.target).replace(",","."))||0;
          const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);
          return (
            <div key={p.id} className="px-4 py-3 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-[#231e21] leading-tight">{p.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c] font-bold" : "text-[#283338]/60"}`}>{totalPorsi} / {p.target} porsi</span>
                  {canManage && (
                    <button onClick={() => setShowCascadeModal(p)} className="px-2.5 py-1 rounded-full bg-[#1c5d5f] text-white text-[11px] font-medium hover:bg-[#156152]" style={{borderRadius:100}} title="Tambah delegasi penerima">+ Delegasi</button>
                  )}
                </div>
              </div>
              {!showTable ? (
                <div className="mt-1 font-mono text-xs text-[#283338]/50">
                  {children.length > 0 ? `${children.length} delegasi disembunyikan — bukan delegasi Anda.` : "Belum ada delegasi."}
                </div>
              ) : children.length === 0 ? (
                <div className="mt-1 font-mono text-xs text-[#283338]/50">Belum ada delegasi.</div>
              ) : (
              <table className="mt-2 w-full table-fixed border border-[#e4f0f1]" style={{ borderRadius: 8 }}>
                <colgroup>
                  <col className="w-[220px]" />
                  <col />
                  <col className="w-[100px]" />
                  {canManage && <col className="w-[44px]" />}
                </colgroup>
                <thead className="bg-[#f2f8f7] font-mono text-[11px] tracking-wide uppercase text-[#283338]/60">
                  <tr>
                    <th className="text-left px-2.5 py-1.5 font-semibold">Nama</th>
                    <th className="text-left px-2.5 py-1.5 font-semibold">Judul Pelimpahan</th>
                    <th className="text-left px-2.5 py-1.5 font-semibold">Porsi</th>
                    {canManage && <th className="text-right px-2.5 py-1.5 font-semibold">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {children.map(c => {
                    const emp = employees.find(e => e.id === c.assignedTo);
                    return (
                      <tr key={c.id} className="border-t border-[#e4f0f1]">
                        <td className="px-2.5 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{emp?.avatar ?? "?"}</span>
                            <span className="text-sm text-[#231e21] truncate">{emp?.name?.split(",")[0] ?? c.assignedTo}</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5">
                          {canManage ? (
                            <input type="text" defaultValue={c.title} placeholder={p.title} className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-[#e4f0f1] focus:border-[#a2cbcd] bg-transparent focus:bg-[#f2f8f7] text-sm text-[#283338] focus:outline-none" style={{borderRadius:8}}
                              onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==c.title) handleUpdateDelegation(c.id, c.target, v); }}
                              onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                            />
                          ) : <span className="text-sm text-[#283338] truncate block" title={c.title || undefined}>{c.title || "—"}</span>}
                        </td>
                        <td className="px-2.5 py-1.5">
                          {canManage ? (
                            <input type="number" min={1} defaultValue={c.target} placeholder={c.target} className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-[#e4f0f1] focus:border-[#a2cbcd] bg-transparent focus:bg-[#f2f8f7] text-sm text-center font-mono font-bold text-[#1c5d5f] focus:outline-none" style={{borderRadius:8}}
                              onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==c.target) handleUpdateDelegation(c.id, v, c.title); }}
                              onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                            />
                          ) : <span className="font-mono text-xs font-bold text-[#1c5d5f]">{c.target}</span>}
                        </td>
                        {canManage && (
                          <td className="px-2.5 py-1.5">
                            <div className="flex justify-end">
                              <button onClick={() => { const empName = emp?.name?.split(",")[0] ?? c.assignedTo; setConfirmDelegasiId({ id: c.id, title: c.title, empName }); }} className="w-7 h-7 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]" title="Hapus delegasi" aria-label="Hapus delegasi">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
          );
        };
        const sectionHeader = (label: string, eye?: boolean) => (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="eyebrow text-[11px]">{label}</div>
            {eye && (
              <button onClick={() => setOpenOthersSection(v => !v)} className="w-7 h-7 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center hover:border-[#a2cbcd] text-[#1c5d5f]" title={openOthersSection ? "Sembunyikan tugas orang lain" : "Tampilkan tugas orang lain"} aria-label={openOthersSection ? "Sembunyikan tugas orang lain" : "Tampilkan tugas orang lain"}>
                {openOthersSection ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
            )}
          </div>
        );
        if (fromMine.length === 0 && fromOthers.length === 0) {
          return (
            <div className="p-8 text-center border border-dashed bg-white" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>
              <div className="heading-serif text-lg">Belum ada delegasi</div>
              <p className="text-sm text-[#283338]/60 mt-1">Limpahkan rencana lewat menu ⋯ → Kelola Pelimpahan untuk melihat penerimanya di sini.</p>
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {fromMine.length > 0 && sectionHeader("Delegasi dari Tugas Saya")}
            {fromMine.map(p => renderCard(p))}
            {fromOthers.length > 0 && sectionHeader(`Delegasi dari Tugas Orang Lain (${fromOthers.length})`, true)}
            {openOthersSection && fromOthers.map(p => renderCard(p))}
          </div>
        );
      })()}

      {/* Tabel */}
      {activeScope !== "delegasi" && activeScope !== "team" && (
      <div className="border bg-white overflow-hidden relative" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1]">
              <tr className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">
                <th className="text-left px-3 py-2 font-semibold">Rencana</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Target</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Tanggal Rencana</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Delegasi</th>
                <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Progress</th>
                <th className="text-right px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(p => renderPlanRow(p))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="heading-serif text-lg">Belum ada tugas untuk Anda</div>
                      <p className="text-sm text-[#283338]/60 leading-6">Tugas muncul otomatis di sini setelah atasan melimpahkan rencana kepada Anda melalui menu ⋯ → Limpahkan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tabel tim — satu tabel terpisah per jabatan */}
      {activeScope === "team" && (
        <div className="space-y-4">
          {teamGroups.map(group => (
            <div key={group.roleId} className="space-y-2">
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[11px] tracking-[0.06em] uppercase font-semibold text-[#1c5d5f]">{group.roleName}</span>
                <span className="font-mono text-[11px] text-[#283338]/50">{group.emps.length} orang</span>
              </div>
              {group.emps.map(({ empId, items }) => {
                const emp = employees.find(e => e.id === empId);
                return (
                  <div key={empId} className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                    <div className="bg-[#e4f0f1] border-b border-[#a2cbcd] px-3 py-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[10px] font-bold">{emp?.avatar ?? "?"}</span>
                      <span className="font-semibold text-sm text-[#231e21]">{emp?.name ?? empId}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1]">
                          <tr className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">
                            <th className="text-left px-3 py-2 font-semibold">Rencana</th>
                            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Target</th>
                            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Tanggal Rencana</th>
                            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Delegasi</th>
                            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Progress</th>
                            <th className="text-right px-3 py-2 font-semibold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(renderPlanRow)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Konfirmasi hapus delegasi */}
      {confirmDelegasiId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setConfirmDelegasiId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e4f0f1] overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2e8e2] border border-[#d6aec1] flex items-center justify-center text-[#b91c1c] font-bold shrink-0">!</div>
                <div>
                  <h3 className="heading-serif text-lg leading-tight">Hapus delegasi ini?</h3>
                  <p className="font-mono text-xs tracking-wide text-[#283338]/60 mt-0.5">Aksi tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-sm text-[#283338]/80 mt-3 leading-6">
                Delegasi untuk <span className="font-semibold">{confirmDelegasiId.empName}</span> — "{confirmDelegasiId.title}"
              </p>
              <p className="text-xs text-[#283338]/60 mt-2">Realisasi dan bukti yang terkait dengan delegasi ini juga akan ikut terhapus.</p>
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex gap-2 justify-end">
              <button onClick={() => setConfirmDelegasiId(null)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button>
              <button onClick={async () => { const d = confirmDelegasiId; setConfirmDelegasiId(null); if (d) await handleDeleteDelegation(d.id, d.title); }} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-sm font-medium hover:bg-[#991b1b]" style={{ borderRadius: 48 }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
