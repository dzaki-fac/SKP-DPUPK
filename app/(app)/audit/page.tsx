"use client";
import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useSKP } from "@/lib/store";

// Font disamakan dengan halaman Dashboard (Plus Jakarta Sans, normal case).
// Cuma berlaku di sini — tidak menyentuh app/layout.tsx atau globals.css punya tim.
const dashFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--dash-font", display: "swap" });
const dashFontScope: CSSProperties = {
  ["--font-p22-mackinac-pro" as any]: "var(--dash-font)",
  ["--font-ibm-plex-mono" as any]: "var(--dash-font)",
  ["--font-sofia-pro" as any]: "var(--dash-font)",
};

const PAGE_SIZE = 20;

const entityLabel: Record<string, string> = {
  performance_plan: "Rencana",
  realization: "Realisasi",
  employee: "Pegawai",
  skp_period: "Periode",
  attachment: "Lampiran",
};

// Tiap tipe entitas & role dapat warna sendiri (masih dalam token DESIGN.md)
// biar daftar riwayat nggak keliatan satu warna semua.
const entityTone: Record<string, { bg: string; fg: string }> = {
  performance_plan: { bg: "#e6ebf2", fg: "#16325a" }, // navy
  realization: { bg: "#e0f2ee", fg: "#0e4749" },      // sage
  employee: { bg: "#f2e8e2", fg: "#8a5a3d" },         // rose
  skp_period: { bg: "#e4f0f1", fg: "#1c5d5f" },       // teal
  attachment: { bg: "#eef0e0", fg: "#5c6b1f" },       // olive-ish, still warm-neutral
};
const defaultTone = { bg: "#f2f8f7", fg: "#283338" };

const roleAvatarColor: Record<string, string> = {
  direktur: "#1c5d5f",
  supervisor: "#16325a",
  staff: "#0e4749",
  admin: "#8a5a3d",
};

// Warna fungsional untuk ikon & tombol kontrol — biru (cari/muat), kuning (filter aksi),
// hijau (filter entitas), merah (reset/hapus filter) — biar tombolnya nggak seragam.
const FN = {
  blue: { bg: "#e3eef6", fg: "#2e6f9e", border: "#a9c9e0" },
  amber: { bg: "#fbf0d0", fg: "#96720a", border: "#e3c15e" },
  green: { bg: "#e1f3ea", fg: "#1f8a5f", border: "#8bcdad" },
  red: { bg: "#fbe4e1", fg: "#c0392b", border: "#e8a89f" },
} as const;

// Dropdown custom — pengganti <select> native. Panel opsi ikut didesain sendiri
// (bukan diserahkan ke browser/OS) supaya warnanya konsisten sama sistem pill di sini.
function PillDropdown({
  icon, label, value, options, tone, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  tone: { bg: string; fg: string; border: string };
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const current = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-sm pl-9 pr-8 py-2.5 cursor-pointer text-white font-medium relative"
        style={{ borderRadius: 48, background: tone.fg, border: `1px solid ${tone.fg}` }}
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        {current?.label ?? label}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s ease" }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 min-w-[190px] bg-white border border-[#e4f0f1] py-1.5 z-20"
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

export default function AuditPage() {
  const { currentUser, logs, employees, getSubordinates, dbLoaded } = useSKP();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("__all__");
  const [entityFilter, setEntityFilter] = useState("__all__");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (!currentUser) return null;

  // 1. Scope per role — konsisten dengan Dashboard
  const role = currentUser.role;
  const scopedUserIds = useMemo(() => {
    if (role === "admin" || role === "direktur") return null; // null = semua, tidak difilter
    if (role === "supervisor") return new Set([currentUser.id, ...getSubordinates(currentUser.id).map(e => e.id)]);
    return new Set([currentUser.id]); // staff: hanya dirinya sendiri
  }, [role, currentUser.id, employees]);

  const scopeLabel =
    role === "admin" || role === "direktur" ? "Seluruh organisasi" :
    role === "supervisor" ? "Anda & tim Anda" : "Aktivitas Anda";

  const scopedLogs = useMemo(
    () => scopedUserIds ? logs.filter(l => scopedUserIds.has(l.userId)) : logs,
    [logs, scopedUserIds]
  );

  // Opsi filter — hanya dari data yang sudah berada dalam lingkup (bukan seluruh log mentah)
  const actionOptions = useMemo(() => Array.from(new Set(scopedLogs.map(l => l.action))).sort(), [scopedLogs]);
  const entityOptions = useMemo(() => Array.from(new Set(scopedLogs.map(l => l.entityType))).sort(), [scopedLogs]);

  // 2 & 3. Filter aksi/entitas + pencarian teks
  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedLogs
      .filter(l => actionFilter === "__all__" || l.action === actionFilter)
      .filter(l => entityFilter === "__all__" || l.entityType === entityFilter)
      .filter(l => !q || [l.userName, l.action, l.description, l.entityType, l.entityId].join(" ").toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scopedLogs, actionFilter, entityFilter, query]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  function resetPaging() { setVisibleCount(PAGE_SIZE); }

  if (!dbLoaded) {
    return (
      <div className={`${dashFont.variable} space-y-4`} style={dashFontScope}>
        <div><p className="text-sm text-[#283338]/60">Audit</p><h2 className="text-[28px] font-bold">Riwayat aktivitas</h2></div>
        <div className="p-6 border bg-white animate-pulse space-y-3" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="h-12 bg-[#e4f0f1] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`${dashFont.variable} space-y-4`} style={dashFontScope}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#283338]/60">Audit • <span className="text-[#1c5d5f] font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</span></p>
          <h2 className="text-[28px] font-bold mt-0.5">Riwayat aktivitas</h2>
          <p className="text-sm text-[#283338]/60 mt-0.5">{scopeLabel} — siapa melakukan apa, dan kapan.</p>
        </div>
      </div>

      {/* Filter bar — tiap kontrol punya warna fungsional sendiri */}
      <div className="p-4 border bg-white flex flex-wrap items-center gap-3" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: FN.blue.fg }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); resetPaging(); }}
            placeholder="Cari nama, aksi, atau deskripsi…"
            className="w-full text-sm bg-[#f2f8f7] pl-9 pr-4 py-2.5 outline-none"
            style={{ borderRadius: 48, border: `1px solid ${FN.blue.border}` }}
          />
        </div>
        <PillDropdown
          label="Semua aksi"
          value={actionFilter}
          onChange={v => { setActionFilter(v); resetPaging(); }}
          tone={FN.amber}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 5h16l-6 8v6l-4 2v-8L4 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
          options={[{ value: "__all__", label: "Semua aksi" }, ...actionOptions.map(a => ({ value: a, label: a }))]}
        />
        <PillDropdown
          label="Semua entitas"
          value={entityFilter}
          onChange={v => { setEntityFilter(v); resetPaging(); }}
          tone={FN.green}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 12l-8 8-9-9V4h7l10 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>}
          options={[{ value: "__all__", label: "Semua entitas" }, ...entityOptions.map(t => ({ value: t, label: entityLabel[t] ?? t }))]}
        />
        {(query || actionFilter !== "__all__" || entityFilter !== "__all__") && (
          <button
            onClick={() => { setQuery(""); setActionFilter("__all__"); setEntityFilter("__all__"); resetPaging(); }}
            className="text-sm font-medium px-3 py-2.5 flex items-center gap-1.5 rounded-full"
            style={{ background: FN.red.bg, color: FN.red.fg }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            Reset
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-4 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-[#283338]/50">{filteredLogs.length} aktivitas ditemukan</span>
        </div>

        {/* 5. Empty state */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#f2f8f7] border border-[#e4f0f1] flex items-center justify-center text-[#a2cbcd]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </div>
            <div className="text-sm font-semibold text-[#283338]">Tidak ada aktivitas</div>
            <div className="text-xs text-[#283338]/50">Coba ubah kata kunci atau filter yang digunakan.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLogs.map(l => {
              const tone = entityTone[l.entityType] ?? defaultTone;
              const actorRole = employees.find(e => e.id === l.userId)?.role;
              const avatarColor = actorRole ? roleAvatarColor[actorRole] : "#16325a";
              return (
                <div key={l.id} className="flex gap-3 p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ background: avatarColor }}>{l.userName.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm"><span className="font-semibold">{l.userName}</span> <span className="text-[#283338]/70">{l.action}</span></div>
                    <div className="text-xs text-[#283338]/60 mt-0.5">{l.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: tone.bg, color: tone.fg }}>{entityLabel[l.entityType] ?? l.entityType} #{l.entityId}</span>
                    <span className="text-xs text-[#283338]/50 whitespace-nowrap">{l.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Muat lebih banyak — biru (aksi lanjut/informasi) */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="text-sm font-medium px-5 py-2.5 flex items-center gap-1.5"
              style={{ borderRadius: 48, border: `1px solid ${FN.blue.border}`, color: FN.blue.fg, background: FN.blue.bg }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Muat lebih banyak ({filteredLogs.length - visibleCount} lagi)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}