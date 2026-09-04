"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
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

  const activeScope: Scope = scope;
  const canManage = true;

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

  const teamGroups = (() => {
    const byEmp = new Map<string, PerformancePlan[]>();
    for (const p of shown) {
      const arr = byEmp.get(p.assignedTo) ?? [];
      arr.push(p);
      byEmp.set(p.assignedTo, arr);
    }
    const order: Record<string, number> = { pimpinan_1: 1, pimpinan_2: 2, pimpinan_3: 3, staf: 4, admin: 5 };
    const byRole = new Map<string, { empId: string; items: PerformancePlan[] }[]>();
    for (const [empId, items] of byEmp) {
      const emp = employees.find(e => e.id === empId);
      const roleId = emp?.role ?? "staf";
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

  // Export ke Excel XLSX — 2 sheet: Rencana + Rincian Target
  const exportExcel = () => {
    const rows = shown;
    if (rows.length === 0) return;
    const header = ["No","Judul Rencana","Periode","Pelaksana","Jabatan","Target","Jumlah Delegasi","Total Porsi","Progress %","Terealisasi","Tgl Rencana","Waktu","Dibuat Pada","Rincian Target"];
    const data: (string|number)[][] = [header];
    rows.forEach((p, idx) => {
      const period = periods.find(s => s.id === p.skpPeriodId);
      const emp = employees.find(e => e.id === p.assignedTo);
      const children = plans.filter(x => x.parentId === p.id);
      const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);
      const direct = realizations.filter(r => r.planId === p.id).length;
      const descendantIds = new Set<string>();
      const queue: string[] = plans.filter(x => x.parentId === p.id).map(x => x.id);
      while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
      const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
      const total = direct + viaChildren;
      const rincian = (p as any).customTargets?.length ? (p as any).customTargets.map((ct:any)=> `${ct.name}: ${ct.value} ${ct.unit}`).join(" | ") : "-";
      data.push([
        idx+1,
        p.title,
        period?.name ?? p.skpPeriodId,
        emp?.name ?? p.assignedTo,
        emp?.role ?? "",
        p.target,
        children.length,
        `${totalPorsi} / ${p.target}`,
        p.progress,
        `${total} / ${p.target}`,
        (p as any).plannedDate ? formatTanggalIndo((p as any).plannedDate) : "",
        (p as any).plannedTime ?? "",
        (p as any).createdAt ?? p.createdAt ?? "",
        rincian,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{wch:4},{wch:36},{wch:14},{wch:22},{wch:14},{wch:8},{wch:10},{wch:12},{wch:10},{wch:12},{wch:12},{wch:8},{wch:14},{wch:30}];
    (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
    (ws as any)["!autofilter"] = { ref: ws["!ref"] };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rencana");
    // Sheet 2: Rincian Target per Rencana (long format)
    const rtHeader = ["No","Judul Rencana","Periode","Nama Target","Nilai Target","Satuan","Pelaksana"];
    const rtRows: (string|number)[][] = [];
    let rtNo = 1;
    rows.forEach(p=>{
      const period = periods.find(s=> s.id===p.skpPeriodId);
      const emp = employees.find(e=> e.id===p.assignedTo);
      const cts = (p as any).customTargets as Array<{name:string,value:string,unit:string}> | undefined;
      if (cts && cts.length) {
        cts.forEach((ct:any)=>{
          rtRows.push([rtNo++, p.title, period?.name ?? p.skpPeriodId, ct.name, ct.value, ct.unit, emp?.name ?? p.assignedTo]);
        });
      } else {
        rtRows.push([rtNo++, p.title, period?.name ?? p.skpPeriodId, "-", "-", "-", emp?.name ?? p.assignedTo]);
      }
    });
    const wsRt = XLSX.utils.aoa_to_sheet([rtHeader, ...rtRows]);
    wsRt["!cols"] = [{wch:4},{wch:36},{wch:14},{wch:18},{wch:12},{wch:10},{wch:22}];
    (wsRt as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
    (wsRt as any)["!autofilter"] = { ref: wsRt["!ref"] };
    XLSX.utils.book_append_sheet(wb, wsRt, "Rincian Target");
    // Sheet 3: Delegasi ringkas
    const dHeader = ["No","Induk","Delegasi Kepada","Judul Delegasi","Porsi","Progress %"];
    const dRows: (string|number)[][] = [];
    let dNo=1;
    rows.forEach(p=>{
      const children = plans.filter(x=> x.parentId===p.id);
      children.forEach(c=>{
        const emp = employees.find(e=>e.id===c.assignedTo);
        dRows.push([dNo++, p.title, emp?.name ?? c.assignedTo, c.title, c.target, c.progress]);
      });
    });
    if (dRows.length) {
      const wsD = XLSX.utils.aoa_to_sheet([dHeader, ...dRows]);
      wsD["!cols"] = [{wch:4},{wch:28},{wch:20},{wch:28},{wch:8},{wch:10}];
      (wsD as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, wsD, "Delegasi");
    }
    XLSX.writeFile(wb, `rencana-${activeScope}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const renderPlanRow = (p: PerformancePlan) => {
    const period = periods.find(s => s.id === p.skpPeriodId);
    const jumlahTarget = p.target;
    const rowPad = "px-2.5 py-1.5";
    const titleSize = "text-[13px]";
    return (
      <tr key={p.id} onClick={() => router.push(`/rencana/${p.id}`)} className="border-b border-[#e8e6e5] hover:bg-[#fafaf9] cursor-pointer group">
 <td className={`${rowPad} max-w-[360px]`}>
 <div className={`font-medium text-[#0c0a09] leading-tight truncate ${titleSize}`}>{p.title}</div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]">{period?.name ?? "-"}</span>
 </div>
 </td>
        <td className={`${rowPad} whitespace-nowrap text-center`}>
          <span className="text-[12px] font-medium text-[#0c0a09]">{jumlahTarget}</span>
        </td>
        <td className={`${rowPad} whitespace-nowrap hidden md:table-cell`}>
          <div className="text-[12px] text-[#0c0a09]">
            {(p as any).plannedDate ? <span>{formatTanggalIndo((p as any).plannedDate)}</span> : <span className="text-[#a8a29e]">—</span>}
          </div>
        </td>
        <td className={`${rowPad} whitespace-nowrap`}>
          {(() => {
            const children = plans.filter(x => x.parentId === p.id);
            const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);
            const parentTarget = parseFloat(String(p.target).replace(",","."))||0;
            return (
              <div className="text-[12px] leading-tight">
                <div className="font-medium text-[#0c0a09]">{children.length}<span className="font-normal text-[#78716c]"> delegasi</span></div>
                <div className={`text-[11px] ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c] font-medium" : "text-[#a8a29e]"}`}>{totalPorsi || 0} / {p.target}</div>
              </div>
            );
          })()}
        </td>
        <td className={`${rowPad} whitespace-nowrap`}>
          <div className="flex items-center gap-1.5">
            <span className="w-12 h-1 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><span className="block h-full bg-[#3ba6f1]" style={{ width: `${Math.min(p.progress, 100)}%` }} /></span>
            <span className="text-[11px] font-medium text-[#0c0a09] w-7 text-right">{p.progress}%</span>
          </div>
          <div className="text-[11px] text-[#78716c] leading-none mt-0.5">
            {(() => {
              const direct = realizations.filter(r => r.planId === p.id).length;
              const descendantIds = new Set<string>();
              const queue: string[] = plans.filter(x => x.parentId === p.id).map(x => x.id);
              while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
              const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
              const total = direct + viaChildren;
              return `${total}/${p.target}`;
            })()}
          </div>
        </td>
        <td className={`${rowPad}`}>
          <div className="flex justify-end items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); router.push(`/rencana/${p.id}`); }} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:border-[#d6d3d1] hover:text-[#0c0a09] hover:bg-[#fafaf9] active:scale-95" style={{ borderRadius: 9999 }} title="Detail">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            {activeScope === "mine" ? (() => {
              const canEdit = p.createdBy === currentUser.id || currentUser.role === "admin";
              return (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setScope("delegasi"); setAutoCascadePlanId(p.id); }} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#3ba6f1] flex items-center justify-center hover:bg-[#fafaf9] active:scale-95" style={{ borderRadius: 9999 }} title="Delegasi">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  </button>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setPlanCustomTargets((p as any).customTargets?.map((ct:any) => ({ name: ct.name, value: ct.value, unit: ct.unit })) ?? []); setShowPlanModal(true); }} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:text-[#0c0a09] hover:bg-[#fafaf9] active:scale-95" style={{ borderRadius: 9999 }} title="Edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmId(p.id); }} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#a8a29e] flex items-center justify-center hover:text-[#b91c1c] hover:border-[#e8e6e5] hover:bg-red-50 active:scale-95" style={{ borderRadius: 9999 }} title="Hapus">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  )}
                </>
              );
            })() : (
              <button onClick={e => openActions(e, p)} className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 active:scale-95 ${openMenu?.id === p.id ? "bg-[#0c0a09] border-[#0c0a09] text-white" : "bg-white border-[#e8e6e5] text-[#a8a29e] hover:text-[#0c0a09]"}`} style={{ borderRadius: 9999 }} title="Aksi">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/></svg>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">RENCANA KINERJA</p>
          <h2 className="heading-sm">{activeScope === "mine" ? "Tugas saya" : activeScope === "delegasi" ? "Delegasi penerima" : "Rencana tim saya"}</h2>
          <p className="text-[12px] text-[#78716c] mt-1">
            {activeScope === "mine"
              ? "Hanya rencana yang ditugaskan kepada Anda."
              : activeScope === "delegasi"
              ? "Kelompok per tugas — siapa saja penerima delegasi dan porsinya."
              : `Semua rencana milik Anda dan delegasi penerima (${employees.filter(e => e.supervisorId === currentUser.id).length} langsung).`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#a8a29e] hidden sm:inline px-2">{shown.length} baris • rapat</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari judul..." className="px-3 py-1.5 rounded-full border bg-white text-[13px] border-[#e8e6e5] w-36 sm:w-44 focus:outline-none focus:border-[#d6d3d1] placeholder:text-[#a8a29e]" style={{ borderRadius: 9999 }} />
          <button onClick={exportExcel} disabled={shown.length===0} className="px-3 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09] text-[12px] font-medium hover:bg-[#fafaf9] disabled:opacity-40 inline-flex items-center gap-1.5" style={{ borderRadius: 9999 }} title="Export ke Excel (CSV)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Excel
          </button>
          <button onClick={() => { setEditingPlan(null); setPlanForm({ title: "", target: "", skpPeriodId: periods[0]?.id ?? "sp2026"}); setPlanCustomTargets([]); setShowPlanModal(true); }} className="px-3.5 py-1.5 rounded-full bg-[#0c0a09] text-white text-[12px] font-medium hover:bg-[#1c1917] active:scale-95" style={{ borderRadius: 9999 }}>+ Buat</button>
        </div>
      </div>

      {/* Scope pills — compact */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => setScope("mine")} className={`px-3 py-1 rounded-full text-[12px] font-medium border ${activeScope === "mine" ? "bg-[#0c0a09] text-white border-[#0c0a09]" : "bg-white border-[#e8e6e5] text-[#78716c] hover:border-[#d6d3d1]"}`} style={{ borderRadius: 9999 }}>
          Tugas Saya {myPlans.length}
        </button>
        <button onClick={() => setScope("team")} className={`px-3 py-1 rounded-full text-[12px] font-medium border ${activeScope === "team" ? "bg-[#0c0a09] text-white border-[#0c0a09]" : "bg-white border-[#e8e6e5] text-[#78716c] hover:border-[#d6d3d1]"}`} style={{ borderRadius: 9999 }}>
          Tim {filteredPlans.length}
        </button>
        <button onClick={() => setScope("delegasi")} className={`px-3 py-1 rounded-full text-[12px] font-medium border ${activeScope === "delegasi" ? "bg-[#0c0a09] text-white border-[#0c0a09]" : "bg-white border-[#e8e6e5] text-[#78716c] hover:border-[#d6d3d1]"}`} style={{ borderRadius: 9999 }}>
          Delegasi
        </button>
        <span className="text-[11px] text-[#a8a29e] ml-1">• {shown.length} tampil</span>
        {search && <button onClick={() => setSearch("")} className="ml-1 px-2.5 py-1 rounded-full text-[11px] bg-[#c1e1f7] border border-[#e8e6e5] text-[#0c0a09]" style={{ borderRadius: 9999 }}>✕ {search}</button>}
      </div>

      {/* Confirm delete */}
      {confirmPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={() => setConfirmId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5] overflow-hidden" style={{ borderRadius: 10 }}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fafaf9] border border-[#e8e6e5] flex items-center justify-center text-[#b91c1c] font-medium shrink-0">!</div>
                <div>
                  <h3 className="subheading text-[16px]">Hapus rencana ini?</h3>
                  <p className="text-[11px] tracking-wide text-[#a8a29e] mt-0.5">Aksi tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-[13px] text-[#0c0a09] mt-3 leading-5">"{confirmPlan.title}"</p>
              {(() => {
                const ids = new Set<string>([confirmPlan.id]);
                let changed = true;
                while (changed) { changed = false; for (const x of plans) { if (x.parentId && ids.has(x.parentId) && !ids.has(x.id)) { ids.add(x.id); changed = true; } } }
                const total = ids.size - 1;
                return total > 0 ? (
                  <div className="mt-2 p-2.5 rounded-[8px] bg-[#fafaf9] border border-[#e8e6e5] text-[12px] leading-5" style={{ borderRadius: 8 }}>
                    <span className="font-medium">{total} turunan</span> ikut terhapus.
                    <div className="mt-1 space-y-0.5 max-h-20 overflow-y-auto text-[11px] text-[#78716c]">
                      {plans.filter(x => ids.has(x.id) && x.id !== confirmPlan.id).map(x => <div key={x.id} className="truncate">↳ {x.title}</div>)}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="p-3 border-t border-[#e8e6e5] flex gap-2 justify-end bg-[#fafaf9]">
              <button onClick={() => setConfirmId(null)} className="px-4 py-1.5 rounded-full border border-[#e8e6e5] bg-white text-[13px]" style={{ borderRadius: 9999 }}>Batal</button>
              <button onClick={async () => { const plan = confirmPlan; setConfirmId(null); if (plan) await handleDeletePlan(plan.id, plan.title); }} className="px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px] font-medium hover:bg-[#1c1917]" style={{ borderRadius: 9999 }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {openMenu && (
        <div ref={menuRef} className="fixed z-50 w-44 bg-white border border-[#e8e6e5] overflow-hidden" style={{ borderRadius: 10, left: openMenu.x, top: openMenu.y, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px" }}>
          {(() => {
            const p = openMenu.plan;
            const canCascade = true;
            const canRealize = p.assignedTo === currentUser.id;
            const canEdit = p.createdBy === currentUser.id || currentUser.role === "admin";
            const canDelete = canEdit;
            return (
              <>
                {canCascade && <button onClick={() => { closeMenu(); setShowCascadeModal(p); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#fafaf9] flex items-center gap-2 text-[#0c0a09]">Kelola Pelimpahan</button>}
                {canRealize && <button onClick={() => { closeMenu(); setShowRealizationModal(p); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#fafaf9] flex items-center gap-2 text-[#0c0a09]">Isi Realisasi</button>}
                {canEdit && <button onClick={() => { closeMenu(); setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setPlanCustomTargets((p as any).customTargets?.map((ct:any) => ({ name: ct.name, value: ct.value, unit: ct.unit })) ?? []); setShowPlanModal(true); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#fafaf9] flex items-center gap-2">Edit</button>}
                {canDelete && <button onClick={() => { closeMenu(); setConfirmId(p.id); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-red-50 text-[#b91c1c] flex items-center gap-2">Hapus</button>}
              </>
            );
          })()}
        </div>
      )}

      {/* Delegasi cards */}
      {activeScope === "delegasi" && (() => {
        const fromMine = shown.filter(p => p.assignedTo === currentUser.id);
        const fromOthers = shown.filter(p => p.assignedTo !== currentUser.id);
        const renderCard = (p: PerformancePlan) => {
          const children = plans.filter(c => c.parentId === p.id).sort((a,b) => {
            const na = employees.find(e=>e.id===a.assignedTo)?.name ?? "";
            const nb = employees.find(e=>e.id===b.assignedTo)?.name ?? "";
            return na.localeCompare(nb);
          });
          const parentTarget = parseFloat(String(p.target).replace(",","."))||0;
          const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);
          return (
            <div key={p.id} className="px-3 py-2.5 border bg-white" style={{ borderRadius: 10, borderColor: "#e8e6e5"}}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-[13px] text-[#0c0a09] leading-tight">{p.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c] font-medium" : "text-[#a8a29e]"}`}>{totalPorsi} / {p.target} porsi</span>
                  {canManage && (
                    <button onClick={() => setShowCascadeModal(p)} className="px-2.5 py-1 rounded-full bg-[#0c0a09] text-white text-[11px] font-medium hover:bg-[#1c1917]" style={{borderRadius:9999}}>+ Delegasi</button>
                  )}
                </div>
              </div>
              {children.length === 0 ? (
                <div className="mt-1 text-[11px] text-[#a8a29e]">Belum ada delegasi.</div>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-[12px] border border-[#e8e6e5]" style={{ borderRadius: 8 }}>
                    <thead className="bg-[#fafaf9] text-[11px] tracking-wide uppercase text-[#78716c]">
                      <tr>
                        <th className="text-left px-2 py-1 font-medium">Nama</th>
                        <th className="text-left px-2 py-1 font-medium">Judul</th>
                        <th className="text-left px-2 py-1 font-medium">Porsi</th>
                        {canManage && <th className="text-right px-2 py-1 font-medium">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {children.map(c => {
                        const emp = employees.find(e => e.id === c.assignedTo);
                        return (
                          <tr key={c.id} className="border-t border-[#e8e6e5] hover:bg-[#fafaf9]/50">
                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[9px] font-medium shrink-0">{emp?.avatar ?? "?"}</span>
                                <span className="text-[12px] text-[#0c0a09] truncate">{emp?.name?.split(",")[0] ?? c.assignedTo}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1">
                              {canManage ? (
                                <input type="text" defaultValue={c.title} placeholder={p.title} className="w-full px-1.5 py-1 rounded-[6px] border border-transparent hover:border-[#e8e6e5] focus:border-[#d6d3d1] bg-transparent focus:bg-[#fafaf9] text-[12px] text-[#0c0a09] focus:outline-none" style={{borderRadius:6}}
                                  onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==c.title) handleUpdateDelegation(c.id, c.target, v); }}
                                  onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                                />
                              ) : <span className="text-[12px] text-[#0c0a09] truncate block">{c.title || "—"}</span>}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {canManage ? (
                                <input type="number" min={1} defaultValue={c.target} className="w-14 px-1 py-1 rounded-[6px] border border-transparent hover:border-[#e8e6e5] focus:border-[#d6d3d1] bg-transparent focus:bg-[#fafaf9] text-[12px] text-center font-medium text-[#0c0a09] focus:outline-none" style={{borderRadius:6}}
                                  onBlur={e=>{ const v=e.target.value.trim(); if(v && v!==c.target) handleUpdateDelegation(c.id, v, c.title); }}
                                  onKeyDown={e=>{ if(e.key==="Enter") (e.target as HTMLInputElement).blur(); }}
                                />
                              ) : <span className="text-[11px] font-medium text-[#0c0a09]">{c.target}</span>}
                            </td>
                            {canManage && (
                              <td className="px-2 py-1">
                                <div className="flex justify-end">
                                  <button onClick={() => { const empName = emp?.name?.split(",")[0] ?? c.assignedTo; setConfirmDelegasiId({ id: c.id, title: c.title, empName }); }} className="w-6 h-6 rounded-full bg-white border border-[#e8e6e5] text-[#a8a29e] flex items-center justify-center hover:text-[#b91c1c] hover:bg-red-50" title="Hapus">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        };
        const sectionHeader = (label: string, eye?: boolean) => (
          <div className="flex items-center justify-between gap-2">
            <div className="eyebrow">{label}</div>
            {eye && (
              <button onClick={() => setOpenOthersSection(v => !v)} className="w-6 h-6 rounded-full bg-white border border-[#e8e6e5] flex items-center justify-center hover:border-[#d6d3d1] text-[#78716c]">
                {openOthersSection ? "−" : "+"}
              </button>
            )}
          </div>
        );
        if (fromMine.length === 0 && fromOthers.length === 0) {
          return (
            <div className="p-6 text-center border border-dashed bg-white" style={{ borderRadius: 10, borderColor: "#e8e6e5"}}>
              <div className="subheading">Belum ada delegasi</div>
              <p className="text-[13px] text-[#78716c] mt-1">Limpahkan rencana lewat menu ⋯ → Kelola Pelimpahan.</p>
            </div>
          );
        }
        return (
          <div className="space-y-2.5">
            {fromMine.length > 0 && sectionHeader("Delegasi dari Tugas Saya")}
            {fromMine.map(p => renderCard(p))}
            {fromOthers.length > 0 && sectionHeader(`Delegasi dari Tugas Orang Lain (${fromOthers.length})`, true)}
            {openOthersSection && fromOthers.map(p => renderCard(p))}
          </div>
        );
      })()}

      {/* Table compact */}
      {activeScope !== "delegasi" && activeScope !== "team" && (
        <div className="border bg-white overflow-hidden" style={{ borderRadius: 10, borderColor: "#e8e6e5"}}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#fafaf9] border-b border-[#e8e6e5] sticky top-0">
                <tr className="text-[11px] tracking-wide uppercase text-[#78716c]">
                  <th className="text-left px-2.5 py-1.5 font-medium">Rencana</th>
                  <th className="text-center px-2 py-1.5 font-medium w-[70px]">Target</th>
                  <th className="text-left px-2 py-1.5 font-medium hidden lg:table-cell w-[130px]">Tgl Rencana</th>
                  <th className="text-left px-2 py-1.5 font-medium w-[110px]">Delegasi</th>
                  <th className="text-left px-2 py-1.5 font-medium w-[140px]">Progress</th>
                  <th className="text-right px-2 py-1.5 font-medium w-[110px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(p => renderPlanRow(p))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center">
                      <div className="max-w-sm mx-auto space-y-1">
                        <div className="subheading">Belum ada tugas</div>
                        <p className="text-[13px] text-[#78716c] leading-5">Tugas muncul setelah atasan melimpahkan rencana.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-1.5 bg-[#fafaf9] border-t border-[#e8e6e5] flex items-center justify-between text-[11px] text-[#a8a29e]">
            <span>{shown.length} rencana • rapat</span>
            <span className="hidden sm:inline">Klik baris untuk detail • Export untuk Excel</span>
          </div>
        </div>
      )}

      {/* Team */}
      {activeScope === "team" && (
        <div className="space-y-3">
          {teamGroups.map(group => (
            <div key={group.roleId} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] tracking-wide uppercase font-medium text-[#0c0a09] bg-[#fafaf9] border border-[#e8e6e5] px-2 py-0.5 rounded-full">{group.roleName}</span>
                <span className="text-[11px] text-[#a8a29e]">{group.emps.length} orang • {group.emps.reduce((s,e)=>s+e.items.length,0)} rencana</span>
              </div>
              {group.emps.map(({ empId, items }) => {
                const emp = employees.find(e => e.id === empId);
                return (
                  <div key={empId} className="border bg-white overflow-hidden" style={{ borderRadius: 10, borderColor: "#e8e6e5"}}>
                    <div className="bg-[#fafaf9] border-b border-[#e8e6e5] px-2.5 py-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[10px] font-medium">{emp?.avatar ?? "?"}</span>
                      <span className="font-medium text-[13px] text-[#0c0a09]">{emp?.name ?? empId}</span>
                      <span className="text-[11px] text-[#78716c] ml-auto">{items.length} rencana</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead className="bg-[#fafaf9] border-b border-[#e8e6e5]">
                          <tr className="text-[11px] tracking-wide uppercase text-[#78716c]">
                            <th className="text-left px-2.5 py-1 font-medium">Rencana</th>
                            <th className="text-center px-2 py-1 font-medium w-[60px]">Target</th>
                            <th className="text-left px-2 py-1 font-medium hidden md:table-cell w-[120px]">Tgl</th>
                            <th className="text-left px-2 py-1 font-medium w-[100px]">Delegasi</th>
                            <th className="text-left px-2 py-1 font-medium w-[130px]">Progress</th>
                            <th className="text-right px-2 py-1 font-medium w-[100px]">Aksi</th>
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
          {teamGroups.length===0 && <div className="text-[13px] text-[#a8a29e] text-center py-8 border border-dashed bg-white rounded-[10px]">Tidak ada data tim untuk filter ini.</div>}
        </div>
      )}

      {/* Confirm delegasi */}
      {confirmDelegasiId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={() => setConfirmDelegasiId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5] overflow-hidden" style={{ borderRadius: 10 }}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fafaf9] border border-[#e8e6e5] flex items-center justify-center text-[#b91c1c] font-medium shrink-0">!</div>
                <div>
                  <h3 className="subheading text-[16px]">Hapus delegasi ini?</h3>
                  <p className="text-[11px] tracking-wide text-[#a8a29e] mt-0.5">Aksi tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-[13px] text-[#0c0a09] mt-3 leading-5">
                Delegasi untuk <span className="font-medium">{confirmDelegasiId.empName}</span> — "{confirmDelegasiId.title}"
              </p>
            </div>
            <div className="p-3 border-t border-[#e8e6e5] flex gap-2 justify-end bg-[#fafaf9]">
              <button onClick={() => setConfirmDelegasiId(null)} className="px-4 py-1.5 rounded-full border border-[#e8e6e5] bg-white text-[13px]" style={{ borderRadius: 9999 }}>Batal</button>
              <button onClick={async () => { const d = confirmDelegasiId; setConfirmDelegasiId(null); if (d) await handleDeleteDelegation(d.id, d.title); }} className="px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px] font-medium hover:bg-[#1c1917]" style={{ borderRadius: 9999 }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
