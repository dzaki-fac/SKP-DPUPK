"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";

export function CascadingTree({ onSelect }: { onSelect?: (id: string) => void }) {
  const { plans, employees, realizations } = useSKP();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setCollapsed(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
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
          const isCollapsed = collapsed.has(n.id);
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
              <div onClick={() => router.push(`/rencana/${n.id}`)} className="p-4 border bg-[#e4f0f1] hover:bg-white hover:border-[#a2cbcd] cursor-pointer" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="heading-serif text-[15px] leading-tight truncate pr-2">{n.title}</div>
                      <div className="font-mono text-xs tracking-wide text-[#283338]/60 truncate">{emp?.name?.split(",")[0]}</div>
                    </div>
                    {childCount > 0 && (
                      <button onClick={e => { e.stopPropagation(); toggle(n.id); }} className="w-7 h-7 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center hover:border-[#a2cbcd] text-[#1c5d5f] shrink-0" title={isCollapsed ? "Tampilkan turunan" : "Sembunyikan turunan"} aria-label={isCollapsed ? "Tampilkan turunan" : "Sembunyikan turunan"}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={isCollapsed ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} /></svg>
                      </button>
                    )}
                  </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] tracking-wide text-[#1c5d5f] font-semibold shrink-0">{fraction}</span>
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(n.progress, 100)}%` }} /></div>
                  <span className={`font-mono text-xs font-bold shrink-0 ${hasOver ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{n.progress}%</span>
                  {hasOver && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2e8e2] border border-[#d6aec1] font-mono">LEBIH</span>}
                </div>
                {rels.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-1 marker:text-[#1c5d5f]">
                    {rels.slice(0, 3).map(r => (
                      <li key={r.id} className="text-xs text-[#283338] leading-tight">
                        <span className="font-medium text-[#231e21]">{(r as any).title || "Realisasi"}</span> <span className="text-[#283338]/60">— {r.description?.slice(0,40) ?? r.value}</span>
                      </li>
                    ))}
                    {rels.length > 3 && <li className="font-mono text-[11px] text-[#283338]/50 list-none ml-4">+{rels.length - 3} lagi</li>}
                  </ul>
                )}
              </div>
              {!isCollapsed && <div className="mt-3">{build(n.id, depth + 1)}</div>}
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
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{m.name}</div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{roleLabel[m.role]} • {m.employeeNumber}</div>
                  <div className="mt-1.5 flex items-center gap-2"><div className="flex-1 max-w-[180px] h-1.5 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(avg, 100)}%` }} /></div><span className="font-mono text-xs font-semibold text-[#1c5d5f]">{avg}%</span><span className="font-mono text-xs text-[#283338]/50">{myPlans.length} rencana • {subs.length} delegasi penerima</span></div>
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
