"use client";
import { useEffect, useRef, useState, CSSProperties } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useSKP } from "@/lib/store";
import type { Role } from "@/lib/types";

// Palet varian per role/tipe — tetap di dalam token DESIGN.md (teal, navy, sage, rose)
// supaya tampilan nggak monoton satu warna, tapi tiap kategori punya identitas sendiri.
const TONE = {
  teal: { bg: "#e4f0f1", fg: "#1c5d5f", dot: "#1c5d5f" },
  navy: { bg: "#e6ebf2", fg: "#16325a", dot: "#16325a" },
  sage: { bg: "#e0f2ee", fg: "#0e4749", dot: "#65b8a2" },
  rose: { bg: "#f2e8e2", fg: "#8a5a3d", dot: "#d6aec1" },
} as const;
type Tone = keyof typeof TONE;

const roleTone: Record<Role, Tone> = { direktur: "teal", supervisor: "navy", staff: "sage", admin: "rose" };

// Warna fungsional untuk ikon & tombol — biru (info), kuning (proses/perhatian),
// hijau (selesai/berhasil), merah (rendah/perlu tindakan). Dipakai terpisah dari
// tone identitas role di atas, supaya makna warnanya konsisten dengan fungsinya.
const FN = {
  blue: { bg: "#e3eef6", fg: "#2e6f9e", border: "#a9c9e0" },
  amber: { bg: "#fbf0d0", fg: "#96720a", border: "#e3c15e" },
  green: { bg: "#e1f3ea", fg: "#1f8a5f", border: "#8bcdad" },
  red: { bg: "#fbe4e1", fg: "#c0392b", border: "#e8a89f" },
} as const;
function gaugeFn(pct: number) { return pct >= 70 ? FN.green : pct >= 40 ? FN.amber : FN.red; }

// Font biasa (bukan serif editorial / mono uppercase) khusus halaman Dashboard.
// Cuma berlaku di sini — tidak menyentuh app/layout.tsx atau globals.css punya tim.
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
  const fn = gaugeFn(pct); // merah <40%, kuning 40–69%, hijau ≥70% — feedback fungsional capaian
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

function Tile({ eyebrow, value, sub, mono, fn }: { eyebrow: string; value: string | number; sub: string; mono: string; fn: keyof typeof FN }) {
  const t = FN[fn];
  return (
    <div className="p-5 border bg-white flex items-start gap-4" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: t.bg, color: t.fg }}>{mono}</div>
      <div className="min-w-0">
        <div className="text-xs text-[#283338]/60">{eyebrow}</div>
        <div className="text-[28px] font-bold leading-none mt-1.5">{value}</div>
        <div className="text-[11px] text-[#283338]/55 mt-1.5 leading-snug">{sub}</div>
      </div>
    </div>
  );
}

// Dropdown custom — pengganti <select> native, biar panel opsinya konsisten
// dengan sistem desain sendiri (bukan warna gelap bawaan OS/browser).
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
  const { currentUser, employees, plans, realizations, periods, dbLoaded, visiblePlans, getSubordinates } = useSKP();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  if (!currentUser) return null;

  if (!dbLoaded) {
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

  const role = currentUser.role;

  const scopeEmployees =
    role === "admin" || role === "direktur" ? employees :
    role === "supervisor" ? [currentUser, ...getSubordinates(currentUser.id)] :
    [currentUser];

  const scopeLabel =
    role === "admin" || role === "direktur" ? "Seluruh organisasi" :
    role === "supervisor" ? "Anda & tim Anda" : "Ringkasan Anda";

  const periodAktif = periods[0];
  const effectivePeriodId = selectedPeriodId || periodAktif?.id || "";
  const showAllPeriods = effectivePeriodId === "__all__";
  const scopedPlans = visiblePlans.filter(p => showAllPeriods || !effectivePeriodId || p.skpPeriodId === effectivePeriodId);
  const scopedPlanIds = new Set(scopedPlans.map(p => p.id));
  const scopedRealizations = realizations.filter(r => scopedPlanIds.has(r.planId));

  const totalPegawai = scopeEmployees.length;
  const totalSupervisor = scopeEmployees.filter(e => e.role === "supervisor").length;
  const totalStaff = scopeEmployees.filter(e => e.role === "staff").length;
  const totalDirektur = scopeEmployees.filter(e => e.role === "direktur").length;
  const totalAdmin = scopeEmployees.filter(e => e.role === "admin").length;
  const totalRencana = scopedPlans.length;
  const selesaiCount = scopedPlans.filter(p => p.progress >= 100).length;
  const belumMulaiCount = scopedPlans.filter(p => p.progress === 0).length;
  const berjalanCount = totalRencana - selesaiCount - belumMulaiCount;
  const orgProgress = Math.round(scopedPlans.reduce((a, b) => a + b.progress, 0) / (scopedPlans.length || 1));
  const totalRealisasi = scopedRealizations.length;
  const avgRealisasiPerRencana = totalRencana ? (totalRealisasi / totalRencana).toFixed(1) : "0";

  const perRole = (["direktur", "supervisor", "staff", "admin"] as const).map(r => {
    const emps = scopeEmployees.filter(e => e.role === r);
    const pls = scopedPlans.filter(p => emps.some(e => e.id === p.assignedTo));
    const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
    return { role: r, emps: emps.length, pls: pls.length, avg };
  }).filter(j => j.emps > 0);

  const perPegawai = [...scopeEmployees]
    .map(e => {
      const pls = scopedPlans.filter(p => p.assignedTo === e.id);
      const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
      const reals = scopedRealizations.filter(r => {
        const pl = scopedPlans.find(p => p.id === r.planId);
        return pl?.assignedTo === e.id;
      }).length;
      return { e, pls: pls.length, avg, reals };
    })
    .sort((a, b) => b.avg - a.avg);

  const showBreakdown = scopeEmployees.length > 1;

  return (
    <div className={`${dashFont.variable} space-y-6`} style={dashFontScope}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#283338]/60">Dashboard • <span className="text-[#1c5d5f] font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</span> • {currentUser.name.split(",")[0]}</p>
          <h2 className="text-[28px] font-bold mt-0.5">Statistik</h2>
          <p className="text-sm text-[#283338]/60 mt-0.5">{scopeLabel} — ringkasan angka, tanpa daftar tugas.</p>
        </div>
        <PillDropdown
          value={effectivePeriodId}
          onChange={v => setSelectedPeriodId(v)}
          tone={FN.blue}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          options={[...periods.map(p => ({ value: p.id, label: p.name })), { value: "__all__", label: "Semua periode" }]}
        />
      </div>

      {/* Hero — gauge capaian (warna dinamis: merah/kuning/hijau sesuai persentase) */}
      <div className="rounded-[12px] border border-[#a2cbcd] bg-[#e4f0f1] p-6 flex flex-wrap items-center gap-6">
        <Gauge value={orgProgress} />
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm font-semibold">
            {showAllPeriods ? "Semua periode" : periods.find(p => p.id === effectivePeriodId)?.name ?? ""}
          </div>
          <div className="text-xs text-[#283338]/60 mt-1">
            {showAllPeriods ? "Gabungan seluruh periode SKP" : periods.find(p => p.id === effectivePeriodId) ? `${periods.find(p => p.id === effectivePeriodId)!.startDate} → ${periods.find(p => p.id === effectivePeriodId)!.endDate}` : "—"}
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

      {/* Tiles — warna fungsional: biru=info, kuning=proses, hijau=selesai */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile fn="blue" mono="PGW" eyebrow="Pegawai" value={totalPegawai} sub={`${totalDirektur} Direktur · ${totalSupervisor} Supervisor · ${totalStaff} Staff · ${totalAdmin} Admin`} />
        <Tile fn="amber" mono="RCN" eyebrow="Rencana" value={totalRencana} sub={`${berjalanCount} berjalan · ${belumMulaiCount} belum mulai`} />
        <Tile fn="green" mono="RLS" eyebrow="Realisasi" value={totalRealisasi} sub={`${selesaiCount} rencana selesai · rata-rata ${avgRealisasiPerRencana} entri`} />
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1", borderTop: "3px solid #a2cbcd" }}>
            <div className="text-sm font-semibold mb-3">Per role</div>
            <div className="space-y-3">
              {perRole.map(j => {
                const t = TONE[roleTone[j.role]];
                return (
                  <div key={j.role} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.dot }} />
                    <span className="text-xs font-medium capitalize w-20 shrink-0">{j.role}</span>
                    <Bar pct={j.avg} color={t.fg} />
                    <span className="text-xs font-bold w-9 text-right shrink-0" style={{ color: t.fg }}>{j.avg}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1", borderTop: "3px solid #d6aec1" }}>
            <div className="text-sm font-semibold mb-3">{role === "supervisor" ? "Tim Anda" : "Per pegawai"}</div>
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