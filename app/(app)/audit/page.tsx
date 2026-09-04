"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSKP } from "@/lib/store";
import { DatePicker } from "@/components/ui/date-picker";

const PAGE_SIZE = 20;

const DATE_PRESETS = [
 { value: "__all__", label: " Semua waktu"},
 { value: "today", label: " Hari ini"},
 { value: "7d", label: "7 hari terakhir"},
 { value: "30d", label: "30 hari terakhir"},
 { value: "month", label: " Bulan ini"},
 { value: "custom", label: " Rentang kustom"},
];

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

function dateBucketLabel(createdAt: string): string {
 const d = createdAt.slice(0, 10);
 const today = todayStr();
 if (d === today) return " Hari ini";
 if (d === daysAgoStr(1)) return "Kemarin";
 if (d >= daysAgoStr(6)) return "7 hari terakhir";
 const dt = new Date(d + " T00:00:00");
 return dt.toLocaleDateString("id-ID", { month: "long", year: "numeric"});
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

function shortId(id: string) {
 return id.length > 10 ? id.slice(0, 8) + "…": id;
}

type ActionKind = "create"| "edit"| "submit"| "delete"| "other";
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
// Seline — action kind uses ink/cyan/stone only
const actionKindTone: Record<ActionKind, { bg: string; fg: string }> = {
 create: { bg: "#3ba6f1", fg: "#fff"},
 edit: { bg: "#0c0a09", fg: "#fff"},
 submit: { bg: "#1c1917", fg: "#fff"},
 delete: { bg: "#78716c", fg: "#fff"},
 other: { bg: "#a8a29e", fg: "#fff"},
};

const entityLabel: Record<string, string> = {
 performance_plan: "Rencana",
 realization: "Realisasi",
 employee: "Pegawai",
 skp_period: "Periode",
 attachment: "Lampiran",
};

// Seline — entity tone is stone with cyan accent for primary types
const entityTone: Record<string, { bg: string; fg: string }> = {
 performance_plan: { bg: "#c1e1f7", fg: "#0c0a09"},
 realization: { bg: "#fafaf9", fg: "#78716c"},
 employee: { bg: "#fafaf9", fg: "#78716c"},
 skp_period: { bg: "#e8e6e5", fg: "#0c0a09"},
 attachment: { bg: "#ffffff", fg: "#78716c"},
};
const defaultTone = { bg: "#fafaf9", fg: "#78716c"};

const roleAvatarColor: Record<string, string> = {
 pimpinan_1: "#0c0a09",
 pimpinan_2: "#1c1917",
 pimpinan_3: "#78716c",
 staf: "#a8a29e",
 admin: "#3ba6f1",
};

// Seline — dropdown tones are all stone/cyan (no vibrant)
const FN = {
 blue: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
 amber: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
 green: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
 red: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
 violet: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
 teal: { bg: "#fafaf9", fg: "#0c0a09", border: "#e8e6e5"},
} as const;

function PillDropdown({
 icon, label, value, options, onChange,
}: {
 icon: React.ReactNode;
 label: string;
 value: string;
 options: { value: string; label: string }[];
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
 className="text-[14px] pl-9 pr-8 py-2 cursor-pointer font-normal bg-white border border-[#e8e6e5] text-[#0c0a09] hover:bg-[#fafaf9] inline-flex items-center"
 style={{ borderRadius: 9999 }}
 >
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716c]">{icon}</span>
 {current?.label ?? label}
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e]">
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transform: open ? " rotate(180deg)": undefined, transition: " transform 0.15s ease"}}>
 <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 </span>
 </button>

 {open && (
 <div className="absolute left-0 top-full mt-2 min-w-[190px] bg-white border border-[#e8e6e5] py-1.5 z-20" style={{ borderRadius: 10, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px"}}>
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
 color: active ? "#0c0a09": "#78716c",
 fontWeight: active ? 500 : 400,
 border: active ? "1px solid #e8e6e5": "1px solid transparent",
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

export default function AuditPage() {
 const { currentUser, employees, getSubordinates } = useSKP();
 const [queryInput, setQueryInput] = useState("");
 const [query, setQuery] = useState("");
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

 const scopedUserIds = useMemo(() => {
 if (!currentUser) return undefined;
 if (role === "admin"|| role === "pimpinan_1") return undefined;
 if (role === "pimpinan_2"|| role === "pimpinan_3") return [currentUser.id, ...getSubordinates(currentUser.id).map(e => e.id)];
 return [currentUser.id];
 }, [role, currentUser, getSubordinates]);

 const scopeLabel =
 role === "admin"|| role === "pimpinan_1"? " Seluruh organisasi":
 role === "pimpinan_2"|| role === "pimpinan_3"? " Anda & tim Anda": " Aktivitas Anda";

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
 if (employeeFilter !== "__all__") params.set("userIds", employeeFilter);
 if (query.trim()) params.set("q", query.trim());
 if (dateFrom) params.set("from", dateFrom);
 if (dateTo) params.set("to", dateTo);
 return params;
 }

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

 useEffect(() => {
 if (!currentUser) return;
 const params = new URLSearchParams({ meta: "1"});
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
 const showEmployeeFilter = role !== "staf"&& employeeOptions.length > 1;
 const hasMore = rows.length < total;
 const hasActiveFilters = query || actionFilter !== "__all__"|| entityFilter !== "__all__"|| employeeFilter !== "__all__"|| datePreset !== "__all__";

 function resetFilters() {
 setQueryInput(""); setQuery("");
 setActionFilter("__all__"); setEntityFilter("__all__"); setEmployeeFilter("__all__");
 setDatePreset("__all__"); setCustomFrom(""); setCustomTo("");
 }

 if (loadingInitial && rows.length === 0) {
 return (
 <div className="space-y-4">
 <div><p className="eyebrow">AUDIT</p><h2 className="heading-sm">Riwayat aktivitas</h2></div>
 <div className="seline-card animate-pulse space-y-3">
 {[0, 1, 2, 3].map(i => <div key={i} className="h-12 bg-[#fafaf9] border border-[#e8e6e5] rounded-[10px]"/>)}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* Header — Seline */}
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="eyebrow">AUDIT • <span className="text-[#3ba6f1]">{role ? role.charAt(0).toUpperCase() + role.slice(1) : ""}</span></p>
 <h2 className="heading-sm mt-0.5">Riwayat aktivitas</h2>
 <p className="text-[14px] text-[#78716c] mt-1">{scopeLabel} — siapa melakukan apa, dan kapan.</p>
 </div>
 </div>

 {/* Filter bar — Seline flat */}
 <div className="seline-card flex flex-wrap items-center gap-3 !p-4">
 <div className="relative flex-1 min-w-[200px]">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#a8a29e]">
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
 </span>
 <input
 value={queryInput}
 onChange={e => setQueryInput(e.target.value)}
 placeholder="Cari nama, aksi, atau deskripsi…"
 className="seline-input w-full pl-9 pr-4 py-2"
 style={{ borderRadius: 9999 }}
 />
 </div>
 {showEmployeeFilter && (
 <PillDropdown
 label="Semua pegawai"
 value={employeeFilter}
 onChange={setEmployeeFilter}
 icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>}
 options={[{ value: "__all__", label: " Semua pegawai"}, ...employeeOptions]}
 />
 )}
 <PillDropdown
 label="Semua aksi"
 value={actionFilter}
 onChange={setActionFilter}
 icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 5h16l-6 8v6l-4 2v-8L4 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>}
 options={[{ value: "__all__", label: " Semua aksi"}, ...actionOptions.map(a => ({ value: a, label: a }))]}
 />
 <PillDropdown
 label="Semua entitas"
 value={entityFilter}
 onChange={setEntityFilter}
 icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 12l-8 8-9-9V4h7l10 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>}
 options={[{ value: "__all__", label: " Semua entitas"}, ...entityOptions.map(t => ({ value: t, label: entityLabel[t] ?? t }))]}
 />
 <PillDropdown
 label="Semua waktu"
 value={datePreset}
 onChange={setDatePreset}
 icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>}
 options={DATE_PRESETS}
 />
 {datePreset === "custom"&& (
 <div className="flex items-start gap-2">
 <div className="w-[160px]"><DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Dari" /></div>
 <span className="text-[12px] text-[#a8a29e] mt-2.5">—</span>
 <div className="w-[160px]"><DatePicker value={customTo} onChange={setCustomTo} placeholder="Sampai" /></div>
 </div>
 )}
 {hasActiveFilters && (
 <button onClick={resetFilters} className="text-[14px] font-medium px-3 py-1.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c] hover:bg-white inline-flex items-center gap-1.5" style={{ borderRadius: 9999 }}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
 Reset
 </button>
 )}
 </div>

 {/* List — Seline cards */}
 <div className="seline-card">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[12px] text-[#a8a29e]">{loadingInitial ? "Memuat…": `${total} aktivitas ditemukan`}</span>
 </div>

 {!loadingInitial && rows.length === 0 ? (
 <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
 <div className="w-12 h-12 rounded-full bg-[#fafaf9] border border-[#e8e6e5] flex items-center justify-center text-[#d6d3d1]">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
 </div>
 <div className="text-[14px] font-medium text-[#0c0a09]">Tidak ada aktivitas</div>
 <div className="text-[12px] text-[#78716c]">Coba ubah kata kunci atau filter yang digunakan.</div>
 </div>
 ) : (
 <div className="space-y-4">
 {groupByDate(rows).map(group => (
 <div key={group.label}>
 <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#a8a29e] px-1 mb-2">{group.label}</div>
 <div className="space-y-2">
 {group.items.map(l => {
 const tone = entityTone[l.entityType] ?? defaultTone;
 const actorRole = employees.find(e => e.id === l.userId)?.role;
 const avatarColor = actorRole ? roleAvatarColor[actorRole] : "#0c0a09";
 const kind = actionKind(l.action);
 const kindTone = actionKindTone[kind];
 return (
 <button
 key={l.id}
 onClick={() => setDetailLog(l)}
 className="w-full text-left flex gap-3 p-3 rounded-[10px] bg-[#fafaf9] border border-[#e8e6e5] hover:bg-white hover:border-[#d6d3d1] transition-colors"
 >
 <div className="relative shrink-0">
 <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[12px] font-medium" style={{ background: avatarColor }}>{l.userName.slice(0, 2).toUpperCase()}</div>
 <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#fafaf9]" style={{ background: kindTone.bg, color: kindTone.fg }} title={kind}>
 {actionIcon[kind]}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-[14px]"><span className="font-medium text-[#0c0a09]">{l.userName}</span> <span className="text-[#78716c]">{l.action}</span></div>
 <div className="text-[12px] text-[#78716c] mt-0.5 break-words">{l.description}</div>
 </div>
 <div className="shrink-0 flex flex-col items-end gap-1 text-right ml-2">
 <span className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap border border-[#e8e6e5]" style={{ background: tone.bg, color: tone.fg }}>{entityLabel[l.entityType] ?? l.entityType} #{shortId(l.entityId)}</span>
 <span className="text-[12px] text-[#a8a29e] whitespace-nowrap">{l.createdAt}</span>
 </div>
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}

 {hasMore && (
 <div className="flex justify-center mt-4">
 <button onClick={loadMore} disabled={loadingMore} className="btn-ghost text-[14px] disabled:opacity-60">
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
 {loadingMore ? "Memuat…": `Muat lebih banyak (${total - rows.length} lagi)`}
 </button>
 </div>
 )}
 </div>

 {detailLog && (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 p-0 sm:p-4" onClick={() => setDetailLog(null)}>
 <div className="bg-white w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 border border-[#e8e6e5]" style={{ borderRadius: 16 }} onClick={e => e.stopPropagation()}>
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-[14px] font-medium shrink-0" style={{ background: employees.find(e => e.id === detailLog.userId)?.role ? roleAvatarColor[employees.find(e => e.id === detailLog.userId)!.role] : "#0c0a09"}}>
 {detailLog.userName.slice(0, 2).toUpperCase()}
 </div>
 <div>
 <div className="text-[14px] font-medium text-[#0c0a09]">{detailLog.userName}</div>
 <div className="text-[12px] text-[#a8a29e]">{detailLog.createdAt}</div>
 </div>
 </div>
 <button onClick={() => setDetailLog(null)} className="text-[#a8a29e] hover:text-[#0c0a09] p-1">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
 </button>
 </div>

 <div className="mt-4 space-y-3">
 <div>
 <div className="eyebrow">Aksi</div>
 <div className="text-[14px] font-medium text-[#0c0a09]">{detailLog.action}</div>
 </div>
 <div>
 <div className="eyebrow">Deskripsi</div>
 <div className="text-[14px] text-[#78716c]">{detailLog.description}</div>
 </div>
 <div>
 <div className="eyebrow">Entitas</div>
 <span className="text-[12px] font-medium px-2 py-0.5 rounded-full border border-[#e8e6e5]" style={{ background: (entityTone[detailLog.entityType] ?? defaultTone).bg, color: (entityTone[detailLog.entityType] ?? defaultTone).fg }}>
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
