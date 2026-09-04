"use client";
import { useMemo } from "react";
import * as XLSX from "xlsx";
import { useSKP } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";

// Laporan SKP (pekerjaan/kinerja).
// Menggunakan data SKP SUDAH ADA (plans + realizations). Export XLSX multi-sheet
// Hak akses mengikuti lingkup kewenangan: admin = semua, pimpinan_1 = semua,
// pimpinan_2/3 = diri + subtree (supervisorId), staf = akun sendiri.

export default function SkpReport() {
 const { plans, realizations, employees, periods, currentUser, getSubordinates } = useSKP();

 // Lingkup pegawai yang boleh dilihat sesuai role — kompatibel dengan store saat ini
 // (hanya supervisorId single chain, tanpa EmployeeSupervisor multi-relasi).
 const canViewIds = useMemo(() => {
 if (!currentUser) return new Set<string>();
 const me = currentUser.id;
 if (currentUser.role === "staf") return new Set([me]);
 if (currentUser.role === "admin"|| currentUser.role === "pimpinan_1") return new Set(employees.map(e => e.id));
 // pimpinan_2 / pimpinan_3 : diri + bawahan langsung/tidak langsung via isSubordinate chain
 const subs = getSubordinates(me).map(e => e.id);
 return new Set([me, ...subs]);
 }, [employees, currentUser, getSubordinates]);

 const rows = useMemo(() => {
 const nameOf = (id: string) => employees.find(e => e.id === id);
 const periodName = (id: string) => periods.find(p => p.id === id)?.name || id;

 const accessible = currentUser ? plans.filter(p => canViewIds.has(p.assignedTo)) : [];

 return accessible
 .map(p => {
 const assigned = nameOf(p.assignedTo);
 const created = nameOf(p.createdBy);
 const rels = realizations.filter(r => r.planId === p.id);
 // Penilai = atasan langsung assignedTo (supervisorId) atau pembuat rencana
 const supervisor = assigned?.supervisorId ? nameOf(assigned.supervisorId) : null;
 const penilai = supervisor?.name?.split(",")[0] ?? created?.name?.split(",")[0] ?? "—";

 const realisasi = rels.reduce((acc, r) => acc + (Number(r.value) || 0), 0);
 const progress = p.progress;
 const status = Number(p.target) > 0 && progress >= Number(p.target) ? "Tercapai"
 : progress > 0 ? "Berjalan"
 : "Belum";

 return {
 nama: assigned?.name || p.assignedTo,
 nip: assigned?.employeeNumber || "—",
 jabatan: assigned ? ROLE_LABEL[assigned.role] : "—",
 periode: periodName(p.skpPeriodId),
 sasaran: p.title,
 indikator: "",
 target: p.target,
 realisasi,
 progress,
 status,
 penilai: penilai || "—",
 dibuatOleh: created?.name?.split(",")[0] || "—",
 };
 })
 .sort((a, b) => a.nama.localeCompare(b.nama));
 }, [plans, realizations, employees, periods, canViewIds, currentUser]);

  const exportExcel = () => {
    if (rows.length === 0) return;
    const header = ["No","Nama","NIP","Jabatan/Unit","Periode SKP","Sasaran/Kegiatan","Indikator","Target","Realisasi","Progress %","Status","Pimpinan/Penilai","Dibuat Oleh","Rincian Target","Capaian Rincian"];
    const data: (string|number)[][] = [header];
    rows.forEach((r,i)=>{
      // cari plan asli untuk rincian
      const plan = plans.find(p=> p.title===r.sasaran && (employees.find(e=>e.name===r.nama)?.id === p.assignedTo || r.nama.includes(p.title.slice(0,10))));
      // fallback: cari by judul + periode
      const srcPlan = plans.find(p=> p.title===r.sasaran) ?? null;
      const rincian = srcPlan && (srcPlan as any).customTargets?.length ? (srcPlan as any).customTargets.map((ct:any)=> `${ct.name}: ${ct.value} ${ct.unit}`).join(" | ") : "-";
      // hitung capaian per rincian dari realisasi
      let capaian = "-";
      if (srcPlan && (srcPlan as any).customTargets?.length) {
        const rels = realizations.filter(rr=> rr.planId===srcPlan.id);
        // include turunan jika ada (delegasi)
        const descendantIds = new Set<string>();
        const queue: string[] = plans.filter(x=> x.parentId===srcPlan.id).map(x=>x.id);
        while(queue.length){ const cur=queue.shift()!; if(descendantIds.has(cur)) continue; descendantIds.add(cur); plans.filter(pp=> pp.parentId===cur).forEach(ch=> queue.push(ch.id)); }
        const allRels = [...rels, ...realizations.filter(rr=> descendantIds.has(rr.planId))];
        const totals = (srcPlan as any).customTargets.map((ct:any)=>{
          const norm = ct.name.trim().toLowerCase();
          let tot=0;
          for(const rr of allRels){
            const targs=(rr as any).targets as Array<{name:string,value:string}>|undefined;
            if(!targs) continue;
            for(const t of targs) if(t.name.trim().toLowerCase()===norm) tot+= parseFloat(String(t.value).replace(",","."))||0;
          }
          return `${ct.name}: ${Number.isInteger(tot)?tot:tot.toFixed(1)} ${ct.unit} / ${ct.value} ${ct.unit}`;
        }).join(" | ");
        capaian = totals || "-";
      }
      data.push([i+1, r.nama, r.nip, r.jabatan, r.periode, r.sasaran, r.indikator || "-", r.target, r.realisasi, r.progress, r.status, r.penilai, r.dibuatOleh, rincian, capaian]);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{wch:4},{wch:22},{wch:16},{wch:16},{wch:14},{wch:28},{wch:14},{wch:8},{wch:8},{wch:10},{wch:10},{wch:18},{wch:16},{wch:28},{wch:30}];
    (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
    (ws as any)["!autofilter"] = { ref: ws["!ref"] };
    // Sheet 2: Rincian Target per Rencana
    const rtHeader = ["No","Judul Rencana","Periode","Nama Target","Nilai Target","Satuan","Pelaksana","Progress"];
    const rtRows: (string|number)[][] = [];
    let rtNo=1;
    const accessiblePlans = currentUser ? plans.filter(p=> canViewIds.has(p.assignedTo)) : [];
    accessiblePlans.forEach(p=>{
      const period = periods.find(s=> s.id===p.skpPeriodId)?.name ?? p.skpPeriodId;
      const emp = employees.find(e=> e.id===p.assignedTo);
      const cts = (p as any).customTargets as Array<{name:string,value:string,unit:string}>|undefined;
      if (cts && cts.length) {
        cts.forEach((ct:any)=> rtRows.push([rtNo++, p.title, period, ct.name, ct.value, ct.unit, emp?.name ?? p.assignedTo, p.progress]));
      }
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan SKP");
    if (rtRows.length) {
      const wsRt = XLSX.utils.aoa_to_sheet([rtHeader, ...rtRows]);
      wsRt["!cols"] = [{wch:4},{wch:30},{wch:14},{wch:18},{wch:12},{wch:10},{wch:20},{wch:10}];
      (wsRt as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, wsRt, "Rincian Target");
    }
    XLSX.writeFile(wb, `laporan-skp-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

 return (
 <div className="space-y-4">
 <div className="bg-white border border-[#e8e6e5] rounded-[10px] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
 <div className="px-4 py-3 border-b border-[#fafaf9] flex flex-wrap items-center justify-between gap-2">
 <div>
 <span className="text-[12px] uppercase tracking-[0.07em] text-[#78716c]">Laporan SKP (Pekerjaan / Kinerja)</span>
 </div>
  {currentUser && (
  <button
  onClick={exportExcel}
  disabled={rows.length === 0}
  className="px-3.5 py-1.5 rounded-md bg-[#3ba6f1] text-white text-[12px] font-medium hover:bg-[#3398e1] disabled:opacity-50 inline-flex items-center gap-1.5"
  >
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  Export Excel
  </button>
  )}
 </div>

 {!currentUser ? (
 <div className="px-4 py-14 text-center text-[#78716c] text-[14px]">
 Memuat data laporan…
 </div>
 ) : rows.length === 0 ? (
 <div className="px-4 py-14 text-center text-[#78716c] text-[14px]">Belum ada data rencana kinerja.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-[12px]">
 <thead>
 <tr className="border-b border-[#e8e6e5] text-left text-[10px] uppercase tracking-[0.05em] text-[#0c0a09]/50">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Nama</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">NIP</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Jabatan/Unit</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Periode SKP</th>
 <th className="px-4 py-2.5 font-medium min-w-[220px]">Sasaran / Kegiatan</th>
 <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Target</th>
 <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Realisasi</th>
 <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Progress</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Pimpinan/Penilai</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((r, i) => (
 <tr key={i} className="border-b border-[#e8e6e5] last:border-0 hover:bg-[#fafaf9]/60 align-top">
 <td className="px-4 py-2.5 font-medium text-[#0c0a09] whitespace-nowrap">{r.nama}</td>
 <td className="px-4 py-2.5 text-[12px] text-[#0c0a09]/55 whitespace-nowrap">{r.nip}</td>
 <td className="px-4 py-2.5 text-[#0c0a09]/70 whitespace-nowrap">{r.jabatan}</td>
 <td className="px-4 py-2.5 text-[12px] text-[#0c0a09]/60 whitespace-nowrap">{r.periode}</td>
 <td className="px-4 py-2.5 text-[#0c0a09]">{r.sasaran}</td>
 <td className="px-4 py-2.5 text-right text-[12px] text-[#0c0a09]/70">{r.target}</td>
 <td className="px-4 py-2.5 text-right text-[12px] text-[#0c0a09]/70">{r.realisasi}</td>
 <td className="px-4 py-2.5 text-right text-[12px] text-[#3ba6f1]">{r.progress}%</td>
 <td className="px-4 py-2.5 whitespace-nowrap">
 <span className={`text-[12px] ${progressTone(r.status)}`}>{r.status}</span>
 </td>
 <td className="px-4 py-2.5 text-[#0c0a09]/70 whitespace-nowrap">{r.penilai}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}

function progressTone(status: string) {
 if (status === "Tercapai") return " text-[#3ba6f1]";
 if (status === "Berjalan") return " text-[#3ba6f1]";
 return " text-[#a8a29e]";
}
