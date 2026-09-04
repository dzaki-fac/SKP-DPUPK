"use client";
import { useRouter } from "next/navigation";
import { useSKP } from "@/lib/store";
import type { PerformancePlan } from "@/lib/types";

export function PlanCard({ p }: { p: PerformancePlan }) {
 const { employees, periods, plans, realizations, currentUser, setShowCascadeModal, setShowRealizationModal, setEditingPlan, setPlanForm, setShowPlanModal } = useSKP();
 const router = useRouter();
 const assignee = employees.find(e => e.id === p.assignedTo);
 const parent = p.parentId ? plans.find(x => x.id === p.parentId) : null;
 const period = periods.find(s => s.id === p.skpPeriodId);
 const subPlans = plans.filter(x => x.parentId === p.id);
 const rels = realizations.filter(r => r.planId === p.id);
 const latestRel = rels[0];
 if (!currentUser) return null;
 return (
 <div className="seline-card hover:border-[#d6d3d1] transition">
 <div className="eyebrow">{period?.name}</div>
 {parent && <div className="mt-2 inline-flex text-[12px] px-3 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]" style={{ borderRadius: 9999 }}>↳ Turunan: {parent.title.slice(0, 28)}</div>}
 <h3 className="subheading mt-3">{p.title}</h3>
 <div className="mt-4 grid grid-cols-1 gap-2">
 <div className="bg-[#fafaf9] rounded-[10px] p-3 border border-[#e8e6e5]"><div className="eyebrow">Target</div><div className="text-[14px] font-medium mt-1 text-[#0c0a09]">{p.target}</div></div>
 </div>
 <div className="mt-4 flex items-center gap-2 text-[12px] text-[#78716c]">
 <span className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[12px] font-medium">{assignee?.avatar}</span>
 <span className="font-medium text-[#0c0a09]">{assignee?.name.split(",")[0]}</span>
 {subPlans.length > 0 && <span className="ml-auto text-[12px] tracking-[0.04em] px-2 py-1 rounded-full bg-[#0c0a09] text-white" style={{ borderRadius: 9999 }}>{subPlans.length} turunan</span>}
 </div>
 <div className="mt-4">
 <div className="flex justify-between text-[12px] tracking-[0.04em] uppercase"><span className="text-[#a8a29e]">Progress</span><span className="font-medium text-[#0c0a09]">{p.progress}%</span></div>
 <div className="h-1.5 bg-[#fafaf9] rounded-full overflow-hidden mt-1 border border-[#e8e6e5]"><div className="h-full bg-[#3ba6f1]" style={{ width: `${Math.min(p.progress, 100)}%` }} /></div>
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
 return <div className="text-[12px] text-[#78716c] mt-1">{disp} / {p.target} terealisasi</div>;
 })()}
 </div>
 {latestRel && (
 <div className="mt-3 p-3 rounded-[10px] border bg-[#fafaf9] border-[#e8e6e5] text-[12px]">
 <div className="font-medium truncate text-[#0c0a09]">{(latestRel as any).title || "Realisasi"}</div>
 <div className="text-[12px] text-[#78716c]">{latestRel.date}</div>
 </div>
 )}
 <div className="mt-3 flex flex-col gap-1.5 text-[12px]">
 <span className="flex gap-2 items-center text-[#78716c]"><span className="text-[#3ba6f1] font-medium">✓</span> Target terukur & tervalidasi</span>
 </div>
 <div className="mt-5 flex flex-wrap gap-2">
 <button onClick={() => router.push(`/rencana/${p.id}`)} className="px-4 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09] text-[12px] font-normal hover:bg-[#fafaf9]" style={{ borderRadius: 9999 }}>Detail</button>
 {(currentUser.role === "pimpinan_1"|| currentUser.role === "pimpinan_2"|| currentUser.role === "pimpinan_3"|| currentUser.role === "admin") && (
 <button onClick={() => setShowCascadeModal(p)} className="px-4 py-1.5 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white text-[12px] font-medium hover:brightness-[0.97]" style={{ borderRadius: 9999 }}>Limpahkan ↓</button>
 )}
 {p.assignedTo === currentUser.id && <button onClick={() => setShowRealizationModal(p)} className="px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[12px] font-medium hover:bg-[#1c1917]" style={{ borderRadius: 9999 }}>Isi Realisasi</button>}
 {(p.createdBy === currentUser.id || currentUser.role === "admin") && (
 <button onClick={() => { setEditingPlan(p); setPlanForm({ title: p.title, target: p.target, skpPeriodId: p.skpPeriodId }); setShowPlanModal(true); }} className="px-4 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[12px] text-[#78716c] hover:bg-[#fafaf9]" style={{ borderRadius: 9999 }}>Edit</button>
 )}
 </div>
 </div>
 );
}
