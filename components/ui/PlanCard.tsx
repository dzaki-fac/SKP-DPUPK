"use client";
import { useSKP } from "@/lib/store";
import type { PerformancePlan } from "@/lib/types";

export function PlanCard({ p }: { p: PerformancePlan }) {
  const { employees, periods, plans, realizations, currentUser, setSelectedPlanDetail, setShowCascadeModal, setShowRealizationModal, setEditingPlan, setPlanForm, setShowPlanModal } = useSKP();
  const assignee = employees.find(e => e.id === p.assignedTo);
  const parent = p.parentId ? plans.find(x => x.id === p.parentId) : null;
  const period = periods.find(s => s.id === p.skpPeriodId);
  const subPlans = plans.filter(x => x.parentId === p.id);
  const rels = realizations.filter(r => r.planId === p.id);
  const latestRel = rels[0];
  if (!currentUser) return null;
  return (
    <div className="p-6 border hover:border-[#a2cbcd] transition bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="eyebrow flex items-center gap-2 text-[11px]">{period?.name}</div>
      {parent && <div className="mt-2 inline-flex text-xs px-3 py-1 rounded-full bg-white border border-[#a2cbcd] text-[#0e4749]" style={{ borderRadius: 100 }}>↳ Turunan: {parent.title.slice(0, 28)}</div>}
      <h3 className="heading-serif text-[20px] leading-tight mt-3">{p.title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <div className="bg-white rounded-xl p-3 border border-[#e4f0f1]" style={{ borderRadius: 12 }}><div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Target</div><div className="text-sm font-bold mt-1">{p.target}</div></div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#283338]/70">
        <span className="w-7 h-7 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[11px] font-bold">{assignee?.avatar}</span>
        <span className="font-medium">{assignee?.name.split(",")[0]}</span>
        {subPlans.length > 0 && <span className="ml-auto text-[11px] font-mono tracking-wide px-2 py-1 rounded-full bg-[#1c5d5f] text-white" style={{ borderRadius: 100 }}>{subPlans.length} turunan</span>}
      </div>
      <div className="mt-4">
        <div className="flex justify-between font-mono text-xs tracking-[0.04em] uppercase"><span className="text-[#283338]/60">Progress</span><span className="font-semibold text-[#1c5d5f]">{p.progress}%</span></div>
        <div className="h-2 bg-white rounded-full overflow-hidden mt-1 border border-[#e4f0f1]"><div className="h-full" style={{ width: `${Math.min(p.progress, 100)}%`, background: "#1c5d5f" }} /></div>
        {(() => {
          const direct = realizations.filter(r => r.planId === p.id).reduce((s, r) => s + (parseFloat(String(r.value).replace(",", ".")) || 0), 0);
          const descendantIds = new Set<string>();
          const queue: string[] = plans.filter(x => x.parentId === p.id).map(x => x.id);
          while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
          const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
          const total = direct + viaChildren;
          const targetNum = parseFloat(String(p.target).replace(",", ".")) || 0;
          if (targetNum <= 0) return null;
          const disp = Number.isInteger(total) ? total : Number(total.toFixed(1));
          return <div className="font-mono text-[11px] text-[#1c5d5f] mt-1">{disp} / {p.target} terealisasi</div>;
        })()}
      </div>
      {latestRel && (
        <div className="mt-3 p-3 rounded-xl border bg-white border-[#e4f0f1] text-xs" style={{ borderRadius: 12 }}>
          <div className="font-medium truncate">{(latestRel as any).title || "Realisasi"}</div>
          <div className="font-mono text-[11px] text-[#283338]/60">{latestRel.date}</div>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1.5 text-xs">
        <span className="flex gap-2 items-center"><span className="text-[#1c5d5f] font-bold">✓</span> Target terukur & tervalidasi</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setSelectedPlanDetail(p)} className="px-4 py-2 rounded-full bg-white border border-[#0e4749] text-[#0e4749] text-xs font-medium hover:bg-[#f2f8f7]" style={{ borderRadius: 48 }}>Detail</button>
        {(currentUser.role === "direktur" || currentUser.role === "supervisor" || currentUser.role === "admin") && (
          <button onClick={() => setShowCascadeModal(p)} className="px-4 py-2 rounded-full bg-[#1c5d5f] text-white text-xs font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Limpahkan ↓</button>
        )}
        {p.assignedTo === currentUser.id && <button onClick={() => setShowRealizationModal(p)} className="px-4 py-2 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90" style={{ borderRadius: 48 }}>Isi Realisasi</button>}
        {(p.createdBy === currentUser.id || currentUser.role === "admin") && (
          <button onClick={() => { setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setShowPlanModal(true); }} className="px-4 py-2 rounded-full bg-white border border-[#e4f0f1] text-xs" style={{ borderRadius: 48 }}>Edit</button>
        )}
      </div>
    </div>
  );
}
