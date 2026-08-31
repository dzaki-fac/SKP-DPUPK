"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";
import type { Employee, Role } from "@/lib/types";

const TONE = {
  teal: { bg: "#e4f0f1", fg: "#1c5d5f", dot: "#1c5d5f" },
  navy: { bg: "#e6ebf2", fg: "#16325a", dot: "#16325a" },
  sage: { bg: "#e0f2ee", fg: "#0e4749", dot: "#65b8a2" },
  rose: { bg: "#f2e8e2", fg: "#8a5a3d", dot: "#d6aec1" },
} as const;
type Tone = keyof typeof TONE;

const roleTone: Record<Role, Tone> = { pimpinan_1: "teal", pimpinan_2: "navy", pimpinan_3: "sage", staf: "sage", admin: "rose" };

const FN = {
  blue: { bg: "#e3eef6", fg: "#2e6f9e", border: "#a9c9e0" },
  amber: { bg: "#fef3c7", fg: "#d97706", border: "#fcd34d" },
  green: { bg: "#dcfce7", fg: "#10b981", border: "#6ee7b7" },
  red: { bg: "#ffe4e6", fg: "#f43f5e", border: "#fda4af" },
} as const;
function gaugeFn(pct: number) { return pct >= 70 ? FN.green : pct >= 40 ? FN.amber : FN.red; }

const dashFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--dash-font", display: "swap" });
const dashFontScope: CSSProperties = {
  ["--font-p22-mackinac-pro" as any]: "var(--dash-font)",
  ["--font-ibm-plex-mono" as any]: "var(--dash-font)",
  ["--font-sofia-pro" as any]: "var(--dash-font)",
};

function Gauge({ value, size = 108, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  const fn = gaugeFn(pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4f0f1" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fn.fg} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
      />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontWeight={700} fontFamily="var(--dash-font)" fontSize={size * 0.24} fill="#283338">{pct}%</text>
      <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--dash-font)" fontSize={size * 0.09} fill="#283338" opacity={0.5}>Capaian</text>
    </svg>
  );
}

function Bar({ pct, color }: { pct: number; color?: string }) {
  const c = color ?? (pct >= 70 ? "#1c5d5f" : pct >= 40 ? "#16325a" : "#a2cbcd");
  return (
    <div className="h-1.5 flex-1 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]">
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: c, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Tile({ eyebrow, value, sub, fn }: { eyebrow: string; value: string | number; sub: string; fn: keyof typeof FN }) {
  const t = FN[fn];
  return (
    <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: t.fg }}>{eyebrow}</div>
      <div className="text-[28px] font-bold leading-none mt-2 tracking-tight" style={{ color: "#16325a" }}>{value}</div>
      <div className="text-[12px] text-[#283338]/60 mt-1.5 leading-snug">{sub}</div>
    </div>
  );
}

function PillDropdown({
  icon, value, options, tone, onChange,
}: {
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  tone: { bg: string; fg: string; border: string };
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
        className="text-sm pl-9 pr-8 py-2.5 cursor-pointer font-medium bg-white relative"
        style={{ borderRadius: 48, border: `1px solid ${tone.border}`, color: tone.fg }}
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        {current?.label ?? "Pilih"}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s ease" }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[190px] bg-white border border-[#e4f0f1] py-1.5 z-20"
          style={{ borderRadius: 14, boxShadow: "0 8px 24px rgba(35,30,33,0.12)" }}
        >
          {options.map(o => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-sm flex items-center justify-between gap-2 mx-1"
                style={{
                  borderRadius: 10,
                  width: "calc(100% - 8px)",
                  background: active ? tone.bg : "transparent",
                  color: active ? tone.fg : "#283338",
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f2f8f7"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}
                {active && <span style={{ color: tone.fg }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, employees, plans, realizations, periods, dbLoaded, visiblePlans, getSubordinates } = useSKP() as any;
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  if (!currentUser) return null;

  const dbReady = (dbLoaded as boolean | undefined) ?? true;
  if (!dbReady) {
    return (
      <div className={`${dashFont.variable} space-y-6`} style={dashFontScope}>
        <div>
          <p className="text-sm text-[#283338]/60">Dashboard</p>
          <h2 className="text-[28px] font-bold">Statistik</h2>
        </div>
        <div className="p-6 border bg-white animate-pulse flex items-center gap-6" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="w-[108px] h-[108px] rounded-full bg-[#e4f0f1]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-[#e4f0f1] rounded" />
            <div className="h-3 w-48 bg-[#e4f0f1] rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="p-5 border bg-white animate-pulse h-24" style={{ borderRadius: 12, borderColor: "#e4f0f1" }} />
          ))}
        </div>
      </div>
    );
  }

  const role: Role = currentUser.role;

  const scopeEmployees: Employee[] =
    role === "admin" || role === "pimpinan_1" ? employees :
    role === "pimpinan_2" || role === "pimpinan_3" ? [currentUser, ...getSubordinates(currentUser.id)] :
    [currentUser];

  const scopeLabel =
    role === "admin" || role === "pimpinan_1" ? "Seluruh organisasi" :
    role === "pimpinan_2" || role === "pimpinan_3" ? "Anda & tim Anda" : "Ringkasan Anda";

  const countByNip = (list: Employee[], filter: (e: Employee) => boolean) => {
    const seen = new Set<string>();
    list.forEach(e => { if (!filter(e)) return; const k = e.employeeNumber || e.id; if (!seen.has(k)) seen.add(k); });
    return seen.size;
  };

  const periodAktif = periods[0];
  const effectivePeriodId = selectedPeriodId || periodAktif?.id || "";
  const showAllPeriods = effectivePeriodId === "__all__";
  const scopedPlans = visiblePlans.filter((p: any) => showAllPeriods || !effectivePeriodId || p.skpPeriodId === effectivePeriodId);
  const scopedPlanIds = new Set(scopedPlans.map((p: any) => p.id));
  const scopedRealizations = realizations.filter((r: any) => scopedPlanIds.has(r.planId));

  const totalPegawai = countByNip(scopeEmployees, () => true);
  const totalPimpinan1 = countByNip(scopeEmployees, e => e.role === "pimpinan_1");
  const totalPimpinan2 = countByNip(scopeEmployees, e => e.role === "pimpinan_2");
  const totalPimpinan3 = countByNip(scopeEmployees, e => e.role === "pimpinan_3");
  const totalStaff = countByNip(scopeEmployees, e => e.role === "staf");
  const totalAdmin = countByNip(scopeEmployees, e => e.role === "admin");
  const totalRencana = scopedPlans.length;
  const selesaiCount = scopedPlans.filter((p: any) => p.progress >= 100).length;
  const belumMulaiCount = scopedPlans.filter((p: any) => p.progress === 0).length;
  const berjalanCount = totalRencana - selesaiCount - belumMulaiCount;
  const orgProgress = Math.round(scopedPlans.reduce((a: number, b: any) => a + b.progress, 0) / (scopedPlans.length || 1));
  const totalRealisasi = scopedRealizations.length;
  const avgRealisasiPerRencana = totalRencana ? (totalRealisasi / totalRencana).toFixed(1) : "0";

  const perRole = (["pimpinan_1","pimpinan_2","pimpinan_3","staf","admin"] as const).map(r => {
    const empsDistinct = countByNip(scopeEmployees, e => e.role === r);
    const emps = scopeEmployees.filter((e: Employee) => e.role === r);
    const pls = scopedPlans.filter((p: any) => emps.some(e => e.id === p.assignedTo));
    const avg = pls.length ? Math.round(pls.reduce((a: number, b: any) => a + b.progress, 0) / pls.length) : 0;
    return { role: r, emps: empsDistinct, pls: pls.length, avg };
  }).filter(j => j.emps > 0);

  const perPegawai = [...scopeEmployees]
    .map(e => {
      const pls = scopedPlans.filter((p: any) => p.assignedTo === e.id);
      const avg = pls.length ? Math.round(pls.reduce((a: number, b: any) => a + b.progress, 0) / pls.length) : 0;
      const reals = scopedRealizations.filter((r: any) => {
        const pl = scopedPlans.find((p: any) => p.id === r.planId);
        return pl?.assignedTo === e.id;
      }).length;
      return { e, pls: pls.length, avg, reals };
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
      const myPart = parts.find((pp: any) => pp.employeeId === currentUser.id);
      if (myPart) {
        const plan = plans.find((p: any) => p.id === r.planId);
        if (!plan) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add(myPart.role);
        map.set(plan.id, entry);
      }
    }
    for (const r of realizations) {
      if ((r as any).uploadedBy === currentUser.id) {
        const plan = plans.find((p: any) => p.id === (r as any).planId);
        if (!plan || plan.assignedTo === currentUser.id) continue;
        const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
        const already = parts?.some((p: any)=>p.employeeId===currentUser.id);
        if (already) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add("Kontributor");
        map.set(plan.id, entry);
      }
    }
    return [...map.values()].sort((a,b)=> a.plan.title.localeCompare(b.plan.title));
  })();

  return (
    <div className={`${dashFont.variable} space-y-6`} style={dashFontScope}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#283338]/60">Dashboard • <span className="text-[#1c5d5f] font-medium">{ROLE_SHORT[role]}</span> • {currentUser.name.split(",")[0]}</p>
          <h2 className="text-[28px] font-bold mt-0.5">Statistik</h2>
          <p className="text-sm text-[#283338]/60 mt-0.5">{scopeLabel} — ringkasan angka, tanpa daftar tugas.</p>
        </div>
        <PillDropdown
          value={effectivePeriodId}
          onChange={v => setSelectedPeriodId(v)}
          tone={FN.blue}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          options={[...periods.map((p: any) => ({ value: p.id, label: p.name })), { value: "__all__", label: "Semua periode" }]}
        />
      </div>

      <div className="rounded-[12px] border border-[#a2cbcd] bg-[#e4f0f1] p-6 flex flex-wrap items-center gap-6">
        <Gauge value={orgProgress} />
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm font-semibold">
            {showAllPeriods ? "Semua periode" : periods.find((p: any) => p.id === effectivePeriodId)?.name ?? ""}
          </div>
          <div className="text-xs text-[#283338]/60 mt-1">
            {showAllPeriods ? "Gabungan seluruh periode SKP" : periods.find((p: any) => p.id === effectivePeriodId) ? `${periods.find((p: any) => p.id === effectivePeriodId)!.startDate} → ${periods.find((p: any) => p.id === effectivePeriodId)!.endDate}` : "—"}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Bar pct={totalRencana ? (selesaiCount / totalRencana) * 100 : 0} color={FN.green.fg} />
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: FN.green.fg }}>{selesaiCount} selesai</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: FN.green.bg, color: FN.green.fg }}>● {selesaiCount} selesai</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: FN.blue.bg, color: FN.blue.fg }}>● {berjalanCount} berjalan</span>
            {totalRencana - selesaiCount - berjalanCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: FN.red.bg, color: FN.red.fg }}>● {belumMulaiCount} belum mulai</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile fn="blue" eyebrow="Pegawai" value={totalPegawai} sub={`${totalPimpinan1} Direktur · ${totalPimpinan2} Pimpinan 2 · ${totalPimpinan3} Pimpinan 3 · ${totalStaff} Staf · ${totalAdmin} Admin`} />
        <Tile fn="amber" eyebrow="Rencana" value={totalRencana} sub={`${berjalanCount} berjalan · ${belumMulaiCount} belum mulai`} />
        <Tile fn="green" eyebrow="Realisasi" value={totalRealisasi} sub={`${selesaiCount} rencana selesai · rata-rata ${avgRealisasiPerRencana} entri`} />
      </div>

      <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow text-[11px]">RENCANA SAYA TERLIBAT</div>
            <div className="heading-serif text-[18px] mt-1">Saya terlibat di {myInvolved.length} rencana sebagai {myInvolved.length===0 ? "—" : [...new Set(myInvolved.flatMap(x=>[...x.roles]))].join(", ")}</div>
            <div className="font-mono text-xs text-[#283338]/60 mt-1">Pelaksana + peserta realisasi (peran: Moderator, Narasumber, dll) • klik untuk detail</div>
          </div>
          <Link href="/rencana" className="hidden sm:inline-flex px-3 py-1.5 rounded-full border border-[#e4f0f1] bg-[#f2f8f7] text-xs font-medium hover:bg-white" style={{ borderRadius: 100 }}>Lihat Rencana →</Link>
        </div>
        {myInvolved.length === 0 ? (
          <div className="mt-3 p-4 rounded-xl bg-[#f2f8f7] border border-dashed border-[#a2cbcd] text-center" style={{ borderRadius: 12 }}>
            <div className="text-sm text-[#283338]/70">Belum terlibat di rencana manapun</div>
            <div className="font-mono text-xs text-[#283338]/50 mt-1">Anda akan muncul di sini setelah ditugaskan sebagai Pelaksana atau dipilih sebagai pegawai terlibat di realisasi</div>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60 border-b border-[#e4f0f1]">
                <tr><th className="text-left py-1.5 font-semibold">Rencana</th><th className="text-left py-1.5 font-semibold">Peran Saya</th><th className="text-center py-1.5 font-semibold">Target</th><th className="text-left py-1.5 font-semibold">Progress</th></tr>
              </thead>
              <tbody>
                {myInvolved.map(({ plan, roles }) => {
                  const period = periods.find((p:any)=>p.id===plan.skpPeriodId);
                  const isPelaksana = roles.has("Pelaksana");
                  return (
                    <tr key={plan.id} className="border-b border-[#e4f0f1]/60 hover:bg-[#f2f8f7]/50">
                      <td className="py-2.5 pr-2">
                        <Link href={`/rencana/${plan.id}`} className="font-medium text-[#231e21] hover:text-[#1c5d5f] hover:underline underline-offset-2 line-clamp-2 leading-snug">{plan.title}</Link>
                        <div className="font-mono text-[11px] text-[#283338]/50 truncate">{period?.name ?? plan.skpPeriodId}{plan.plannedDate ? ` • ${plan.plannedDate} ${plan.plannedTime ?? "09:00"} WIB` : ""}</div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {[...roles].map(role=>(
                            <span key={role} className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[11px] border ${role==="Pelaksana" ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : role==="Kontributor" ? "bg-[#e4f0f1] text-[#1c5d5f] border-[#a2cbcd]" : "bg-[#f2e8e2] text-[#4a2c2a] border-[#d6aec1]"}`} style={{ borderRadius: 100 }}>{role}</span>
                          ))}
                        </div>
                        {isPelaksana && <div className="font-mono text-[10px] text-[#283338]/50 mt-0.5">Penanggung jawab</div>}
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs font-bold text-[#1c5d5f]">{plan.customTargets && plan.customTargets.length>0 ? `${plan.customTargets.length} kolom` : plan.target}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-14 h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]"><span className="block h-full bg-[#1c5d5f]" style={{ width: `${Math.min(plan.progress,100)}%` }} /></span>
                          <span className="font-mono text-xs font-bold text-[#1c5d5f]">{plan.progress}%</span>
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
          <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="text-sm font-semibold mb-3">Per role</div>
            <div className="space-y-3">
              {perRole.map(j => {
                const t = TONE[roleTone[j.role]];
                return (
                  <div key={j.role} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.dot }} />
                    <span className="text-xs font-medium w-28 shrink-0">{ROLE_SHORT[j.role]}</span>
                    <Bar pct={j.avg} color={t.fg} />
                    <span className="text-xs font-bold w-9 text-right shrink-0" style={{ color: t.fg }}>{j.avg}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="text-sm font-semibold mb-3">{role === "pimpinan_2" || role === "pimpinan_3" ? "Tim Anda" : "Per pegawai"}</div>
            <div className="space-y-3">
              {perPegawai.slice(0, 8).map(r => {
                const t = TONE[roleTone[r.e.role]];
                return (
                  <div key={r.e.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: t.fg, color: "white" }}>{r.e.avatar}</span>
                    <span className="text-xs font-medium truncate w-24 shrink-0">{r.e.name.split(",")[0]}</span>
                    <Bar pct={r.avg} color={t.fg} />
                    <span className="text-xs font-bold w-9 text-right shrink-0" style={{ color: t.fg }}>{r.avg}%</span>
                  </div>
                );
              })}
            </div>
            {perPegawai.length > 8 && <div className="text-xs text-[#283338]/50 mt-3 text-center">+{perPegawai.length - 8} pegawai lainnya</div>}
          </div>
        </div>
      )}
    </div>
  );
}
