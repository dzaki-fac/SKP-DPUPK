"use client";
import { useState, useMemo } from "react";
import { useSKP } from "@/lib/store";

export default function RealisasiPage() {
  const { realizations, plans, employees, attachments, periods, currentUser, isSubordinate, setShowRealizationModal, setEditingRealization, setRealForm, handleDeleteRealization, handleDeleteAttachment } = useSKP();
  const [tab, setTab] = useState<"saya" | "bawahan">("saya");
  const [selectedRealId, setSelectedRealId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pelaksanaFilter, setPelaksanaFilter] = useState<string>("all");
  const [buktiFilter, setBuktiFilter] = useState<"all" | "with" | "without">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "title_asc" | "title_desc">("date_desc");
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
    // Search: judul/deskripsi realisasi + judul rencana
    if (search) {
      const q = search.toLowerCase();
      const planTitle = plan.title.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !planTitle.includes(q)) return false;
    }
    // Periode
    if (periodeFilter !== "all" && plan.skpPeriodId !== periodeFilter) return false;
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
      if (buktiFilter === "with" && !hasBukti) return false;
      if (buktiFilter === "without" && hasBukti) return false;
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
    return isSubordinate(currentUser.id, plan.assignedTo) || (currentUser.role === "admin" && plan.assignedTo !== currentUser.id);
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

  // Effective customTargets: dari plan sendiri atau induk terdekat yang punya rincian — hanya itu yang boleh diisi
  const getEffectiveTargets = (plan: typeof plans[number] | null | undefined): Array<{name:string,value:string,unit:string}> => {
    if (!plan) return [];
    const direct = (plan as any).customTargets as Array<{name:string,value:string,unit:string}> | undefined;
    if (direct && direct.length > 0) return direct;
    if (!plan.parentId) return [];
    const parent = plans.find(p => p.id === plan.parentId);
    return parent ? getEffectiveTargets(parent) : [];
  };

  const openEdit = (r: (typeof realizations)[number]) => {
    const plan = plans.find(p => p.id === r.planId);
    if (!plan) return;
    if (!canEdit(r)) return;
    setEditingRealization(r);
    const effective = getEffectiveTargets(plan);
    const existingMap = new Map(((r as any).targets ?? []).map((t:any)=>[String(t.name).trim().toLowerCase(), t]));
    const mappedTargets = effective.length > 0
      ? effective.map((eff: any) => {
          const found: any = existingMap.get(eff.name.trim().toLowerCase());
          return { name: eff.name, value: found ? String(found.value) : "", unit: eff.unit };
        })
      : [];
    setRealForm({ title: r.title, value: r.value, description: r.description, date: r.date, time: (r as any).time ?? "09:00", files: [], targets: mappedTargets, participants: (r as any).participants?.map((p:any)=>({ employeeId: p.employeeId ?? undefined, customName: p.customName ?? undefined, role: p.role })) ?? [] });
    setShowRealizationModal(plan);
  };

  const openCreate = (plan: typeof plans[number]) => {
    if (plan.assignedTo !== currentUser.id) return;
    setEditingRealization(null);
    const effective = getEffectiveTargets(plan);
    const tpl = effective.map((ct: any) => ({ name: ct.name, value: "", unit: ct.unit }));
    setRealForm({ title: "", value: "1", description: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5), files: [], targets: tpl, participants: [] });
    setShowRealizationModal(plan);
  };

  const hasActiveFilter = search || periodeFilter !== "all" || dateFrom || dateTo || pelaksanaFilter !== "all" || buktiFilter !== "all" || sortBy !== "date_desc";

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">REALISASI</p>
        <h2 className="heading-serif text-[28px]">Kelola realisasi</h2>
        <p className="text-sm text-[#283338]/60 mt-1">Tugas Anda dan realisasi delegasi penerima — tambah dan pantau progres.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e4f0f1] pb-0">
        <button
          onClick={() => { setTab("saya"); setPage(1); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === "saya" ? "border-[#1c5d5f] text-[#1c5d5f]" : "border-transparent text-[#283338]/60 hover:text-[#283338]"}`}
        >
          Tugas Saya <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#e4f0f1] text-xs font-mono">{myPlans.length}</span>
        </button>
        {isAtasan && (
          <button
            onClick={() => { setTab("bawahan"); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition relative ${tab === "bawahan" ? "border-[#1c5d5f] text-[#1c5d5f]" : "border-transparent text-[#283338]/60 hover:text-[#283338]"}`}
          >
            Realisasi Delegasi Penerima <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#f2e8e2] text-xs font-mono">{bawahanRealisasiFiltered.length}</span>
          </button>
        )}
      </div>

      {/* Filter Bar — opsi 1: ringkas default, lanjutan collapsible */}
      <div className="bg-white border border-[#e4f0f1] rounded-xl p-4 space-y-3" style={{ borderRadius: 12 }}>
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs tracking-[0.06em] uppercase font-semibold text-[#283338]/70">Filter & Urutkan</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdvanced(v => !v)} className="text-xs px-3 py-1 rounded-full border border-[#e4f0f1] bg-[#f2f8f7] hover:bg-white text-[#1c5d5f]">{showAdvanced ? "Sembunyikan" : "Filter lanjutan"} ▾</button>
            {hasActiveFilter && (
              <button onClick={() => { setSearch(""); setPeriodeFilter("all"); setDateFrom(""); setDateTo(""); setPelaksanaFilter("all"); setBuktiFilter("all"); setSortBy("date_desc"); setPage(1); }} className="text-xs text-[#b91c1c] hover:underline">Reset</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Cari rencana / realisasi</label>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari judul rencana, judul/deskripsi realisasi..." className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Periode</label>
            <select value={periodeFilter} onChange={e => { setPeriodeFilter(e.target.value); setPage(1); }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }}>
              <option value="all">Semua periode</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name} — {p.startDate} s/d {p.endDate}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Urutkan</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }}>
              <option value="date_desc">Tanggal terbaru → lama</option>
              <option value="date_asc">Tanggal lama → terbaru</option>
              <option value="title_asc">Judul A-Z</option>
              <option value="title_desc">Judul Z-A</option>
            </select>
          </div>
        </div>
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-dashed border-[#e4f0f1]">
            <div>
              <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Dari tanggal</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} />
              {dateFrom && dateTo && dateFrom > dateTo && <p className="font-mono text-[10px] text-[#b91c1c] mt-1">Dari tanggal tidak boleh &gt; sampai tanggal</p>}
            </div>
            <div>
              <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Sampai tanggal</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} />
            </div>
            <div>
              <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Bukti</label>
              <select value={buktiFilter} onChange={e => { setBuktiFilter(e.target.value as any); setPage(1); }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }}>
                <option value="all">Semua</option>
                <option value="with">Dengan bukti</option>
                <option value="without">Tanpa bukti</option>
              </select>
            </div>
            {tab === "bawahan" && (
              <div>
                <label className="font-mono text-[11px] tracking-wide uppercase font-semibold text-[#283338]/60">Pelaksana</label>
                <select value={pelaksanaFilter} onChange={e => { setPelaksanaFilter(e.target.value); setPage(1); }} className="mt-1 w-full px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }}>
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
        <div className="font-mono text-[11px] text-[#283338]/50">
          {tab === "saya" ? `${myPlans.length} tugas` : `${bawahanRealisasiFiltered.length} dari ${bawahanRealisasiRaw.length} realisasi`} • {hasActiveFilter ? "filter aktif" : "tanpa filter"} {showAdvanced ? "• lanjutan terbuka" : ""}
        </div>
      </div>

      {/* Tab: Tugas Saya */}
      {tab === "saya" && (
        <div className="space-y-4">
          {myPlans.length === 0 ? (
            <div className="p-8 text-center border border-dashed bg-white rounded-xl" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>
              <p className="heading-serif text-lg">Belum ada tugas</p>
              <p className="text-sm text-[#283338]/60 mt-1">Tugas akan muncul di sini setelah atasan melimpahkan rencana kepada Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPlans.map(plan => {
                // Filter dan sort untuk plan ini
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
                // Gabungkan lalu filter & sort
                const allRaw = [
                  ...myRealsRaw.map(r => ({ r, empId: r.uploadedBy ?? plan.assignedTo })),
                  ...relatedRealsRaw.map(r => {
                    const childPlan = plans.find(p => p.id === r.planId);
                    return { r, empId: r.uploadedBy ?? childPlan?.assignedTo ?? "" };
                  }),
                ];
                let allReals = allRaw.filter(({r}) => matchesFilter(r));
                // Periode filter sudah di matchesFilter via plan, tapi untuk related perlu cek plan masing2 — sudah
                allReals = allReals.sort((a,b) => {
                  const aTime = (a.r as any).time ?? "00:00";
                  const bTime = (b.r as any).time ?? "00:00";
                  const aKey = `${a.r.date} ${aTime} ${a.r.title}`;
                  const bKey = `${b.r.date} ${bTime} ${b.r.title}`;
                  switch (sortBy) {
                    case "date_asc": return `${a.r.date} ${aTime}`.localeCompare(`${b.r.date} ${bTime}`);
                    case "date_desc": return `${b.r.date} ${bTime}`.localeCompare(`${a.r.date} ${aTime}`);
                    case "title_asc": return a.r.title.localeCompare(b.r.title);
                    case "title_desc": return b.r.title.localeCompare(a.r.title);
                    default: return `${b.r.date} ${bTime}`.localeCompare(`${a.r.date} ${aTime}`);
                  }
                });
                // Jika filter aktif dan tidak ada hasil untuk plan ini, cek apakah judul rencana cocok search — jika tidak, sembunyikan
                const planMatchesSearch = !search || plan.title.toLowerCase().includes(search.toLowerCase());
                const showEmptyDueToFilter = allRaw.length > 0 && allReals.length === 0 && hasActiveFilter && !planMatchesSearch;
                if (showEmptyDueToFilter) return null;
                // Jika plan tidak punya realisasi sama sekali dan filter aktif, hanya tampilkan jika judul rencana cocok
                if (hasActiveFilter && search && allRaw.length === 0 && !planMatchesSearch) return null;
                if (hasActiveFilter && periodeFilter !== "all" && plan.skpPeriodId !== periodeFilter) return null;

                if (allReals.length === 0 && !hasActiveFilter) {
                  return (
                    <div key={plan.id} className="px-4 py-3 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#231e21] leading-tight">{plan.title}</h3>
                          <div className="font-mono text-xs text-[#283338]/60">Target: {plan.target} • Progress: {plan.progress}%</div>
                        </div>
                        {plan.assignedTo === currentUser.id && (
                          <button onClick={() => openCreate(plan)} className="shrink-0 px-4 py-1.5 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90 whitespace-nowrap" style={{ borderRadius: 48 }}>+ Realisasi</button>
                        )}
                      </div>
                      <div className="mt-2 font-mono text-xs text-[#283338]/50">Belum ada realisasi.</div>
                    </div>
                  );
                }
                if (allReals.length === 0 && hasActiveFilter) {
                  return (
                    <div key={plan.id} className="px-4 py-3 border bg-white opacity-60" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                      <h3 className="font-medium text-[#231e21] leading-tight">{plan.title}</h3>
                      <div className="font-mono text-xs text-[#283338]/60">Target: {plan.target} • Progress: {plan.progress}%</div>
                      <div className="mt-2 font-mono text-xs text-[#283338]/50">Tidak ada realisasi yang cocok filter.</div>
                    </div>
                  );
                }
                // Flat list — opsi 1: 1 realisasi = 1 card (tanpa group per pegawai) — tombol + di pojok kanan sejajar judul
                return (
                  <div key={plan.id} className="px-4 py-3 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#231e21] leading-tight">{plan.title}</h3>
                        <div className="font-mono text-xs text-[#283338]/60">Target: {plan.target} • Progress: {plan.progress}% • {allReals.length} realisasi {hasActiveFilter ? "(terfilter)" : ""}</div>
                      </div>
                      {plan.assignedTo === currentUser.id && (
                        <button onClick={() => openCreate(plan)} className="shrink-0 px-4 py-1.5 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90 whitespace-nowrap" style={{ borderRadius: 48 }}>+ Realisasi</button>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      {allReals.map(({ r, empId }) => {
                        const canE = canEdit(r);
                        const canD = canDelete(r);
                        const buktiCount = attachments.filter(a => a.realizationId === r.id).length;
                        const emp = employees.find(e => e.id === empId);
                        return (
                          <div key={r.id} className="flex gap-3 p-3 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7]/40 hover:bg-white transition">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedRealId(r.id)} className="text-sm font-medium text-[#231e21] text-left hover:text-[#1c5d5f] hover:underline underline-offset-2 truncate" title="Lihat detail">
                                  {r.title || "Realisasi"}
                                </button>
                                {emp && <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-full bg-white border border-[#e4f0f1] font-mono text-[10px] text-[#283338]/60">{emp.name.split(",")[0]}</span>}
                              </div>
                              {(r as any).targets && (r as any).targets.length>0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(r as any).targets.map((t:any)=>(
                                    <span key={t.id} className="inline-flex px-1.5 py-0.5 rounded-full bg-white border border-[#e4f0f1] font-mono text-[10px] text-[#1c5d5f]">{t.name}: {t.value} {t.unit}</span>
                                  ))}
                                </div>
                              )}
                              <div className="font-mono text-[11px] text-[#283338]/50 mt-1">{formatTanggal(r.date)}, {(r as any).time ?? "09:00"} WIB{buktiCount>0 ? ` • 📎 ${buktiCount}` : ""}</div>
                            </div>
                            <div className="flex flex-row gap-1 shrink-0 self-start">
                              <button onClick={() => setSelectedRealId(r.id)} className="w-7 h-7 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/60 flex items-center justify-center hover:border-[#a2cbcd] hover:text-[#1c5d5f]" title="Detail">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              {canE && (
                                <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-full bg-white border border-[#a2cbcd] text-[#1c5d5f] flex items-center justify-center hover:bg-[#f2f8f7]" title="Edit">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
                                </button>
                              )}
                              {canD && (
                                <button onClick={() => setConfirmDelete({ id: r.id, title: r.title })} className="w-7 h-7 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]" title={canE ? "Hapus" : "Hapus oleh atasan"}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Realisasi Bawahan */}
      {tab === "bawahan" && isAtasan && (
        <div className="space-y-4">
          <div className="border bg-white overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f2f8f7] border-b border-[#e4f0f1] font-mono text-xs tracking-[0.04em] uppercase text-[#283338]/60">
                  <tr><th className="text-left px-4 py-3">Rencana (Delegasi Penerima)</th><th className="text-left px-4 py-3">Pelaksana</th><th className="text-left px-4 py-3">Realisasi</th><th className="text-right px-4 py-3">Aksi</th></tr>
                </thead>
                <tbody>
                  {bawahanPaginated.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-[#283338]/60">Tidak ada realisasi yang cocok filter.<br/><span className="text-xs">Coba ubah filter atau reset.</span></td></tr>
                  ) : bawahanPaginated.map(r => {
                    const plan = plans.find(p => p.id === r.planId);
                    const emp = r.uploadedBy ? employees.find(e=>e.id===r.uploadedBy) : (plan ? employees.find(e => e.id === plan.assignedTo) : null);
                    const canDel = canDelete(r);
                    return (
                      <tr key={r.id} className="border-b border-[#e4f0f1] hover:bg-[#f2f8f7]">
                        <td className="px-4 py-3"><div className="font-medium truncate max-w-[260px]">{plan?.title}</div><div className="text-xs text-[#283338]/60 truncate">{r.description}</div><div className="font-mono text-xs text-[#283338]/50">{formatTanggal(r.date)}, {(r as any).time ?? "09:00"} WIB</div></td>
                        <td className="px-4 py-3"><div className="text-xs font-medium text-[#231e21]">{emp?.name.split(",")[0] ?? "-"}</div><div className="font-mono text-[11px] text-[#283338]/50">{emp?.role}{r.uploadedBy ? "" : " (via penugasan)"}</div></td>
                         <td className="px-4 py-3"><button onClick={() => setSelectedRealId(r.id)} className="font-medium text-xs text-[#231e21] truncate text-left hover:text-[#1c5d5f] hover:underline underline-offset-2" title="Lihat detail realisasi">{r.title || "Realisasi"}</button><div className="text-xs text-[#283338]/60 truncate">{r.description || "—"}</div>{(r as any).targets && (r as any).targets.length>0 && (<div className="flex flex-wrap gap-1 mt-1">{(r as any).targets.map((t:any)=>(<span key={t.id} className="inline-flex px-1.5 py-0.5 rounded-full bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-[10px] text-[#1c5d5f]">{t.name}: {t.value} {t.unit}</span>))}</div>)}{attachments.filter(a => a.realizationId === r.id).map(a => <div key={a.id} className="text-xs text-[#1c5d5f] mt-1">📎 {a.fileName}</div>)}</td>
                         <td className="px-4 py-3 text-right">
                           {canDel ? (
                             <button onClick={() => setConfirmDelete({ id: r.id, title: r.title })} className="w-7 h-7 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2] ml-auto" title="Hapus (atasan)">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                             </button>
                           ) : <span className="font-mono text-[11px] text-[#283338]/40">—</span>}
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
            <div className="font-mono text-xs text-[#283338]/60">Hal {page} dari {bawahanTotalPages} • {bawahanRealisasiFiltered.length} realisasi</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1.5 rounded-full border text-xs ${page <= 1 ? "border-[#e4f0f1] bg-[#e4f0f1] text-[#283338]/40 cursor-not-allowed" : "border-[#a2cbcd] bg-white hover:bg-[#f2f8f7]"}`} style={{ borderRadius: 100 }}>‹ Prev</button>
              <button disabled={page >= bawahanTotalPages} onClick={() => setPage(p => Math.min(bawahanTotalPages, p + 1))} className={`px-3 py-1.5 rounded-full border text-xs ${page >= bawahanTotalPages ? "border-[#e4f0f1] bg-[#e4f0f1] text-[#283338]/40 cursor-not-allowed" : "border-[#a2cbcd] bg-white hover:bg-[#f2f8f7]"}`} style={{ borderRadius: 100 }}>Next ›</button>
            </div>
          </div>
          <p className="font-mono text-xs text-[#283338]/50">Atasan dapat menghapus realisasi bawahan yang belum terealisasi nyata (tanpa menambah/mengubah).</p>
        </div>
      )}

      {/* Modal: Detail Realisasi */}
      {selectedReal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setSelectedRealId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1] flex items-start justify-between gap-3">
              <h3 className="heading-serif text-lg leading-tight">{selectedReal.title || "Realisasi"}</h3>
              <button onClick={() => setSelectedRealId(null)} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center shrink-0">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div><div className="eyebrow text-[11px]">PENGIRIM</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{selectedRealEmp?.avatar ?? "?"}</span>
                  <div><div className="font-medium">{selectedRealEmp?.name ?? "-"}</div><div className="font-mono text-xs text-[#283338]/60">{selectedRealEmp?.role}{selectedReal.uploadedBy ? "" : " • data lama"}</div></div>
                </div>
              </div>
              <div><div className="eyebrow text-[11px]">TUGAS</div><div className="mt-1 text-[#283338]/80">{selectedRealPlan?.title ?? "-"}</div></div>
              <div><div className="eyebrow text-[11px]">TANGGAL & JAM</div><div className="font-mono text-xs mt-1 text-[#283338]/70">{formatTanggal(selectedReal.date)}, {(selectedReal as any).time ?? "09:00"} WIB</div></div>
              <div><div className="eyebrow text-[11px]">DESKRIPSI</div><div className="mt-1 leading-relaxed text-[#283338]/80 whitespace-pre-wrap">{selectedReal.description || "—"}</div></div>
              {(selectedReal as any).targets && (selectedReal as any).targets.length>0 && (
                <div><div className="eyebrow text-[11px]">TARGET TEREALISASI (DIISI PENGAJU)</div>
                  <div className="mt-1 grid grid-cols-1 gap-2">
                    {(selectedReal as any).targets.map((t:any)=>(
                      <div key={t.id} className="p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] flex justify-between items-center" style={{ borderRadius: 12 }}>
                        <span className="font-mono text-xs text-[#283338]/60">{t.name}</span>
                        <span className="font-mono text-sm font-bold text-[#1c5d5f]">{t.value} <span className="font-normal text-[#283338]/60">{t.unit}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(selectedReal as any).participants && (selectedReal as any).participants.length>0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="eyebrow text-[11px]">PEGAWAI TERLIBAT</div>
                    <button
                      onClick={() => {
                        const parts = (selectedReal as any).participants as any[];
                        const rows = parts.map((pp, idx) => {
                          const emp = pp.employeeId ? employees.find(e=>e.id===pp.employeeId) : null;
                          const name = emp?.name ?? pp.customName ?? pp.employeeId ?? "-";
                          const empNo = emp?.employeeNumber ?? "-";
                          return [idx+1, name, emp?.role ?? "-", pp.role, empNo];
                        });
                        const header = ["No","Nama","Jabatan","Peran di Realisasi","NIP"];
                        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
                        const bom = "\uFEFF";
                        const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `pegawai-terlibat-${selectedReal.title.replace(/[^a-zA-Z0-9]/g,"_").slice(0,30)}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="font-mono text-[11px] px-2 py-1 rounded-full bg-white border border-[#e4f0f1] text-[#1c5d5f] hover:bg-[#f2f8f7] flex items-center gap-1"
                      title="Ekspor ke Excel (CSV)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Ekspor Excel
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {(selectedReal as any).participants.map((pp:any)=>{
                      const emp = pp.employeeId ? employees.find(e=>e.id===pp.employeeId) : null;
                      const displayName = emp?.name ?? pp.customName ?? pp.employeeId ?? "-";
                      const isCustom = !pp.employeeId && !!pp.customName;
                      return <div key={pp.id} className="p-2 rounded-xl bg-[#f2e8e2]/50 border border-[#e4f0f1] flex items-center gap-2" style={{ borderRadius: 12 }}><span className="text-sm text-[#231e21] flex-1">{displayName} {isCustom ? <span className="font-mono text-[10px] text-[#283338]/60">(luar sistem)</span> : ""}</span><span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white border border-[#d6aec1] text-[#4a2c2a]">{pp.role}</span></div>;
                    })}
                  </div>
                </div>
              )}
              <div><div className="eyebrow text-[11px]">BUKTI ({attachments.filter(a => a.realizationId === selectedReal.id).length})</div>
                {attachments.filter(a => a.realizationId === selectedReal.id).length === 0 ? (
                  <div className="font-mono text-xs text-[#283338]/60 mt-1">Tidak ada bukti terlampir</div>
                ) : attachments.filter(a => a.realizationId === selectedReal.id).map(a => (
                  <div key={a.id} className="mt-1 p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs flex items-center justify-between gap-2" style={{ borderRadius: 12 }}>
                    <span className="truncate">📎 {a.fileName} • {a.fileSize} • {formatTanggal(a.date)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={a.filePath} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-full bg-white border border-[#e4f0f1] text-[#1c5d5f] hover:bg-[#e4f0f1] text-[11px]">lihat</a>
                      {canDeleteBukti(a) && (
                        <button onClick={() => handleDeleteAttachment(a.id, a.fileName)} className="w-6 h-6 rounded-full bg-white border border-[#d6aec1] text-[#b91c1c] flex items-center justify-center hover:bg-[#f2e8e2]" title="Hapus bukti">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {(() => {
                const canE = canEdit(selectedReal);
                const canD = canDelete(selectedReal);
                return (
                  <>
                    {(canE || canD) && (
                      <div className="pt-2 flex gap-2">
                        {canE && <button onClick={() => { const r = selectedReal; setSelectedRealId(null); openEdit(r); }} className="flex-1 py-2 rounded-full border border-[#a2cbcd] bg-white text-xs font-medium hover:bg-[#f2f8f7]" style={{ borderRadius: 48 }}>Edit</button>}
                        {canD && <button onClick={() => { const r = selectedReal; setSelectedRealId(null); setConfirmDelete({ id: r.id, title: r.title }); }} className="flex-1 py-2 rounded-full bg-[#b91c1c] text-white text-xs font-medium hover:bg-[#991b1b]" style={{ borderRadius: 48 }}>{canE ? "Hapus" : "Hapus oleh atasan"}</button>}
                      </div>
                    )}
                    {!canE && !canD && !selectedReal.uploadedBy && <div className="font-mono text-xs text-[#b91c1c] bg-[#f2e8e2] border border-[#d6aec1] p-2 rounded-xl" style={{ borderRadius: 12 }}>Data lama tanpa penulis — hanya atasan/admin yang dapat menghapus.</div>}
                    {!canE && canD && <div className="font-mono text-xs text-[#283338]/60 bg-[#f2f8f7] border border-[#e4f0f1] p-2 rounded-xl" style={{ borderRadius: 12 }}>Anda adalah atasan dari penulis — dapat menghapus jika realisasi belum terealisasi nyata.</div>}
                  </>
                );
              })()}
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex justify-end">
              <button onClick={() => setSelectedRealId(null)} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e4f0f1] overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f2e8e2] border border-[#d6aec1] flex items-center justify-center text-[#b91c1c] font-bold shrink-0">!</div>
                <div>
                  <h3 className="heading-serif text-lg leading-tight">Hapus realisasi ini?</h3>
                  <p className="font-mono text-xs tracking-wide text-[#283338]/60 mt-0.5">Aksi tidak dapat dibatalkan • progress akan dihitung ulang</p>
                </div>
              </div>
              <p className="text-sm text-[#283338]/80 mt-3 leading-6">"{confirmDelete.title}"</p>
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-full border border-[#e4f0f1] bg-white text-sm" style={{ borderRadius: 48 }}>Batal</button>
              <button onClick={async () => { const d = confirmDelete; setConfirmDelete(null); if (d) await handleDeleteRealization(d.id, d.title); }} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-sm font-medium hover:bg-[#991b1b]" style={{ borderRadius: 48 }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
