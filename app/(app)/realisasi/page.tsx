"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useSKP } from "@/lib/store";
import { DatePicker } from "@/components/ui/date-picker";

export default function RealisasiPage() {
 const { realizations, plans, employees, attachments, periods, currentUser, isSubordinate, setShowRealizationModal, setEditingRealization, setRealForm, handleDeleteRealization, handleDeleteAttachment } = useSKP();
 const router = useRouter();
 const [tab, setTab] = useState<"saya"| "bawahan">("saya");
 const [selectedRealId, setSelectedRealId] = useState<string | null>(null);
 const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

 // Filters
 const [search, setSearch] = useState("");
 const [periodeFilter, setPeriodeFilter] = useState<string>("all");
 const [dateFrom, setDateFrom] = useState("");
 const [dateTo, setDateTo] = useState("");
 const [pelaksanaFilter, setPelaksanaFilter] = useState<string>("all");
 const [buktiFilter, setBuktiFilter] = useState<"all"| "with"| "without">("all");
 const [sortBy, setSortBy] = useState<"date_desc"| "date_asc"| "title_asc"| "title_desc">("date_desc");
 const [showAdvanced, setShowAdvanced] = useState(false);
 const [page, setPage] = useState(1);
 const pageSize = 10;

 if (!currentUser) return null;

 const selectedReal = selectedRealId ? realizations.find(r => r.id === selectedRealId) ?? null : null;
 const selectedRealPlan = selectedReal ? plans.find(p => p.id === selectedReal.planId) ?? null : null;
 const selectedRealEmp = selectedReal?.uploadedBy ? employees.find(e => e.id === selectedReal.uploadedBy) : (selectedRealPlan ? employees.find(e => e.id === selectedRealPlan.assignedTo) : null);

 const isAtasan = ["direktur", "supervisor", "admin"].includes(currentUser.role);

 const formatTanggal = (dateStr: string) => {
 if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
 const [y, m, d] = dateStr.split("-");
 const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
 const monthName = months[parseInt(m,10)-1] || m;
 return `${parseInt(d,10)} ${monthName} ${y}`;
 };
 
 // Helper: cek apakah realisasi match filter
 const matchesFilter = (r: typeof realizations[number]): boolean => {
 const plan = plans.find(p => p.id === r.planId);
 if (!plan) return false;
 // Search: hanya nama rencana
 if (search) {
 const q = search.toLowerCase();
 const planTitle = plan.title.toLowerCase();
 if (!planTitle.includes(q)) return false;
 }
 // Periode
 if (periodeFilter !== "all"&& plan.skpPeriodId !== periodeFilter) return false;
 // Date range
 if (dateFrom && r.date < dateFrom) return false;
 if (dateTo && r.date > dateTo) return false;
 // Pelaksana (for bawahan, but also apply to saya if needed)
 if (pelaksanaFilter !== "all") {
 const ownerId = r.uploadedBy ?? plan.assignedTo;
 if (ownerId !== pelaksanaFilter) return false;
 }
 // Bukti
 if (buktiFilter !== "all") {
 const hasBukti = attachments.some(a => a.realizationId === r.id);
 if (buktiFilter === "with"&& !hasBukti) return false;
 if (buktiFilter === "without"&& hasBukti) return false;
 }
 return true;
 };

 const sortReals = (list: typeof realizations): typeof realizations => {
 const sorted = [...list];
 sorted.sort((a, b) => {
 const aTime = (a as any).time ?? "00:00";
 const bTime = (b as any).time ?? "00:00";
 const aKey = `${a.date} ${aTime}`;
 const bKey = `${b.date} ${bTime}`;
 switch (sortBy) {
 case "date_asc": return aKey.localeCompare(bKey);
 case "date_desc": return bKey.localeCompare(aKey);
 case "title_asc": return a.title.localeCompare(b.title);
 case "title_desc": return b.title.localeCompare(a.title);
 default: return bKey.localeCompare(aKey);
 }
 });
 return sorted;
 };

 // Reset page when filter changes
 const resetPage = () => setPage(1);

 // Tugas saya: rencana yang assigned ke saya
 const myPlans = plans.filter(p => p.assignedTo === currentUser.id);

 // Realisasi bawahan: realisasi dari bawahan langsung/tidak langsung
 const bawahanRealisasiRaw = realizations.filter(r => {
 const plan = plans.find(p => p.id === r.planId);
 if (!plan) return false;
 return isSubordinate(currentUser.id, plan.assignedTo) || (currentUser.role === "admin"&& plan.assignedTo !== currentUser.id);
 });

 const bawahanRealisasiFiltered = useMemo(() => {
 let list = bawahanRealisasiRaw.filter(matchesFilter);
 list = sortReals(list);
 return list;
 }, [bawahanRealisasiRaw, search, periodeFilter, dateFrom, dateTo, pelaksanaFilter, buktiFilter, sortBy, attachments]);

 const bawahanPaginated = useMemo(() => {
 const start = (page - 1) * pageSize;
 return bawahanRealisasiFiltered.slice(start, start + pageSize);
 }, [bawahanRealisasiFiltered, page]);

 const bawahanTotalPages = Math.max(1, Math.ceil(bawahanRealisasiFiltered.length / pageSize));

 // Tugas Saya: semua realisasi dari rencana milik saya + delegasi turunannya (flat untuk tabel)
 const sayaRealisasiRaw = useMemo(() => {
 const map = new Map<string, typeof realizations[number]>();
 for (const plan of myPlans) {
 realizations.filter(r => r.planId === plan.id).forEach(r => map.set(r.id, r));
 // kumpulkan descendant ids
 const queue: string[] = [plan.id];
 const visited = new Set<string>();
 const descendantIds = new Set<string>();
 while (queue.length) {
 const cur = queue.shift()!;
 if (visited.has(cur)) continue;
 visited.add(cur);
 const children = plans.filter(p => p.parentId === cur);
 children.forEach(c => { descendantIds.add(c.id); queue.push(c.id); });
 }
 descendantIds.forEach(id => {
 realizations.filter(r => r.planId === id).forEach(r => map.set(r.id, r));
 });
 }
 return Array.from(map.values());
 }, [myPlans, plans, realizations]);

 const sayaRealisasiFiltered = useMemo(() => {
 let list = sayaRealisasiRaw.filter(matchesFilter);
 list = sortReals(list);
 return list;
 }, [sayaRealisasiRaw, search, periodeFilter, dateFrom, dateTo, pelaksanaFilter, buktiFilter, sortBy, attachments]);

 const sayaPaginated = useMemo(() => {
 const start = (page - 1) * pageSize;
 return sayaRealisasiFiltered.slice(start, start + pageSize);
 }, [sayaRealisasiFiltered, page]);

 const sayaTotalPages = Math.max(1, Math.ceil(sayaRealisasiFiltered.length / pageSize));

 const canEdit = (r: (typeof realizations)[number]) => {
 if (!r.uploadedBy) return false;
 return r.uploadedBy === currentUser.id;
 };
 const canDelete = (r: (typeof realizations)[number]) => {
 const plan = plans.find(p => p.id === r.planId);
 const ownerId = r.uploadedBy ?? plan?.assignedTo ?? null;
 if (!ownerId) return ["admin","direktur"].includes(currentUser.role);
 if (r.uploadedBy && r.uploadedBy === currentUser.id) return true;
 if (["admin","direktur"].includes(currentUser.role)) return true;
 return isSubordinate(currentUser.id, ownerId);
 };
 const canDeleteBukti = (a: (typeof attachments)[number]) => {
 if (a.uploadedBy === currentUser.id) return true;
 if (["admin","direktur"].includes(currentUser.role)) return true;
 if (isSubordinate(currentUser.id, a.uploadedBy)) return true;
 const real = realizations.find(r => r.id === a.realizationId);
 if (real?.uploadedBy && isSubordinate(currentUser.id, real.uploadedBy)) return true;
 return false;
 };

  // Rincian target warisi dari induk jika dilimpahkan agar tetap terbaca
  const getEffectiveTargets = (plan: typeof plans[number] | null | undefined): Array<{name:string,value:string,unit:string}> => {
  if (!plan) return [];
  if ((plan as any).customTargets && (plan as any).customTargets.length) return (plan as any).customTargets;
  let cur: any = plan;
  while (cur?.parentId) {
  const parent = plans.find(p => p.id === cur.parentId);
  if (!parent) break;
  if ((parent as any).customTargets && (parent as any).customTargets.length) return (parent as any).customTargets;
  cur = parent;
  }
  return [];
  };

 const openEdit = (r: (typeof realizations)[number]) => {
 if (!canEdit(r)) return;
 router.push(`/realisasi/${r.id}/edit`);
 };

 const openCreate = (plan: typeof plans[number]) => {
 if (plan.assignedTo !== currentUser.id) return;
 router.push(`/realisasi/tambah?planId=${plan.id}`);
 };

 const exportRealizationDetail = (r: typeof realizations[number]) => {
 const plan = plans.find(p => p.id === r.planId);
 const period = plan ? periods.find(pe => pe.id === plan.skpPeriodId) : null;
 const emp = (r as any).uploadedBy ? employees.find(e => e.id === (r as any).uploadedBy) : (plan ? employees.find(e => e.id === plan.assignedTo) : null);
 const targets = (r as any).targets as Array<{id:string,name:string,value:string,unit:string}> | undefined;
 const parts = (r as any).participants as Array<{id:string, employeeId?:string, customName?:string, role:string}> | undefined;
 const bukti = attachments.filter(a => a.realizationId === r.id);
 const header: (string|number)[] = ["Field","Value"];
 const rows: (string|number)[][] = [
 ["Judul Realisasi", r.title || "-"],
 ["Rencana", plan?.title ?? "-"],
 ["Periode", period ? `${period.name} (${period.startDate} s/d ${period.endDate})` : (plan?.skpPeriodId ?? "-")],
 ["Pelaksana / Pengirim", emp?.name ?? (r as any).uploadedBy ?? "-"],
 ["Jabatan", emp?.role ?? "-"],
 ["NIP", (emp as any)?.employeeNumber ?? "-"],
 ["Target Rencana", plan?.target ?? "-"],
 ["Progress Rencana", plan ? `${plan.progress}%` : "-"],
 ["Tanggal", formatTanggal(r.date)],
 ["Jam", (r as any).time ?? "09:00"],
 ["Deskripsi", (r.description || "-").replace(/\r?\n/g, " ")],
 ["Target Terealisasi", targets && targets.length ? targets.map(t=> `${t.name}: ${t.value} ${t.unit}`).join(" | ") : "-"],
 ["Pegawai Terlibat", parts && parts.length ? parts.map(pp => {
 const e = pp.employeeId ? employees.find(x=>x.id===pp.employeeId) : null;
 const name = e?.name ?? pp.customName ?? pp.employeeId ?? "-";
 return `${name} (${pp.role})`;
 }).join(" | ") : "-"],
 ["Bukti", bukti.length ? bukti.map(b=> `${b.fileName} (${b.fileSize})`).join(" | ") : "-"],
 ];
 const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
 (ws as any)["!cols"] = [{wch:22},{wch:62}];
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "Detail");
 if (targets && targets.length) {
 const tHeader: (string|number)[] = ["No","Nama Target","Nilai","Satuan"];
 const tRows = targets.map((t,i)=>[i+1, t.name, t.value, t.unit]);
 const ws2 = XLSX.utils.aoa_to_sheet([tHeader, ...tRows]);
 (ws2 as any)["!cols"] = [{wch:4},{wch:24},{wch:12},{wch:12}];
 XLSX.utils.book_append_sheet(wb, ws2, "Target");
 }
 if (parts && parts.length) {
 const pHeader: (string|number)[] = ["No","Nama","Jabatan","Peran","NIP"];
 const pRows = parts.map((pp,i)=>{
 const e = pp.employeeId ? employees.find(x=>x.id===pp.employeeId) : null;
 return [i+1, e?.name ?? pp.customName ?? "-", e?.role ?? "-", pp.role, (e as any)?.employeeNumber ?? "-"];
 });
 const ws3 = XLSX.utils.aoa_to_sheet([pHeader, ...pRows]);
 (ws3 as any)["!cols"] = [{wch:4},{wch:22},{wch:16},{wch:16},{wch:16}];
 XLSX.utils.book_append_sheet(wb, ws3, "Pegawai Terlibat");
 }
 if (bukti.length) {
 const bHeader: (string|number)[] = ["No","Nama File","Ukuran","Tanggal"];
 const bRows = bukti.map((b,i)=>[i+1, b.fileName, b.fileSize, b.date]);
 const ws4 = XLSX.utils.aoa_to_sheet([bHeader, ...bRows]);
 (ws4 as any)["!cols"] = [{wch:4},{wch:32},{wch:12},{wch:14}];
 XLSX.utils.book_append_sheet(wb, ws4, "Bukti");
 }
 const safe = (r.title || "realisasi").replace(/[^a-zA-Z0-9]/g,"_").slice(0,30) || "realisasi";
 XLSX.writeFile(wb, `detail-realisasi-${safe}-${r.date}.xlsx`);
 };

 const hasActiveFilter = search || periodeFilter !== "all"|| dateFrom || dateTo || pelaksanaFilter !== "all"|| buktiFilter !== "all"|| sortBy !== "date_desc";

 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="eyebrow">REALISASI</p>
  <h2 className="heading-sm">Kelola realisasi</h2>
 <p className="text-[14px] text-[#0c0a09]/60 mt-1">Tugas Anda dan realisasi delegasi penerima — tambah dan pantau progres.</p>
 </div>
 <button onClick={() => router.push("/realisasi/tambah")} className="shrink-0 mt-1 px-5 py-2.5 rounded-full bg-[#0c0a09] text-white text-[14px] font-medium hover:bg-[#1c1917] whitespace-nowrap">+ Realisasi</button>
 </div>

 {/* Tabs — sembunyikan bila cuma 1 tab */}
 {isAtasan && (
 <div className="flex gap-2 border-b border-[#e8e6e5] pb-0">
 <button
 onClick={() => { setTab("saya"); setPage(1); }}
 className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition ${tab === "saya"? " border-[#3ba6f1] text-[#3ba6f1]": " border-transparent text-[#0c0a09]/60 hover:text-[#0c0a09]"}`}
 >
 Tugas Saya <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white text-[12px] ">{myPlans.length}</span>
 </button>
 <button
 onClick={() => { setTab("bawahan"); setPage(1); }}
 className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition relative ${tab === "bawahan"? " border-[#3ba6f1] text-[#3ba6f1]": " border-transparent text-[#0c0a09]/60 hover:text-[#0c0a09]"}`}
 >
 Realisasi Delegasi Penerima <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#fafaf9] text-[12px] ">{bawahanRealisasiFiltered.length}</span>
 </button>
 </div>
 )}

  {/* Filter Bar — Seline flat compact */}
  <div className="seline-card !p-3 space-y-2.5">
  <div className="flex items-center justify-between">
  <h3 className="eyebrow">Filter & Urutkan</h3>
  <div className="flex items-center gap-2">
  <button onClick={() => setShowAdvanced(v => !v)} className="btn-ghost !px-3 !py-1 !text-[12px]">{showAdvanced ? "Sembunyikan": "Filter lanjutan"} ▾</button>
  {hasActiveFilter && (
  <button onClick={() => { setSearch(""); setPeriodeFilter("all"); setDateFrom(""); setDateTo(""); setPelaksanaFilter("all"); setBuktiFilter("all"); setSortBy("date_desc"); setPage(1); }} className="text-[12px] text-[#78716c] hover:text-[#0c0a09] hover:underline">Reset</button>
  )}
  </div>
  </div>
  <div className="flex gap-2.5">
  <div className="flex-1 min-w-0">
  <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama rencana..." className="seline-input w-full" />
  </div>
  <div className="flex-1 min-w-0">
  <select value={periodeFilter} onChange={e => { setPeriodeFilter(e.target.value); setPage(1); }} className="seline-input w-full">
  <option value="all">Semua periode</option>
  {periods.map(p => <option key={p.id} value={p.id}>{p.name} — {p.startDate} s/d {p.endDate}</option>)}
  </select>
  </div>
  <div className="flex-1 min-w-0">
  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="seline-input w-full">
  <option value="date_desc">Tanggal terbaru → lama</option>
  <option value="date_asc">Tanggal lama → terbaru</option>
  <option value="title_asc">Judul A-Z</option>
  <option value="title_desc">Judul Z-A</option>
  </select>
  </div>
  </div>
  {showAdvanced && (
  <div className="flex gap-2.5 pt-2.5 border-t border-dashed border-[#e8e6e5] overflow-x-auto">
  <div className="flex-1 min-w-0">
  <DatePicker value={dateFrom} onChange={v => { setDateFrom(v); setPage(1); }} placeholder="Dari tanggal" />
  {dateFrom && dateTo && dateFrom > dateTo && <p className="text-[10px] text-[#b91c1c] mt-1">Dari tanggal tidak boleh &gt; sampai tanggal</p>}
  </div>
  <div className="flex-1 min-w-0">
  <DatePicker value={dateTo} onChange={v => { setDateTo(v); setPage(1); }} placeholder="Sampai tanggal" />
  </div>
  <div className="flex-1 min-w-0">
  <select value={buktiFilter} onChange={e => { setBuktiFilter(e.target.value as any); setPage(1); }} className="seline-input w-full">
  <option value="all">Semua</option>
  <option value="with">Dengan bukti</option>
  <option value="without">Tanpa bukti</option>
  </select>
  </div>
  {tab === "bawahan"&& (
  <div className="flex-1 min-w-0">
  <select value={pelaksanaFilter} onChange={e => { setPelaksanaFilter(e.target.value); setPage(1); }} className="seline-input w-full">
  <option value="all">Semua pelaksana</option>
  {employees.filter(e => bawahanRealisasiRaw.some(r => {
  const plan = plans.find(p => p.id === r.planId);
  const owner = r.uploadedBy ?? plan?.assignedTo;
  return owner === e.id;
  })).map(e => <option key={e.id} value={e.id}>{e.name.split(",")[0]} — {e.role}</option>)}
  </select>
  </div>
  )}
  </div>
  )}
  <div className="text-[11px] text-[#a8a29e]">
  {tab === "saya"? `${sayaRealisasiFiltered.length} dari ${sayaRealisasiRaw.length} realisasi • ${myPlans.length} tugas` : `${bawahanRealisasiFiltered.length} dari ${bawahanRealisasiRaw.length} realisasi`} • {hasActiveFilter ? "filter aktif": "tanpa filter"} {showAdvanced ? "• lanjutan terbuka": ""}
  </div>
  </div>

 {/* Tab: Tugas Saya — tiap rencana tabelnya sendiri */}
 {tab === "saya"&& (
 <div className="space-y-4">
 {myPlans.length === 0 ? (
 <div className="p-8 text-center border border-dashed bg-white rounded-xl" style={{ borderRadius: 12, borderColor: "#d6d3d1"}}>
 <p className="subheading">Belum ada tugas</p>
 <p className="text-[14px] text-[#0c0a09]/60 mt-1">Tugas akan muncul di sini setelah atasan melimpahkan rencana kepada Anda.</p>
 </div>
 ) : (() => {
 const rendered = myPlans.map(plan => {
 const myRealsRaw = realizations.filter(r => r.planId === plan.id);
 const descendantIds = (() => {
 const ids = new Set<string>();
 const queue: string[] = [plan.id];
 const visited = new Set<string>();
 while (queue.length) {
 const cur = queue.shift()!;
 if (visited.has(cur)) continue;
 visited.add(cur);
 const children = plans.filter(p => p.parentId === cur);
 children.forEach(c => { ids.add(c.id); queue.push(c.id); });
 }
 return ids;
 })();
 const relatedRealsRaw = realizations.filter(r => descendantIds.has(r.planId));
 const allRaw = [
 ...myRealsRaw.map(r => ({ r, empId: r.uploadedBy ?? plan.assignedTo, sourceTitle: plan.title })),
 ...relatedRealsRaw.map(r => {
 const childPlan = plans.find(p => p.id === r.planId);
 return { r, empId: r.uploadedBy ?? childPlan?.assignedTo ?? "", sourceTitle: childPlan?.title ?? "-" };
 }),
 ];
 let allReals = allRaw.filter(({r}) => matchesFilter(r));
 allReals = allReals.sort((a,b) => {
 const aTime = (a.r as any).time ?? "00:00";
 const bTime = (b.r as any).time ?? "00:00";
 switch (sortBy) {
 case "date_asc": return `${a.r.date} ${aTime}`.localeCompare(`${b.r.date} ${bTime}`);
 case "date_desc": return `${b.r.date} ${bTime}`.localeCompare(`${a.r.date} ${aTime}`);
 case "title_asc": return a.r.title.localeCompare(b.r.title);
 case "title_desc": return b.r.title.localeCompare(a.r.title);
 default: return `${b.r.date} ${bTime}`.localeCompare(`${a.r.date} ${aTime}`);
 }
 });
 const planMatchesSearch = !search || plan.title.toLowerCase().includes(search.toLowerCase());
 const showEmptyDueToFilter = allRaw.length > 0 && allReals.length === 0 && hasActiveFilter && !planMatchesSearch;
 if (showEmptyDueToFilter) return null;
 if (hasActiveFilter && search && allRaw.length === 0 && !planMatchesSearch) return null;
 if (hasActiveFilter && periodeFilter !== "all" && plan.skpPeriodId !== periodeFilter) return null;

 return (
 <div key={plan.id} className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e8e6e5"}}>
 {/* Header rencana */}
 <div className="flex items-start justify-between gap-2.5 p-3 bg-[#fafaf9]/70 border-b border-[#e8e6e5]">
 <div className="flex-1 min-w-0">
 <h3 className="text-[14px] font-medium text-[#0c0a09] leading-tight truncate" title={plan.title}>{plan.title}</h3>
 <div className="text-[11px] text-[#a8a29e] mt-0.5">Target {plan.target} • {plan.progress}% • {allReals.length} realisasi {hasActiveFilter ? "(terfilter)": ""}</div>
 </div>
 {plan.assignedTo === currentUser.id && (
 <button onClick={() => openCreate(plan)} className="btn-primary !px-3 !py-1 !text-[12px] shrink-0 whitespace-nowrap">+ Realisasi</button>
 )}
 </div>
  {/* Tabel per rencana - ukuran kolom disamakan dengan tab bawahan */}
  <div className="overflow-x-auto">
  <table className="w-full text-[14px] table-fixed">
  <colgroup>
  <col style={{width:"40px"}} />
  <col style={{width:"200px"}} />
  <col style={{width:"220px"}} />
  <col style={{width:"130px"}} />
  <col style={{width:"190px"}} />
  <col style={{width:"70px"}} />
  <col style={{width:"130px"}} />
  <col style={{width:"140px"}} />
  </colgroup>
  <thead className="bg-white border-b border-[#e8e6e5] text-[11px] tracking-[0.04em] uppercase text-[#0c0a09]/60">
  <tr>
  <th className="text-left px-3 py-2.5 font-medium">#</th>
  <th className="text-left px-3 py-2.5 font-medium">Rencana</th>
  <th className="text-left px-3 py-2.5 font-medium">Judul Realisasi</th>
  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Tanggal & Jam</th>
  <th className="text-left px-3 py-2.5 font-medium">Target Terealisasi</th>
  <th className="text-center px-3 py-2.5 font-medium">Bukti</th>
  <th className="text-left px-3 py-2.5 font-medium">Pelaksana</th>
  <th className="text-right px-3 py-2.5 font-medium">Aksi</th>
  </tr>
  </thead>
  <tbody>
  {allReals.length === 0 ? (
  <tr>
  <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-[#a8a29e]">
  {hasActiveFilter ? "Tidak ada realisasi yang cocok filter." : "Belum ada realisasi."}
  </td>
  </tr>
  ) : allReals.map(({ r, empId, sourceTitle }, idx) => {
  const canE = canEdit(r);
  const canD = canDelete(r);
  const buktiCount = attachments.filter(a => a.realizationId === r.id).length;
  const emp = employees.find(e => e.id === empId);
  const targets = (r as any).targets as Array<{id:string,name:string,value:string,unit:string}> | undefined;
  const isDelegasi = sourceTitle !== plan.title;
  return (
  <tr key={r.id} onClick={() => router.push(`/realisasi/${r.id}`)} className="border-b border-[#e8e6e5] hover:bg-[#fafaf9]/80 cursor-pointer transition-colors group">
  <td className="px-3 py-3 text-[12px] text-[#a8a29e] tabular-nums align-top">{idx + 1}</td>
  <td className="px-3 py-3 align-top">
  <div className="font-medium text-[13px] leading-tight text-[#0c0a09] truncate" title={sourceTitle}>{sourceTitle}</div>
  {isDelegasi && <div className="text-[10px] px-1.5 py-0 rounded-full bg-[#c1e1f7] border border-[#e8e6e5] text-[#0c0a09] inline-flex mt-1">Delegasi</div>}
  </td>
  <td className="px-3 py-3 align-top">
  <div className="font-medium text-[13px] leading-tight text-[#0c0a09] group-hover:text-[#3ba6f1] group-hover:underline underline-offset-2 truncate" title={r.title}>{r.title || "Realisasi"}</div>
  <div className="text-[12px] text-[#0c0a09]/60 truncate" title={r.description}>{r.description || "—"}</div>
  </td>
  <td className="px-3 py-3 align-top whitespace-nowrap">
  <div className="text-[12px] font-medium text-[#0c0a09] tabular-nums">{formatTanggal(r.date)}</div>
  <div className="text-[11px] text-[#a8a29e] tabular-nums">{(r as any).time ?? "09:00"} WIB</div>
  </td>
  <td className="px-3 py-3 align-top">
  {targets && targets.length>0 ? (
  <div className="flex flex-wrap gap-1">
  {targets.slice(0,3).map(t=>(
  <span key={t.id} className="inline-flex px-1.5 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[11px] text-[#0c0a09] whitespace-nowrap">{t.name}: <span className="font-medium ml-0.5">{t.value}</span> <span className="text-[#a8a29e] ml-0.5">{t.unit}</span></span>
  ))}
  {targets.length>3 && <span className="text-[10px] text-[#a8a29e]">+{targets.length-3} lagi</span>}
  </div>
  ) : <span className="text-[12px] text-[#a8a29e]">—</span>}
  </td>
  <td className="px-3 py-3 align-top text-center">
  {buktiCount>0 ? (
  <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#78716c]">
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> {buktiCount}
  </span>
  ) : <span className="text-[11px] text-[#a8a29e]">—</span>}
  </td>
  <td className="px-3 py-3 align-top">
  {emp ? (
  <><div className="text-[12px] font-medium text-[#0c0a09] truncate" title={emp.name}>{emp.name.split(",")[0]}</div><div className="text-[11px] text-[#a8a29e] truncate">{emp.role}</div></>
  ) : <span className="text-[11px] text-[#a8a29e]">—</span>}
  </td>
  <td className="px-3 py-3 align-top text-right">
  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
  <button onClick={() => router.push(`/realisasi/${r.id}`)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:border-[#d6d3d1] hover:text-[#0c0a09] transition-colors" title="Detail">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
  <button onClick={() => exportRealizationDetail(r)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:border-[#d6d3d1] hover:text-[#0c0a09] transition-colors" title="Export Excel">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  </button>
  {canE && (
  <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:border-[#d6d3d1] hover:text-[#0c0a09] transition-colors" title="Edit">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
  </button>
  )}
  {canD && (
  <button onClick={() => setConfirmDelete({ id: r.id, title: r.title })} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#a8a29e] flex items-center justify-center hover:bg-[#fef2f2] hover:border-[#e8e6e5] hover:text-[#b91c1c] transition-colors" title={canE ? "Hapus": "Hapus oleh atasan"}>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
  </button>
  )}
  </div>
  </td>
  </tr>
  );
  })}
  </tbody>
  </table>
  </div>
  </div>
  );
  }).filter(Boolean) as React.ReactNode[];
 if (rendered.length === 0) {
 return (
 <div className="p-8 text-center border border-dashed bg-white rounded-xl" style={{ borderRadius: 12, borderColor: "#d6d3d1"}}>
 <p className="text-[14px] text-[#0c0a09]/60">{hasActiveFilter ? "Tidak ada realisasi yang cocok filter." : "Belum ada realisasi."}</p>
 <p className="text-[12px] text-[#a8a29e] mt-1">Coba ubah filter atau reset.</p>
 </div>
 );
 }
 return <div className="space-y-3">{rendered}</div>;
 })()}
 </div>
 )}

 {/* Tab: Realisasi Bawahan */}
 {tab === "bawahan"&& isAtasan && (
 <div className="space-y-4">
  <div className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e8e6e5"}}>
  <div className="overflow-x-auto">
  <table className="w-full text-[14px] table-fixed">
  <colgroup>
  <col style={{width:"40px"}} />
  <col style={{width:"200px"}} />
  <col style={{width:"220px"}} />
  <col style={{width:"130px"}} />
  <col style={{width:"190px"}} />
  <col style={{width:"70px"}} />
  <col style={{width:"130px"}} />
  <col style={{width:"140px"}} />
  </colgroup>
  <thead className="bg-[#fafaf9] border-b border-[#e8e6e5] text-[11px] tracking-[0.04em] uppercase text-[#0c0a09]/60">
  <tr>
  <th className="text-left px-3 py-2.5 font-medium">#</th>
  <th className="text-left px-3 py-2.5 font-medium">Rencana</th>
  <th className="text-left px-3 py-2.5 font-medium">Judul Realisasi</th>
  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Tanggal & Jam</th>
  <th className="text-left px-3 py-2.5 font-medium">Target Terealisasi</th>
  <th className="text-center px-3 py-2.5 font-medium">Bukti</th>
  <th className="text-left px-3 py-2.5 font-medium">Pelaksana</th>
  <th className="text-right px-3 py-2.5 font-medium">Aksi</th>
  </tr>
  </thead>
  <tbody>
  {bawahanPaginated.length === 0 ? (
  <tr><td colSpan={8} className="px-4 py-10 text-center text-[#0c0a09]/60">Tidak ada realisasi yang cocok filter.<br/><span className="text-[12px]">Coba ubah filter atau reset.</span></td></tr>
  ) : bawahanPaginated.map((r, idx) => {
  const plan = plans.find(p => p.id === r.planId);
  const emp = r.uploadedBy ? employees.find(e=>e.id===r.uploadedBy) : (plan ? employees.find(e => e.id === plan.assignedTo) : null);
  const canDel = canDelete(r);
  const buktiCount = attachments.filter(a=>a.realizationId===r.id).length;
  const targets = (r as any).targets as Array<{id:string,name:string,value:string,unit:string}> | undefined;
  return (
  <tr key={r.id} onClick={() => router.push(`/realisasi/${r.id}`)} className="border-b border-[#e8e6e5] hover:bg-[#fafaf9]/80 cursor-pointer transition-colors group">
  <td className="px-3 py-3 text-[12px] text-[#a8a29e] tabular-nums align-top">{(page - 1) * pageSize + idx + 1}</td>
  <td className="px-3 py-3 align-top">
  <div className="font-medium text-[13px] leading-tight text-[#0c0a09] truncate" title={plan?.title}>{plan?.title ?? "-"}</div>
  <div className="text-[11px] text-[#a8a29e] mt-0.5 truncate">{plan ? `Target ${plan.target} • ${plan.progress}%` : ""}</div>
  </td>
  <td className="px-3 py-3 align-top">
  <div className="font-medium text-[13px] leading-tight text-[#0c0a09] group-hover:text-[#3ba6f1] group-hover:underline underline-offset-2 truncate" title={r.title}>{r.title || "Realisasi"}</div>
  <div className="text-[12px] text-[#0c0a09]/60 truncate" title={r.description}>{r.description || "—"}</div>
  </td>
  <td className="px-3 py-3 align-top whitespace-nowrap">
  <div className="text-[12px] font-medium text-[#0c0a09] tabular-nums">{formatTanggal(r.date)}</div>
  <div className="text-[11px] text-[#a8a29e] tabular-nums">{(r as any).time ?? "09:00"} WIB</div>
  </td>
  <td className="px-3 py-3 align-top">
  {targets && targets.length>0 ? (
  <div className="flex flex-wrap gap-1">
  {targets.slice(0,3).map((t:any)=>(
  <span key={t.id} className="inline-flex px-1.5 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[11px] text-[#0c0a09] whitespace-nowrap">{t.name}: <span className="font-medium ml-0.5">{t.value}</span> <span className="text-[#a8a29e] ml-0.5">{t.unit}</span></span>
  ))}
  {targets.length>3 && <span className="text-[10px] text-[#a8a29e]">+{targets.length-3} lagi</span>}
  </div>
  ) : <span className="text-[12px] text-[#a8a29e]">—</span>}
  </td>
  <td className="px-3 py-3 align-top text-center">
  {buktiCount>0 ? (
  <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#78716c]">
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> {buktiCount}
  </span>
  ) : <span className="text-[11px] text-[#a8a29e]">—</span>}
  </td>
  <td className="px-3 py-3 align-top">
  <div className="text-[12px] font-medium text-[#0c0a09] truncate" title={emp?.name}>{emp?.name?.split(",")[0] ?? "-"}</div>
  <div className="text-[11px] text-[#a8a29e] truncate">{emp?.role}{r.uploadedBy ? "" : " • via penugasan"}</div>
  </td>
  <td className="px-3 py-3 align-top text-right" onClick={e => e.stopPropagation()}>
  <div className="flex items-center justify-end gap-1">
  <button onClick={() => router.push(`/realisasi/${r.id}`)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:border-[#d6d3d1] hover:text-[#0c0a09] transition-colors" title="Detail">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
  <button onClick={() => exportRealizationDetail(r)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] flex items-center justify-center hover:bg-[#fafaf9] hover:border-[#d6d3d1] hover:text-[#0c0a09] transition-colors" title="Export Excel">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  </button>
  {canDel ? (
  <button onClick={() => setConfirmDelete({ id: r.id, title: r.title })} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center hover:bg-[#fef2f2] hover:border-[#e8e6e5]" title="Hapus (atasan)">
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
  </button>
  ) : <span className="text-[11px] text-[#a8a29e] px-1">—</span>}
  </div>
  </td>
  </tr>
  );
  })}
  </tbody>
  </table>
  </div>
  </div>
 {/* Pagination */}
 <div className="flex items-center justify-between">
 <div className="text-[12px] text-[#0c0a09]/60">Hal {page} dari {bawahanTotalPages} • {bawahanRealisasiFiltered.length} realisasi</div>
 <div className="flex gap-2">
 <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1.5 rounded-full border text-[12px] ${page <= 1 ? " border-[#e8e6e5] bg-white text-[#0c0a09]/40 cursor-not-allowed": " border-[#d6d3d1] bg-white hover:bg-[#fafaf9]"}`} style={{ borderRadius: 100 }}>‹ Prev</button>
 <button disabled={page >= bawahanTotalPages} onClick={() => setPage(p => Math.min(bawahanTotalPages, p + 1))} className={`px-3 py-1.5 rounded-full border text-[12px] ${page >= bawahanTotalPages ? " border-[#e8e6e5] bg-white text-[#0c0a09]/40 cursor-not-allowed": " border-[#d6d3d1] bg-white hover:bg-[#fafaf9]"}`} style={{ borderRadius: 100 }}>Next ›</button>
 </div>
 </div>
 <p className="text-[12px] text-[#0c0a09]/50">Atasan dapat menghapus realisasi bawahan yang belum terealisasi nyata (tanpa menambah/mengubah).</p>
 </div>
 )}

  {/* Konfirmasi hapus */}
 {confirmDelete && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
 <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5] overflow-hidden" style={{ borderRadius: 12 }}>
 <div className="p-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[#fafaf9] border border-[#e8e6e5] flex items-center justify-center text-[#b91c1c] font-medium shrink-0">!</div>
 <div>
 <h3 className="subheading leading-tight">Hapus realisasi ini?</h3>
 <p className="text-[12px] tracking-wide text-[#0c0a09]/60 mt-0.5">Aksi tidak dapat dibatalkan • progress akan dihitung ulang</p>
 </div>
 </div>
 <p className="text-[14px] text-[#0c0a09]/80 mt-3 leading-6">"{confirmDelete.title}"</p>
 </div>
 <div className="p-4 border-t border-[#e8e6e5] flex gap-2 justify-end">
 <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{ borderRadius: 48 }}>Batal</button>
 <button onClick={async () => { const d = confirmDelete; setConfirmDelete(null); if (d) await handleDeleteRealization(d.id, d.title); }} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-[14px] font-medium hover:bg-[#991b1b]" style={{ borderRadius: 48 }}>Ya, Hapus</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
