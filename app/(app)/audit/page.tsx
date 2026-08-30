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

const DATE_PRESETS = [
  { value: "__all__", label: "Semua waktu" },
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari terakhir" },
  { value: "30d", label: "30 hari terakhir" },
  { value: "month", label: "Bulan ini" },
  { value: "custom", label: "Rentang kustom" },
];

// YYYY-MM-DD hari ini, lokal (bukan UTC) — dipakai buat semua perhitungan preset tanggal
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// 4. Pengelompokan per tanggal — "Hari ini" / "Kemarin" / "7 hari terakhir" / per bulan untuk yang lebih lama
function dateBucketLabel(createdAt: string): string {
  const d = createdAt.slice(0, 10);
  const today = todayStr();
  if (d === today) return "Hari ini";
  if (d === daysAgoStr(1)) return "Kemarin";
  if (d >= daysAgoStr(6)) return "7 hari terakhir";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
function groupByDate<T extends { createdAt: string }>(items: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = dateBucketLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

type AuditLog = { id: string; userId: string; userName: string; action: string; description: string; entityType: string; entityId: string; createdAt: string };
type AuditMeta = { actions: string[]; entityTypes: string[]; employees: { id: string; name: string }[] };

// ID entitas (cuid) panjang banget & bikin badge overflow, terutama di layar sempit — dipotong.
function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + "…" : id;
}

// Kategori aksi → ikon & warna fungsional. Dicocokkan dari kata kunci di teks `action`
// (data sekarang berupa teks bebas dari tim lain, bukan enum, jadi dipetakan longgar).
type ActionKind = "create" | "edit" | "submit" | "delete" | "other";
function actionKind(action: string): ActionKind {
  const a = action.toLowerCase();
  if (a.includes("menghapus") || a.includes("hapus")) return "delete";
  if (a.includes("membuat") || a.includes("menambah")) return "create";
  if (a.includes("mengubah") || a.includes("ubah") || a.includes("update")) return "edit";
  if (a.includes("mengirim") || a.includes("kirim") || a.includes("pelimpahan") || a.includes("delegasi") || a.includes("setuju") || a.includes("approve")) return "submit";
  return "other";
}
const actionIcon: Record<ActionKind, React.ReactNode> = {
  create: <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>,
  edit: <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/></svg>,
  submit: <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  delete: <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 6h14M9 6V4h6v2M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  other: <svg width="7" height="7" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>,
};
const actionKindTone: Record<ActionKind, { bg: string; fg: string }> = {
  create: { bg: "#2e6f9e", fg: "#fff" },   // biru — membuat
  edit: { bg: "#96720a", fg: "#fff" },     // kuning/amber — mengubah
  submit: { bg: "#1f8a5f", fg: "#fff" },   // hijau — kirim/setuju/delegasi
  delete: { bg: "#c0392b", fg: "#fff" },   // merah — menghapus
  other: { bg: "#8b96a0", fg: "#fff" },
};

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
  violet: { bg: "#ece5f5", fg: "#6b3fa0", border: "#c7aee0" },
  teal: { bg: "#e4f0f1", fg: "#1c5d5f", border: "#a2cbcd" },
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
  const { currentUser, employees, getSubordinates } = useSKP();
  const [queryInput, setQueryInput] = useState("");   // apa yang diketik user (langsung)
  const [query, setQuery] = useState("");               // versi debounced yang dipakai buat fetch
  const [actionFilter, setActionFilter] = useState("__all__");
  const [entityFilter, setEntityFilter] = useState("__all__");
  const [employeeFilter, setEmployeeFilter] = useState("__all__");
  const [datePreset, setDatePreset] = useState("__all__");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const role = currentUser?.role;

  // 1. Scope per role — konsisten dengan Dashboard. Dikirim ke server sebagai ?userIds=
  const scopedUserIds = useMemo(() => {
    if (!currentUser) return undefined;
    if (role === "admin" || role === "direktur") return undefined; // undefined = semua, tidak difilter
    if (role === "supervisor") return [currentUser.id, ...getSubordinates(currentUser.id).map(e => e.id)];
    return [currentUser.id]; // staff: hanya dirinya sendiri
  }, [role, currentUser, getSubordinates]);

  const scopeLabel =
    role === "admin" || role === "direktur" ? "Seluruh organisasi" :
    role === "supervisor" ? "Anda & tim Anda" : "Aktivitas Anda";

  // Debounce pencarian teks 350ms — supaya nggak nembak request tiap ketikan
  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput), 350);
    return () => clearTimeout(t);
  }, [queryInput]);

  const { dateFrom, dateTo } = useMemo(() => {
    const today = todayStr();
    if (datePreset === "today") return { dateFrom: today, dateTo: today };
    if (datePreset === "7d") return { dateFrom: daysAgoStr(6), dateTo: today };
    if (datePreset === "30d") return { dateFrom: daysAgoStr(29), dateTo: today };
    if (datePreset === "month") return { dateFrom: monthStartStr(), dateTo: today };
    if (datePreset === "custom") return { dateFrom: customFrom || undefined, dateTo: customTo || undefined };
    return { dateFrom: undefined, dateTo: undefined };
  }, [datePreset, customFrom, customTo]);

  function buildParams(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(PAGE_SIZE));
    if (scopedUserIds) params.set("userIds", scopedUserIds.join(","));
    if (actionFilter !== "__all__") params.set("action", actionFilter);
    if (entityFilter !== "__all__") params.set("entityType", entityFilter);
    if (employeeFilter !== "__all__") params.set("userIds", employeeFilter); // pegawai spesifik menimpa scope umum
    if (query.trim()) params.set("q", query.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    return params;
  }

  // 6. Server-side pagination — ambil dari API tiap kali filter berubah, bukan slice di frontend
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setLoadingInitial(true);
    fetch(`/api/logs?${buildParams(1)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setRows(d.logs ?? []); setTotal(d.total ?? 0); setPage(1); } })
      .finally(() => { if (!cancelled) setLoadingInitial(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, scopedUserIds, actionFilter, entityFilter, employeeFilter, query, dateFrom, dateTo]);

  // Opsi filter diambil dari server (meta), diperbarui saat scope berubah
  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams({ meta: "1" });
    if (scopedUserIds) params.set("userIds", scopedUserIds.join(","));
    fetch(`/api/logs?${params}`).then(r => r.json()).then(setMeta).catch(() => {});
  }, [currentUser, scopedUserIds]);

  function loadMore() {
    setLoadingMore(true);
    const next = page + 1;
    fetch(`/api/logs?${buildParams(next)}`)
      .then(r => r.json())
      .then(d => { setRows(prev => [...prev, ...(d.logs ?? [])]); setPage(next); })
      .finally(() => setLoadingMore(false));
  }

  if (!currentUser) return null;

  const actionOptions = meta?.actions ?? [];
  const entityOptions = meta?.entityTypes ?? [];
  const employeeOptions = (meta?.employees ?? []).map(e => ({ value: e.id, label: e.name }));
  const showEmployeeFilter = role !== "staff" && employeeOptions.length > 1;
  const hasMore = rows.length < total;
  const hasActiveFilters = query || actionFilter !== "__all__" || entityFilter !== "__all__" || employeeFilter !== "__all__" || datePreset !== "__all__";

  function resetFilters() {
    setQueryInput(""); setQuery("");
    setActionFilter("__all__"); setEntityFilter("__all__"); setEmployeeFilter("__all__");
    setDatePreset("__all__"); setCustomFrom(""); setCustomTo("");
  }

  if (loadingInitial && rows.length === 0) {
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
          <p className="text-sm text-[#283338]/60">Audit • <span className="text-[#1c5d5f] font-medium">{role ? role.charAt(0).toUpperCase() + role.slice(1) : ""}</span></p>
          <h2 className="text-[28px] font-bold mt-0.5">Riwayat aktivitas</h2>
          <p className="text-sm text-[#283338]/60 mt-0.5">{scopeLabel} — siapa melakukan apa, dan kapan.</p>
        </div>
      </div>

      {/* Filter bar — tiap kontrol punya warna fungsional sendiri, wrap otomatis di layar sempit */}
      <div className="p-4 border bg-white flex flex-wrap items-center gap-3" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: FN.blue.fg }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <input
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            placeholder="Cari nama, aksi, atau deskripsi…"
            className="w-full text-sm bg-[#f2f8f7] pl-9 pr-4 py-2.5 outline-none"
            style={{ borderRadius: 48, border: `1px solid ${FN.blue.border}` }}
          />
        </div>
        {showEmployeeFilter && (
          <PillDropdown
            label="Semua pegawai"
            value={employeeFilter}
            onChange={setEmployeeFilter}
            tone={FN.teal}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
            options={[{ value: "__all__", label: "Semua pegawai" }, ...employeeOptions]}
          />
        )}
        <PillDropdown
          label="Semua aksi"
          value={actionFilter}
          onChange={setActionFilter}
          tone={FN.amber}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 5h16l-6 8v6l-4 2v-8L4 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
          options={[{ value: "__all__", label: "Semua aksi" }, ...actionOptions.map(a => ({ value: a, label: a }))]}
        />
        <PillDropdown
          label="Semua entitas"
          value={entityFilter}
          onChange={setEntityFilter}
          tone={FN.green}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 12l-8 8-9-9V4h7l10 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>}
          options={[{ value: "__all__", label: "Semua entitas" }, ...entityOptions.map(t => ({ value: t, label: entityLabel[t] ?? t }))]}
        />
        <PillDropdown
          label="Semua waktu"
          value={datePreset}
          onChange={setDatePreset}
          tone={FN.violet}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          options={DATE_PRESETS}
        />
        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="text-sm px-3 py-2 border bg-white"
              style={{ borderRadius: 48, borderColor: FN.violet.border, color: FN.violet.fg }}
            />
            <span className="text-xs text-[#283338]/40">—</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="text-sm px-3 py-2 border bg-white"
              style={{ borderRadius: 48, borderColor: FN.violet.border, color: FN.violet.fg }}
            />
          </div>
        )}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
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
          <span className="text-xs text-[#283338]/50">{loadingInitial ? "Memuat…" : `${total} aktivitas ditemukan`}</span>
        </div>

        {/* Empty state */}
        {!loadingInitial && rows.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#f2f8f7] border border-[#e4f0f1] flex items-center justify-center text-[#a2cbcd]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </div>
            <div className="text-sm font-semibold text-[#283338]">Tidak ada aktivitas</div>
            <div className="text-xs text-[#283338]/50">Coba ubah kata kunci atau filter yang digunakan.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupByDate(rows).map(group => (
              <div key={group.label}>
                <div className="text-xs font-semibold text-[#283338]/45 px-1 mb-2">{group.label}</div>
                <div className="space-y-2">
                  {group.items.map(l => {
                    const tone = entityTone[l.entityType] ?? defaultTone;
                    const actorRole = employees.find(e => e.id === l.userId)?.role;
                    const avatarColor = actorRole ? roleAvatarColor[actorRole] : "#16325a";
                    const kind = actionKind(l.action);
                    const kindTone = actionKindTone[kind];
                    return (
                      // Mobile fix: flex-col di layar sempit (avatar+teks di atas, badge+waktu di bawah
                      // sebagai baris sendiri) — sebelumnya kolom kanan (shrink-0 + nowrap) memaksa
                      // konten teks di tengah terjepit jadi satu kata per baris di layar sempit.
                      <button
                        key={l.id}
                        onClick={() => setDetailLog(l)}
                        className="w-full text-left flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] hover:border-[#a2cbcd] transition-colors"
                        style={{ borderRadius: 12 }}
                      >
                        <div className="flex gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: avatarColor }}>{l.userName.slice(0, 2).toUpperCase()}</div>
                            <div
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#f2f8f7]"
                              style={{ background: kindTone.bg, color: kindTone.fg }}
                              title={kind}
                            >
                              {actionIcon[kind]}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm"><span className="font-semibold">{l.userName}</span> <span className="text-[#283338]/70">{l.action}</span></div>
                            <div className="text-xs text-[#283338]/60 mt-0.5 break-words">{l.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 sm:shrink-0 pl-11 sm:pl-0">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: tone.bg, color: tone.fg }}>{entityLabel[l.entityType] ?? l.entityType} #{shortId(l.entityId)}</span>
                          <span className="text-xs text-[#283338]/50 whitespace-nowrap">{l.createdAt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Muat lebih banyak — biru (aksi lanjut/informasi) */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-sm font-medium px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-60"
              style={{ borderRadius: 48, border: `1px solid ${FN.blue.border}`, color: FN.blue.fg, background: FN.blue.bg }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {loadingMore ? "Memuat…" : `Muat lebih banyak (${total - rows.length} lagi)`}
            </button>
          </div>
        )}
      </div>

      {/* Detail modal — data before/after belum tersedia di skema ActivityLog sekarang (cuma
          `description` teks bebas), jadi modal ini cuma nampilin field yang beneran ada datanya.
          CATATAN BUAT DEV (bukan buat ditampilkan ke user): kalau ke depannya addLog() di
          lib/store.tsx menyertakan payload before/after terstruktur (perlu kolom tambahan di
          skema Prisma ActivityLog + perubahan di modul Rencana/Realisasi saat mereka manggil
          pencatatan log), baru bagian itu bisa dirender di sini sebagai section baru. */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4" onClick={() => setDetailLog(null)}>
          <div
            className="bg-white w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5"
            style={{ borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0" style={{ background: employees.find(e => e.id === detailLog.userId)?.role ? roleAvatarColor[employees.find(e => e.id === detailLog.userId)!.role] : "#16325a" }}>
                  {detailLog.userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold">{detailLog.userName}</div>
                  <div className="text-xs text-[#283338]/50">{detailLog.createdAt}</div>
                </div>
              </div>
              <button onClick={() => setDetailLog(null)} className="text-[#283338]/40 hover:text-[#283338] p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#283338]/40 mb-1">Aksi</div>
                <div className="text-sm font-medium">{detailLog.action}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#283338]/40 mb-1">Deskripsi</div>
                <div className="text-sm text-[#283338]/80">{detailLog.description}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#283338]/40 mb-1">Entitas</div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (entityTone[detailLog.entityType] ?? defaultTone).bg, color: (entityTone[detailLog.entityType] ?? defaultTone).fg }}>
                  {entityLabel[detailLog.entityType] ?? detailLog.entityType} #{detailLog.entityId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}