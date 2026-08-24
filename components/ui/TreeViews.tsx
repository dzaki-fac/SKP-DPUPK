"use client";
import { useSKP } from "@/lib/store";
import { getPosition, getDept } from "@/lib/data";

export function CascadingTree({ onSelect }: { onSelect?: (id: string) => void }) {
  const { plans, employees, realizations, setSelectedPlanDetail } = useSKP();
  const build = (parentId: string | null, depth = 0): React.ReactNode => {
    const nodes = plans.filter(p => p.parentId === parentId);
    if (nodes.length === 0) return null;
    return (
      <div className={depth === 0 ? "space-y-4" : "ml-6 border-l border-[#a2cbcd] pl-6 space-y-4"}>
        {nodes.map(n => {
          const emp = employees.find(e => e.id === n.assignedTo);
          const rels = realizations.filter(r => r.planId === n.id);
          const childCount = plans.filter(p => p.parentId === n.id).length;
          const hasOver = n.progress > 100;
          // Hitung terealisasi kumulatif: langsung + turunan
          const directDone = realizations.filter(r => r.planId === n.id).length;
                    const descendantIds = new Set<string>();
          const queue: string[] = plans.filter(p => p.parentId === n.id).map(p => p.id);
          while (queue.length) { const cur = queue.shift()!; if (descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
          const viaChildren = realizations.filter(r => descendantIds.has(r.planId)).length;
          const totalDone = directDone + viaChildren;
          const targetNum = parseFloat(String(n.target).replace(",", ".")) || 0;
          const fraction = targetNum > 0 ? `${Number.isInteger(totalDone) ? totalDone : totalDone.toFixed(1).replace(/\.0$/, "")} / ${n.target} terealisasi` : `${n.progress}%`;
          return (
            <div key={n.id} className="relative">
              {depth > 0 && <div className="absolute -left-6 top-6 w-6 h-px bg-[#a2cbcd]" />}
              <div onClick={() => setSelectedPlanDetail(n)} className="p-4 border bg-[#e4f0f1] hover:bg-white hover:border-[#a2cbcd] cursor-pointer" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-xs font-bold shrink-0">{emp?.avatar ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="heading-serif text-[15px] leading-tight truncate">{n.title}</div>
                      <div className="font-mono text-xs tracking-wide text-[#283338]/60 truncate">{emp?.name?.split(",")[0]} • {n.target} {childCount > 0 && `• ${childCount} turunan`}</div>
                    </div>
                  </div>
                <div className="mt-1 font-mono text-[11px] tracking-wide text-[#1c5d5f] font-semibold">{fraction}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(n.progress, 100)}%` }} /></div>
                  <span className={`font-mono text-xs font-bold shrink-0 ${hasOver ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{n.progress}%</span>
                  {hasOver && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2e8e2] border border-[#d6aec1] font-mono">LEBIH</span>}
                </div>
                {rels.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {rels.slice(0, 2).map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-[#231e21] truncate flex-1">{(r as any).title || "Realisasi"} — {r.value}</span>
                      </div>
                    ))}
                    {rels.length > 2 && <div className="font-mono text-[11px] text-[#283338]/50">+{rels.length - 2} lagi</div>}
                  </div>
                )}
              </div>
              <div className="mt-3">{build(n.id, depth + 1)}</div>
            </div>
          );
        })}
      </div>
    );
  };
  return <>{build(null)}</>;
}

export function OrgTree() {
  const { employees, plans } = useSKP();
  const build = (supervisorId: string | null, depth = 0): React.ReactNode => {
    const members = employees.filter(e => e.supervisorId === supervisorId);
    if (members.length === 0) return null;
    return (
      <div className={depth === 0 ? "space-y-4" : "ml-6 border-l border-[#a2cbcd] pl-6 space-y-4 mt-4"}>
        {members.map(m => {
          const subs = employees.filter(e => e.supervisorId === m.id);
          const myPlans = plans.filter(p => p.assignedTo === m.id);
          const avg = myPlans.length ? Math.round(myPlans.reduce((a, b) => a + b.progress, 0) / myPlans.length) : 0;
          return (
            <div key={m.id} className="relative">
              {depth > 0 && <div className="absolute -left-6 top-7 w-6 h-px bg-[#a2cbcd]" />}
              <div className="p-4 border bg-[#e4f0f1] flex items-center gap-4" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                <div className="w-10 h-10 rounded-full bg-[#16325a] text-white flex items-center justify-center font-bold text-sm">{m.avatar}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{m.name}</div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{getPosition(m.positionId)} • {getDept(m.departmentId)} • {m.employeeNumber}</div>
                  <div className="mt-1.5 flex items-center gap-2"><div className="flex-1 max-w-[180px] h-1.5 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(avg, 100)}%` }} /></div><span className="font-mono text-xs font-semibold text-[#1c5d5f]">{avg}%</span><span className="font-mono text-xs text-[#283338]/50">{myPlans.length} rencana • {subs.length} bawahan</span></div>
                </div>
                <span className="text-xs font-mono tracking-[0.06em] uppercase px-2 py-1 rounded-full bg-[#1c5d5f] text-white" style={{ borderRadius: 100 }}>{m.role}</span>
              </div>
              {build(m.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };
  return <>{build(null)}</>;
}
