"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useSKP } from "@/lib/store";
import { ROLE_LABEL, ROLE_SHORT } from "@/lib/roles";

export default function KinerjaPerOrang() {
  const { plans, realizations, employees, periods, currentUser, getSubordinates } = useSKP();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // scope pegawai yang boleh dilihat
  const scopePegawai = useMemo(() => {
    if (!currentUser) return [] as typeof employees;
    if (currentUser.role === "admin" || currentUser.role === "pimpinan_1") {
      return employees.filter(e => e.role !== "admin");
    }
    if (currentUser.role === "pimpinan_2" || currentUser.role === "pimpinan_3") {
      const subs = getSubordinates(currentUser.id);
      return [currentUser, ...subs].filter(e => e.role !== "admin");
    }
    return [currentUser];
  }, [employees, currentUser, getSubordinates]);

  const filteredPegawai = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return scopePegawai;
    return scopePegawai.filter(e => e.name.toLowerCase().includes(query) || e.employeeNumber.includes(query) || e.email.toLowerCase().includes(query));
  }, [scopePegawai, q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // default pilih diri sendiri
  const effectiveId = selectedId ?? currentUser?.id ?? null;
  const selected = effectiveId ? employees.find(e => e.id === effectiveId) ?? null : null;

  // build kinerja per orang — reuse dashboard logic: Pelaksana + Participant + Kontributor
  const kinerja = useMemo(() => {
    if (!selected) return { involved: [] as Array<{ plan: typeof plans[number]; roles: Set<string> }>, realisasiRows: [] as any[] };
    const map = new Map<string, { plan: typeof plans[number]; roles: Set<string> }>();
    // Pelaksana
    for (const p of plans) {
      if (p.assignedTo === selected.id) {
        const entry = map.get(p.id) ?? { plan: p, roles: new Set<string>() };
        entry.roles.add("Pelaksana");
        map.set(p.id, entry);
      }
    }
    // Participant
    for (const r of realizations) {
      const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
      if (!parts) continue;
      const myPart = parts.find(pp => pp.employeeId === selected.id);
      if (myPart) {
        const plan = plans.find(p => p.id === r.planId);
        if (!plan) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add(myPart.role);
        map.set(plan.id, entry);
      }
    }
    // Kontributor (uploader)
    for (const r of realizations) {
      if (r.uploadedBy === selected.id) {
        const plan = plans.find(p => p.id === r.planId);
        if (!plan || plan.assignedTo === selected.id) continue;
        const parts = (r as any).participants as Array<{employeeId:string}> | undefined;
        const already = parts?.some(p=>p.employeeId===selected.id);
        if (already) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add("Kontributor");
        map.set(plan.id, entry);
      }
    }
    const involved = [...map.values()].sort((a,b)=> a.plan.title.localeCompare(b.plan.title));
    // realisasi rows: tiap realisasi dari plan-plan involved
    const planIds = new Set(involved.map(v=>v.plan.id));
    const realisasiRows = realizations
      .filter(r => planIds.has(r.planId))
      .map(r => {
        const plan = plans.find(p=>p.id===r.planId)!;
        const targs = (r as any).targets as Array<{name:string,value:string,unit:string}> | undefined;
        const tStr = targs && targs.length>0 ? targs.map(t=>`${t.name}: ${t.value} ${t.unit}`).join(" | ") : "-";
        const emp = employees.find(e=>e.id===r.uploadedBy);
        return {
          planTitle: plan.title,
          period: periods.find(p=>p.id===plan.skpPeriodId)?.name ?? plan.skpPeriodId,
          target: plan.target,
          progress: plan.progress,
          judul: (r as any).title || "Realisasi",
          tanggal: r.date,
          jam: (r as any).time ?? "09:00",
          pelaksana: emp?.name ?? r.uploadedBy ?? "-",
          tStr,
          deskripsi: r.description ?? "",
        };
      })
      .sort((a,b)=> b.tanggal.localeCompare(a.tanggal));
    return { involved, realisasiRows };
  }, [selected, plans, realizations, employees, periods]);

  const exportExcel = () => {
    if (!selected) return;
    const header = ["No","Judul Rencana","Periode","Peran Saya","Target","Progress %","Status","Tgl Rencana","Rincian Target","Judul Realisasi","Tgl Realisasi","Jam","Target Terealisasi","Deskripsi","Pelaksana Realisasi"];
    const rows: (string|number)[][] = [];
    if (kinerja.involved.length === 0) {
      rows.push([1,"-","-","-","-","-","-","-","-","-","-","-","-","-","-"]);
    } else {
      let no = 1;
      for (const { plan, roles } of kinerja.involved) {
        const period = periods.find(p=>p.id===plan.skpPeriodId)?.name ?? plan.skpPeriodId;
        const rincian = (plan.customTargets && plan.customTargets.length>0) ? plan.customTargets.map(ct=>`${ct.name}: ${ct.value} ${ct.unit}`).join(" | ") : "-";
        const status = Number(plan.target) > 0 && plan.progress >= 100 ? "Tercapai" : plan.progress > 0 ? "Berjalan" : "Belum";
        const tglRencana = (plan as any).plannedDate ?? "";
        const involvedRealis = kinerja.realisasiRows.filter(r=>r.planTitle === plan.title);
        if (involvedRealis.length === 0) {
          rows.push([no++, plan.title, period, [...roles].join(", "), plan.target, plan.progress, status, tglRencana, rincian, "-", "-", "-", "-", "-", "-"]);
        } else {
          for (const rr of involvedRealis) {
            rows.push([no++, plan.title, period, [...roles].join(", "), plan.target, plan.progress, status, tglRencana, rincian, rr.judul, rr.tanggal, rr.jam, rr.tStr, rr.deskripsi.replace(/\r?\n/g," ").slice(0,300), rr.pelaksana]);
          }
        }
      }
    }
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    // kolom auto-width biar langsung rapi tanpa perlu Text to Columns
    ws["!cols"] = [{wch:4},{wch:30},{wch:12},{wch:18},{wch:6},{wch:10},{wch:10},{wch:12},{wch:25},{wch:25},{wch:12},{wch:6},{wch:22},{wch:30},{wch:18}];
    // freeze header
    (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kinerja");
    XLSX.writeFile(wb, `kinerja-${selected.employeeNumber || selected.id}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-4">
      <div className="seline-card !p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">KINERJA PER PEGAWAI</p>
            <h3 className="subheading mt-1">Kinerja seseorang</h3>
            <p className="text-[13px] text-[#78716c] mt-1 max-w-[560px]">Pilih pegawai untuk melihat semua rencana, target, tiap realisasi, dan semua rencana yang dia terlibat (Pelaksana / Participant / Kontributor) — lalu export .xlsx 1 tabel rapi (langsung kebuka kolom-kolom di Excel).</p>
          </div>
          <button onClick={exportExcel} disabled={!selected || kinerja.involved.length===0} className="btn-primary disabled:opacity-40">⬇ Export Excel</button>
        </div>

        <div className="mt-4" ref={dropRef}>
          <label className="eyebrow">Pilih pegawai</label>
          <button type="button" onClick={()=>setOpen(v=>!v)} className="mt-1 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] bg-white border border-[#e8e6e5] hover:border-[#d6d3d1] text-left transition-colors shadow-subtle">
            <span className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[10px] font-medium shrink-0">{selected?.avatar ?? "?"}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-medium text-[#0c0a09] leading-none truncate">{selected ? selected.name.split(",")[0] : "Pilih pegawai"}</span>
              <span className="block text-[11px] text-[#78716c] truncate">{selected ? `${selected.employeeNumber} • ${ROLE_SHORT[selected.role]}` : `${scopePegawai.length} pegawai tersedia`}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`shrink-0 text-[#a8a29e] transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open && (
            <div className="mt-1.5 bg-white border border-[#e8e6e5] rounded-[10px] shadow-md overflow-hidden">
              <div className="p-2 border-b border-[#e8e6e5] bg-[#fafaf9]/50">
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a8a29e] pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"/><path d="M20 20 16 16"/></svg>
                  <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari nama, NIP, atau email..." className="seline-input w-full pl-8 pr-7 !py-2" />
                  {q && (
                    <button onClick={()=>setQ("")} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] flex items-center justify-center" aria-label="Hapus">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6 18 18"/><path d="M18 6 6 18"/></svg>
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#a8a29e]">{filteredPegawai.length} dari {scopePegawai.length}</span>
                  {q && <button onClick={()=>setQ("")} className="text-[#3ba6f1] hover:underline">Reset</button>}
                </div>
              </div>
              <div className="max-h-[220px] overflow-y-auto p-1">
                {filteredPegawai.map(e=>{
                  const active = e.id===effectiveId;
                  return (
                    <button key={e.id} onClick={()=>{setSelectedId(e.id); setOpen(false); setQ("");}} className={`w-full text-left px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 transition-colors ${active ? "bg-[#c1e1f7]/60 border border-[#e8e6e5]" : "border border-transparent hover:bg-[#fafaf9] hover:border-[#e8e6e5]"}`}>
                      <span className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[10px] font-medium shrink-0">{e.avatar}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-[#0c0a09] leading-none truncate">{e.name.split(",")[0]}</span>
                        <span className="block text-[11px] text-[#78716c] truncate">{e.employeeNumber} • {ROLE_SHORT[e.role]}</span>
                      </span>
                      {active ? <span className="w-2 h-2 rounded-full bg-[#3ba6f1] shrink-0"/> : null}
                    </button>
                  );
                })}
                {filteredPegawai.length===0 && <div className="px-2.5 py-8 text-center text-[12px] text-[#a8a29e]">Tidak ada pegawai</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="seline-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[12px] font-medium">{selected.avatar}</span>
              <div>
                <div className="text-[14px] font-medium text-[#0c0a09]">{selected.name}</div>
                <div className="text-[11px] text-[#78716c]">{selected.employeeNumber} • {ROLE_LABEL[selected.role]} • {selected.email}</div>
              </div>
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]">{kinerja.involved.length} rencana terlibat • {kinerja.realisasiRows.length} realisasi</span>
          </div>

          <div className="mt-4 overflow-x-auto border border-[#e8e6e5] rounded-[10px]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#fafaf9] text-[11px] uppercase tracking-[0.06em] text-[#78716c]">
                <tr>
                  <th className="text-left px-2.5 py-2 font-medium">No</th>
                  <th className="text-left px-2.5 py-2 font-medium">Rencana</th>
                  <th className="text-left px-2.5 py-2 font-medium">Peran</th>
                  <th className="text-center px-2.5 py-2 font-medium">Target</th>
                  <th className="text-center px-2.5 py-2 font-medium">Progress</th>
                  <th className="text-left px-2.5 py-2 font-medium">Realisasi</th>
                </tr>
              </thead>
              <tbody>
                {kinerja.involved.length===0 ? (
                  <tr><td colSpan={6} className="px-2.5 py-8 text-center text-[#a8a29e]">Belum terlibat di rencana manapun</td></tr>
                ) : kinerja.involved.map(({plan, roles}, idx)=>{
                  const period = periods.find(p=>p.id===plan.skpPeriodId)?.name ?? "-";
                  const rincian = plan.customTargets && plan.customTargets.length>0 ? plan.customTargets.map(ct=>`${ct.name}: ${ct.value} ${ct.unit}`).join(" | ") : "-";
                  const realCount = kinerja.realisasiRows.filter(r=>r.planTitle===plan.title).length;
                  return (
                    <tr key={plan.id} className="border-t border-[#e8e6e5] hover:bg-[#fafaf9]/50">
                      <td className="px-2.5 py-2 text-[#a8a29e]">{idx+1}</td>
                      <td className="px-2.5 py-2">
                        <div className="font-medium text-[#0c0a09] leading-tight">{plan.title}</div>
                        <div className="text-[11px] text-[#a8a29e]">{period} • {rincian.slice(0,60)}{rincian.length>60?"…":""}</div>
                      </td>
                      <td className="px-2.5 py-2"><div className="flex flex-wrap gap-1">{[...roles].map(r=><span key={r} className="px-1.5 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[11px] text-[#0c0a09]">{r}</span>)}</div></td>
                      <td className="px-2.5 py-2 text-center font-medium text-[#0c0a09]">{plan.target}</td>
                      <td className="px-2.5 py-2 text-center"><span className="inline-flex items-center gap-1"><span className="w-10 h-1 bg-[#fafaf9] border border-[#e8e6e5] rounded-full overflow-hidden"><span className="block h-full bg-[#3ba6f1]" style={{width:`${Math.min(plan.progress,100)}%`}}/></span><span className="text-[11px] font-medium">{plan.progress}%</span></span></td>
                      <td className="px-2.5 py-2 text-center text-[#78716c]">{realCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-[#a8a29e]">.xlsx 1 tabel: tiap baris = 1 realisasi (jika tanpa realisasi tetap 1 baris “-”). Kolom langsung terpisah rapi di Excel tanpa Text to Columns.</div>
        </div>
      )}
    </div>
  );
}
