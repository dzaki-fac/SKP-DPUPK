"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";
import type { Role } from "@/lib/types";

// Seline palette — only stone neutrals + cyan
// No green/amber/red accents; progress states use cyan vs neutral steps
const STONE = {
 canvas: "#fafaf9",
 border: "#e8e6e5",
 muted: "#d6d3d1",
 ash: "#a8a29e",
 warm: "#78716c",
 ink: "#0c0a09",
 soot: "#1c1917",
 cyan: "#3ba6f1",
 cyanEdge: "#3398e1",
 sky: "#c1e1f7",
} as const;

// For per-role dots, keep monochrome with subtle cyan accent for highest level
const TONE: Record<string, { dot: string; fg: string }> = {
 pimpinan_1: { dot: STONE.soot, fg: STONE.soot },
 pimpinan_2: { dot: STONE.ink, fg: STONE.ink },
 pimpinan_3: { dot: STONE.warm, fg: STONE.warm },
 staf: { dot: STONE.ash, fg: STONE.ash },
 admin: { dot: STONE.cyan, fg: STONE.cyan },
};
const roleTone: Record<Role, keyof typeof TONE> = { pimpinan_1: "pimpinan_1", pimpinan_2: "pimpinan_2", pimpinan_3: "pimpinan_3", staf: "staf", admin: "admin"};

// Gauge uses cyan for all levels; difference is opacity via track vs fill
function gaugeColor(pct: number) {
 if (pct >= 70) return STONE.cyan;
 if (pct >= 40) return STONE.ink;
 return STONE.ash;
}

function Gauge({ value, size = 108, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
 const r = (size - stroke) / 2;
 const c = 2 * Math.PI * r;
 const pct = Math.max(0, Math.min(100, value));
 const offset = c * (1 - pct / 100);
 const col = gaugeColor(pct);
 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STONE.border} strokeWidth={stroke} />
 <circle
 cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
 strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
 transform={`rotate(-90 ${size / 2} ${size / 2})`}
 style={{ transition: " stroke-dashoffset 0.6s ease, stroke 0.3s ease"}}
 />
 <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontWeight={400} fontFamily="var(--font-roobert)" fontSize={size * 0.25} fill={STONE.ink}>{pct}%</text>
 <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-inter)" fontSize={size * 0.09} fill={STONE.warm} letterSpacing="0.04em">CAPAIAN</text>
 </svg>
 );
}

function Bar({ pct, color }: { pct: number; color?: string }) {
 const c = color ?? (pct >= 70 ? STONE.cyan : pct >= 40 ? STONE.ink : STONE.muted);
 return (
 <div className="h-1.5 flex-1 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]">
 <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: c, transition: " width 0.5s ease"}} />
 </div>
 );
}

function Tile({ eyebrow, value, sub }: { eyebrow: string; value: string | number; sub: string }) {
 return (
 <div className="seline-card">
 <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#78716c]">{eyebrow}</div>
 <div className="text-[32px] font-normal leading-none mt-2 tracking-[-0.8px] text-[#0c0a09]" style={{ fontFamily: "var(--font-roobert)"}}>{value}</div>
 <div className="text-[12px] leading-[1.64] text-[#78716c] mt-1.5">{sub}</div>
 </div>
 );
}

function PillDropdown({
 icon, value, options, onChange,
}: {
 icon: React.ReactNode;
 value: string;
 options: { value: string; label: string }[];
 onChange: (v: string) => void;
}) {
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);
 const current = options.find(o => o.value === value);

 useEffect(() => {
 const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
 document.addEventListener("mousedown", h);
 return () => document.removeEventListener("mousedown", h);
 }, []);

 return (
 <div className="relative" ref={ref}>
 <button
 type="button"
 onClick={() => setOpen(v => !v)}
 className="text-[14px] pl-9 pr-8 py-2 cursor-pointer font-normal bg-white relative border border-[#e8e6e5] text-[#0c0a09] hover:bg-[#fafaf9]"
 style={{ borderRadius: 9999 }}
 >
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716c]">{icon}</span>
 {current?.label ?? "Pilih"}
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e]">
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transform: open ? " rotate(180deg)": undefined, transition: " transform 0.15s ease"}}>
 <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 </span>
 </button>

 {open && (
 <div className="absolute right-0 top-full mt-2 min-w-[190px] bg-white border border-[#e8e6e5] py-1.5 z-20" style={{ borderRadius: 10, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px"}}>
 {options.map(o => {
 const active = o.value === value;
 return (
 <button
 key={o.value}
 type="button"
 onClick={() => { onChange(o.value); setOpen(false); }}
 className="w-full text-left px-3.5 py-2 text-[14px] flex items-center justify-between gap-2 mx-1"
 style={{
 borderRadius: 8,
 width: " calc(100% - 8px)",
 background: active ? "#fafaf9": "transparent",
 color: active ? STONE.ink : STONE.warm,
 fontWeight: active ? 500 : 400,
 border: active ? `1px solid ${STONE.border}` : "1px solid transparent",
 }}
 onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#fafaf9"; }}
 onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
 >
 {o.label}
 {active && <span className="w-1.5 h-1.5 rounded-full bg-[#3ba6f1]"/>}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
}

export default function DashboardPage() {
 const { currentUser, employees, plans, realizations, periods, dbLoaded, visiblePlans, getSubordinates } = useSKP();
 const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

 if (!currentUser) return null;

 if (!dbLoaded) {
 return (
 <div className="space-y-6">
 <div>
 <p className="eyebrow">DASHBOARD</p>
 <h2 className="heading-sm">Statistik</h2>
 </div>
 <div className="seline-card animate-pulse flex items-center gap-6">
 <div className="w-[108px] h-[108px] rounded-full bg-[#e8e6e5]"/>
 <div className="flex-1 space-y-2">
 <div className="h-3 w-32 bg-[#e8e6e5] rounded"/>
 <div className="h-3 w-48 bg-[#e8e6e5] rounded"/>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {[0, 1, 2].map(i => (
 <div key={i} className="seline-card animate-pulse h-24"/>
 ))}
 </div>
 </div>
 );
 }

 const role = currentUser.role;

 const scopeEmployees =
 role === "admin"|| role === "pimpinan_1"? employees :
 role === "pimpinan_2"|| role === "pimpinan_3"? [currentUser, ...getSubordinates(currentUser.id)] :
 [currentUser];

 const scopeLabel =
 role === "admin"|| role === "pimpinan_1"? " Seluruh organisasi":
 role === "pimpinan_2"? " Anda & tim Anda":
 role === "pimpinan_3"? " Anda & staf binaan": " Ringkasan Anda";

 const periodAktif = periods[0];
 const effectivePeriodId = selectedPeriodId || periodAktif?.id || "";
 const showAllPeriods = effectivePeriodId === "__all__";
 const scopedPlans = visiblePlans.filter(p => showAllPeriods || !effectivePeriodId || p.skpPeriodId === effectivePeriodId);
 const scopedPlanIds = new Set(scopedPlans.map(p => p.id));
 const scopedRealizations = realizations.filter(r => scopedPlanIds.has(r.planId));

 const totalPegawai = scopeEmployees.length;
 const totalPimpinan2 = scopeEmployees.filter(e => e.role === "pimpinan_2").length;
 const totalPimpinan3 = scopeEmployees.filter(e => e.role === "pimpinan_3").length;
 const totalStaff = scopeEmployees.filter(e => e.role === "staf").length;
 const totalPimpinan1 = scopeEmployees.filter(e => e.role === "pimpinan_1").length;
 const totalAdmin = scopeEmployees.filter(e => e.role === "admin").length;
 const totalRencana = scopedPlans.length;
 const selesaiCount = scopedPlans.filter(p => p.progress >= 100).length;
 const belumMulaiCount = scopedPlans.filter(p => p.progress === 0).length;
 const berjalanCount = totalRencana - selesaiCount - belumMulaiCount;
 const orgProgress = Math.round(scopedPlans.reduce((a, b) => a + b.progress, 0) / (scopedPlans.length || 1));
 const totalRealisasi = scopedRealizations.length;
 const avgRealisasiPerRencana = totalRencana ? (totalRealisasi / totalRencana).toFixed(1) : "0";

 const perRole = (["pimpinan_1","pimpinan_2","pimpinan_3","staf","admin"] as const).map(r => {
 const emps = scopeEmployees.filter(e => e.role === r);
 const pls = scopedPlans.filter(p => emps.some(e => e.id === p.assignedTo));
 const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
 return { role: r, emps: emps.length, pls: pls.length, avg };
 }).filter(j => j.emps > 0);

 const perPegawai = [...scopeEmployees]
 .map(e => {
 const pls = scopedPlans.filter(p => p.assignedTo === e.id);
 const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
 return { e, pls: pls.length, avg };
 })
 .sort((a, b) => b.avg - a.avg);

 const showBreakdown = scopeEmployees.length > 1;

 const myInvolved = (() => {
 const map = new Map<string, { plan: typeof plans[number]; roles: Set<string> }>();
 for (const p of plans) {
 if (p.assignedTo === currentUser.id) {
 const entry = map.get(p.id) ?? { plan: p, roles: new Set<string>() };
 entry.roles.add("Pelaksana");
 map.set(p.id, entry);
 }
 }
 for (const r of realizations) {
 const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
 if (!parts) continue;
 const myPart = parts.find(pp => pp.employeeId === currentUser.id);
 if (myPart) {
 const plan = plans.find(p => p.id === r.planId);
 if (!plan) continue;
 const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
 entry.roles.add(myPart.role);
 map.set(plan.id, entry);
 }
 }
 for (const r of realizations) {
 if (r.uploadedBy === currentUser.id) {
 const plan = plans.find(p => p.id === r.planId);
 if (!plan || plan.assignedTo === currentUser.id) continue;
 const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
 const already = parts?.some(p=>p.employeeId===currentUser.id);
 if (already) continue;
 const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
 entry.roles.add("Kontributor");
 map.set(plan.id, entry);
 }
 }
 return [...map.values()].sort((a,b)=> a.plan.title.localeCompare(b.plan.title));
 })();

 return (
 <div className="space-y-6">
 {/* Header — Seline eyebrow + display ghost */}
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="eyebrow">DASHBOARD • <span className="text-[#3ba6f1]">{ROLE_SHORT[role]}</span> • {currentUser.name.split(",")[0]}</p>
 <h2 className="heading-sm mt-1">Statistik</h2>
 </div>
 <PillDropdown
 value={effectivePeriodId}
 onChange={v => setSelectedPeriodId(v)}
 icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>}
 options={[...periods.map(p => ({ value: p.id, label: p.name })), { value: "__all__", label: " Semua periode"}]}
 />
 </div>

 {/* Hero progress — Seline floating preview style but muted */}
 <div className="rounded-[10px] border border-[#e8e6e5] bg-white p-6 flex flex-wrap items-center gap-6" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px"}}>
 <Gauge value={orgProgress} />
 <div className="flex-1 min-w-[200px]">
 <div className="text-[14px] font-medium text-[#0c0a09]">
 {showAllPeriods ? " Semua periode": periods.find(p => p.id === effectivePeriodId)?.name ?? ""}
 </div>
 <div className="text-[12px] text-[#78716c] mt-1">
 {showAllPeriods ? " Gabungan seluruh periode SKP": periods.find(p => p.id === effectivePeriodId) ? `${periods.find(p => p.id === effectivePeriodId)!.startDate} → ${periods.find(p => p.id === effectivePeriodId)!.endDate}` : "—"}
 </div>
 <div className="mt-4 flex items-center gap-3">
 <Bar pct={totalRencana ? (selesaiCount / totalRencana) * 100 : 0} />
 <span className="text-[12px] font-medium whitespace-nowrap text-[#0c0a09]">{selesaiCount} selesai</span>
 </div>
 <div className="mt-2 flex flex-wrap gap-2">
 <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#c1e1f7] text-[#0c0a09] border border-[#e8e6e5]">● {selesaiCount} selesai</span>
 <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-white border border-[#e8e6e5] text-[#78716c]">● {berjalanCount} berjalan</span>
 {belumMulaiCount > 0 && (
 <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#a8a29e]">● {belumMulaiCount} belum mulai</span>
 )}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Tile eyebrow="Pegawai" value={totalPegawai} sub={`${totalPimpinan1} Direktur · ${totalPimpinan2} Pimpinan 2 · ${totalPimpinan3} Pimpinan 3 · ${totalStaff} Staf · ${totalAdmin} Admin`} />
 <Tile eyebrow="Rencana" value={totalRencana} sub={`${berjalanCount} berjalan · ${belumMulaiCount} belum mulai`} />
 <Tile eyebrow="Realisasi" value={totalRealisasi} sub={`${selesaiCount} rencana selesai · rata-rata ${avgRealisasiPerRencana} entri`} />
 </div>

 <div className="seline-card">
 <div className="flex items-center justify-between gap-3">
 <div>
 <div className="eyebrow">RENCANA SAYA TERLIBAT</div>
 <div className="subheading mt-1 leading-tight">Saya terlibat di {myInvolved.length} rencana sebagai {myInvolved.length===0 ? "—": [...new Set(myInvolved.flatMap(x=>[...x.roles]))].join(", ")}</div>
 </div>
 <Link href="/rencana" className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[12px] font-medium text-[#0c0a09] hover:bg-[#fafaf9]" style={{ borderRadius: 9999 }}>Lihat Rencana →</Link>
 </div>
 {myInvolved.length === 0 ? (
 <div className="mt-3 p-4 rounded-[10px] bg-[#fafaf9] border border-dashed border-[#d6d3d1] text-center">
 <div className="text-[14px] text-[#78716c]">Belum terlibat di rencana manapun</div>
 </div>
 ) : (
 <div className="mt-3 overflow-x-auto">
 <table className="w-full text-[14px]">
 <thead className="text-[12px] tracking-[0.04em] uppercase text-[#a8a29e] border-b border-[#e8e6e5]">
 <tr><th className="text-left py-2 font-semibold">Rencana</th><th className="text-left py-2 font-semibold">Peran Saya</th><th className="text-center py-2 font-semibold">Target</th><th className="text-left py-2 font-semibold">Progress</th></tr>
 </thead>
 <tbody>
 {myInvolved.map(({ plan, roles }) => {
 const period = periods.find(p=>p.id===plan.skpPeriodId);
 const isPelaksana = roles.has("Pelaksana");
 return (
 <tr key={plan.id} className="border-b border-[#e8e6e5]/60 hover:bg-[#fafaf9]/80">
 <td className="py-2.5 pr-2">
 <Link href={`/rencana/${plan.id}`} className="font-medium text-[#0c0a09] hover:text-[#3ba6f1] hover:underline underline-offset-2 line-clamp-2 leading-snug">{plan.title}</Link>
  <div className="text-[12px] text-[#a8a29e] truncate">{period?.name ?? plan.skpPeriodId}{plan.plannedDate ? ` • ${plan.plannedDate}` : ""}</div>
 </td>
 <td className="py-2.5">
 <div className="flex flex-wrap gap-1">
 {[...roles].map(r=>(
 <span key={r} className={`inline-flex px-2 py-0.5 rounded-full text-[12px] border ${r==="Pelaksana"? " bg-[#0c0a09] text-white border-[#0c0a09]": r==="Kontributor"? " bg-[#c1e1f7] text-[#0c0a09] border-[#e8e6e5]": " bg-white text-[#78716c] border-[#e8e6e5]"}`} style={{ borderRadius: 9999 }}>{r}</span>
 ))}
 </div>
 </td>
  <td className="py-2.5 text-center text-[12px] font-medium text-[#0c0a09]">{plan.target}</td>
 <td className="py-2.5">
 <div className="flex items-center gap-2">
 <span className="w-14 h-1.5 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><span className="block h-full bg-[#3ba6f1]" style={{ width: `${Math.min(plan.progress,100)}%` }} /></span>
 <span className="text-[12px] font-medium text-[#0c0a09]">{plan.progress}%</span>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {showBreakdown && (
 <div className="grid lg:grid-cols-2 gap-4">
 <div className="seline-card">
 <div className="text-[14px] font-medium text-[#0c0a09] mb-3">Per role</div>
 <div className="space-y-3">
 {perRole.map(j => {
 const t = TONE[roleTone[j.role]];
 return (
 <div key={j.role} className="flex items-center gap-3">
 <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.dot }} />
 <span className="text-[12px] font-medium w-28 shrink-0 text-[#0c0a09]">{ROLE_SHORT[j.role]}</span>
 <Bar pct={j.avg} color={t.fg} />
 <span className="text-[12px] font-medium w-9 text-right shrink-0 text-[#0c0a09]">{j.avg}%</span>
 </div>
 );
 })}
 </div>
 </div>
 <div className="seline-card">
 <div className="text-[14px] font-medium text-[#0c0a09] mb-3">{role === "pimpinan_2"|| role === "pimpinan_3"? " Tim Anda": " Per pegawai"}</div>
 <div className="space-y-3">
 {perPegawai.slice(0, 8).map(r => {
 const t = TONE[roleTone[r.e.role]];
 return (
 <div key={r.e.id} className="flex items-center gap-3">
 <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 text-white" style={{ background: t.fg }}>{r.e.avatar}</span>
 <span className="text-[12px] font-medium truncate w-24 shrink-0 text-[#0c0a09]">{r.e.name.split(",")[0]}</span>
 <Bar pct={r.avg} color={t.fg} />
 <span className="text-[12px] font-medium w-9 text-right shrink-0 text-[#0c0a09]">{r.avg}%</span>
 </div>
 );
 })}
 </div>
 {perPegawai.length > 8 && <div className="text-[12px] text-[#a8a29e] mt-3 text-center">+{perPegawai.length - 8} pegawai lainnya</div>}
 </div>
 </div>
 )}
 </div>
 );
}
