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
 <div className={depth === 0 ? "space-y-3" : "ml-6 pl-6 border-l-2 border-[#e8e6e5] space-y-3 relative"}>
 {nodes.map((n, idx) => {
 const emp = employees.find(e => e.id === n.assignedTo);
 const childCount = plans.filter(p => p.parentId === n.id).length;
 const isCollapsed = collapsed.has(n.id);
 const isLast = idx === nodes.length - 1;
 return (
 <div key={n.id} className="relative">
 {depth > 0 && (
 <>
 <div className="absolute -left-6 top-[20px] w-6 h-[2px] bg-[#e8e6e5] rounded-full z-0" />
 <div className="absolute -left-[28px] top-[15px] w-3 h-3 rounded-full bg-[#0c0a09] border-2 border-white shadow-md z-10" />
 </>
 )}
 {depth > 0 && isLast && <div className="absolute -left-7 top-[22px] bottom-0 w-3 bg-white -ml-px z-0" />}
 <div onClick={() => router.push(`/rencana/${n.id}`)} className="group px-3 py-2.5 border bg-white hover:border-[#d6d3d1] hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] cursor-pointer flex items-center justify-between gap-2 transition-all" style={{ borderRadius: 10, borderColor: "#e8e6e5", boxShadow: "rgba(0,0,0,0.03) 0px 1px 4px 0px"}}>
 <div className="flex items-center gap-2.5 flex-1 min-w-0">
 <div className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[10px] font-medium shrink-0">{emp?.avatar ?? n.title.slice(0,2).toUpperCase()}</div>
 <div className="flex-1 min-w-0">
  <div className="text-[13px] font-medium leading-tight truncate text-[#0c0a09] group-hover:text-[#1c1917]" style={{ fontFamily: "var(--font-inter)"}}>{n.title}</div>
 <div className="text-[11px] tracking-wide text-[#78716c] truncate leading-none mt-0.5 flex items-center gap-1.5"><span>{emp?.name?.split(",")[0]}</span><span className="w-1 h-1 rounded-full bg-[#e8e6e5]"/><span className="text-[#a8a29e]">Target {n.target}</span> {childCount>0 && <span className="ml-0.5 px-1.5 py-0 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[10px] font-medium">{childCount} cabang</span>}</div>
 </div>
 </div>
 {childCount > 0 ? (
 <button onClick={e => { e.stopPropagation(); toggle(n.id); }} className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isCollapsed ? "bg-white border-[#e8e6e5] text-[#78716c] hover:border-[#d6d3d1]" : "bg-[#0c0a09] border-[#0c0a09] text-white"}`} title={isCollapsed ? "Tampilkan turunan": "Sembunyikan turunan"} aria-label={isCollapsed ? "Tampilkan turunan": "Sembunyikan turunan"}>
 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={isCollapsed ? "M6 9l6 6 6-6": "M18 15l-6-6-6 6"} /></svg>
 </button>
 ) : <span className="w-6 h-6 rounded-full bg-[#f5f5f4] border border-[#e8e6e5] flex items-center justify-center text-[#a8a29e] text-[10px]">—</span>}
 </div>
 {!isCollapsed && childCount>0 && <div className="mt-2.5">{build(n.id, depth + 1)}</div>}
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
  <div className={depth === 0 ? "space-y-4" : "ml-6 border-l border-[#e8e6e5] pl-6 space-y-4 mt-4"}>
 {members.map(m => {
 const subs = employees.filter(e => e.supervisorId === m.id);
 const myPlans = plans.filter(p => p.assignedTo === m.id);
 const avg = myPlans.length ? Math.round(myPlans.reduce((a, b) => a + b.progress, 0) / myPlans.length) : 0;
 return (
 <div key={m.id} className="relative">
 {depth > 0 && <div className="absolute -left-6 top-7 w-6 h-px bg-[#e8e6e5]"/>}
 <div className="p-4 border bg-white flex items-center gap-4" style={{ borderRadius: 10, borderColor: "#e8e6e5", boxShadow: "rgba(0,0,0,0.05) 0px 1px 2px 0px"}}>
 <div className="w-10 h-10 rounded-full bg-[#0c0a09] text-white flex items-center justify-center font-medium text-[14px]">{m.avatar}</div>
 <div className="flex-1 min-w-0"><div className="font-medium text-[14px] text-[#0c0a09]">{m.name}</div><div className="text-[12px] tracking-wide text-[#78716c]">{roleLabel[m.role]} • {m.employeeNumber}</div>
 <div className="mt-1.5 flex items-center gap-2"><div className="flex-1 max-w-[180px] h-1.5 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><div className="h-full bg-[#3ba6f1]" style={{ width: `${Math.min(avg, 100)}%` }} /></div><span className="text-[12px] font-medium text-[#0c0a09]">{avg}%</span><span className="text-[12px] text-[#a8a29e]">{myPlans.length} rencana • {subs.length} delegasi penerima</span></div>
 </div>
 <span className="text-[12px] tracking-[0.06em] uppercase px-2 py-1 rounded-full bg-[#0c0a09] text-white" style={{ borderRadius: 9999 }}>{m.role}</span>
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
