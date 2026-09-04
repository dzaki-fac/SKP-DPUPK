"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";
import { useSKP } from "@/lib/store";

export default function RencanaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { plans, employees, periods, realizations, attachments, currentUser, setShowCascadeModal } = useSKP();
  const [selectedRealId, setSelectedRealId] = useState<string | null>(null);
  if (!currentUser) return null;

  const selectedReal = selectedRealId ? realizations.find(r => r.id === selectedRealId) ?? null : null;
  const selectedRealPlan = selectedReal ? plans.find(p => p.id === selectedReal.planId) ?? null : null;
  const selectedRealEmp = selectedRealPlan ? employees.find(e => e.id === selectedRealPlan.assignedTo) ?? null : null;

  const plan = plans.find(p => p.id === id);
  if (!plan) {
    return (
      <div className="p-6 text-center border border-dashed bg-white" style={{ borderRadius: 10, borderColor: "#e8e6e5" }}>
        <div className="subheading">Rencana tidak ditemukan</div>
        <Link href="/rencana" className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px] font-medium" style={{ borderRadius: 9999 }}>← Kembali</Link>
      </div>
    );
  }

  const assignee = employees.find(e => e.id === plan.assignedTo);
  const period = periods.find(p => p.id === plan.skpPeriodId);
  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
    const dateOnly = dateStr.split(" ")[0];
    const [y, m, d] = dateOnly.split("-");
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const monthName = months[parseInt(m,10)-1] || m;
    return `${parseInt(d,10)} ${monthName} ${y}`;
  };

  const parentPlan = plan.parentId ? plans.find(p => p.id === plan.parentId) : null;

  const children = plans.filter(c => c.parentId === plan.id).sort((a,b) => {
    const na = employees.find(e=>e.id===a.assignedTo)?.name ?? "";
    const nb = employees.find(e=>e.id===b.assignedTo)?.name ?? "";
    return na.localeCompare(nb);
  });
  const parentTarget = parseFloat(String(plan.target).replace(",","."))||0;
  const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);

  const descendantIds = (() => {
    const ids = new Set<string>();
    const queue: string[] = children.map(c => c.id);
    while (queue.length) { const cur = queue.shift()!; if (ids.has(cur)) continue; ids.add(cur); plans.filter(pp => pp.parentId === cur).forEach(ch => queue.push(ch.id)); }
    return ids;
  })();
  const directReals = realizations.filter(r => r.planId === plan.id);
  const childReals = realizations.filter(r => descendantIds.has(r.planId));
  const totalDone = directReals.length + childReals.length;
  const disp = Number.isInteger(totalDone) ? totalDone : Number(totalDone.toFixed(1));

  type Item = { r: typeof directReals[number]; empId: string; sourceTitle: string };
  const allReals: Item[] = [
    ...directReals.map(r => ({ r, empId: plan.assignedTo, sourceTitle: plan.title })),
    ...childReals.map(r => {
      const cp = plans.find(p => p.id === r.planId);
      return { r, empId: cp?.assignedTo ?? "", sourceTitle: cp?.title ?? "-" };
    }),
  ].sort((a,b) => b.r.date.localeCompare(a.r.date));
  const byEmp = new Map<string, Item[]>();
  for (const item of allReals) {
    const arr = byEmp.get(item.empId) ?? [];
    arr.push(item);
    byEmp.set(item.empId, arr);
  }

  const customRealisasiTotals = (() => {
    if (!plan.customTargets || plan.customTargets.length === 0) return [] as Array<{ ct: NonNullable<typeof plan.customTargets>[number]; total: number; targetVal: number; pct: number; sisa: number }>;
    return plan.customTargets.map(ct => {
      const targetVal = parseFloat(String(ct.value).replace(",",".")) || 0;
      const norm = ct.name.trim().toLowerCase();
      let total = 0;
      for (const { r } of allReals) {
        const targs = (r as any).targets as Array<{ name: string; value: string }> | undefined;
        if (!targs) continue;
        for (const t of targs) {
          if (t.name.trim().toLowerCase() === norm) total += parseFloat(String(t.value).replace(",",".")) || 0;
        }
      }
      const pct = targetVal > 0 ? Math.min(150, Math.round((total / targetVal) * 100)) : 0;
      return { ct, total, targetVal, pct, sisa: targetVal - total };
    });
  })();

  const exportDetail = () => {
    const header = ["No","Judul Realisasi","Tanggal","Jam","Pelaksana","Jabatan","Rencana Asal","Target Terealisasi","Deskripsi","Bukti"];
    const rows: (string|number)[][] = [];
    if (allReals.length > 0) {
      allReals.forEach(({r, empId, sourceTitle}, idx)=>{
        const emp = employees.find(e=>e.id===empId);
        const targs = (r as any).targets as Array<{name:string,value:string,unit:string}> | undefined;
        const tStr = targs && targs.length>0 ? targs.map(t=>`${t.name}: ${t.value} ${t.unit}`).join(" | ") : "-";
        const bukti = attachments.filter(a=>a.realizationId===r.id).map(a=>a.fileName).join(" | ") || "-";
        const jam = (r as any).time ?? "09:00";
        const desc = (r.description ?? "").replace(/\r?\n/g, " ").slice(0, 300);
        rows.push([
          idx+1,
          (r as any).title || "Realisasi",
          r.date,
          jam,
          emp?.name ?? empId,
          emp?.role ? emp.role : "",
          sourceTitle,
          tStr,
          desc,
          bukti
        ]);
      });
    }
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{wch:4},{wch:28},{wch:12},{wch:6},{wch:20},{wch:14},{wch:22},{wch:24},{wch:30},{wch:22}];
    (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Realisasi");
    // info rencana di sheet kedua
    const info = [
      ["Rencana", plan.title],
      ["Periode", period?.name ?? plan.skpPeriodId],
      ["Pelaksana", assignee?.name ?? plan.assignedTo],
      ["Target", plan.target],
      ["Progress", `${plan.progress}%`],
      ["Tgl Rencana", (plan as any).plannedDate ? formatTanggalIndo((plan as any).plannedDate) : "-"],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(info);
    ws2["!cols"] = [{wch:14},{wch:40}];
    XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan");
    // --- Rincian Target (rencana) ---
    if (plan.customTargets && plan.customTargets.length>0) {
      const rtHeader = ["No","Nama Target","Nilai Target","Satuan","Total Realisasi","Sisa","Capaian %"];
      const rtRows: (string|number)[][] = customRealisasiTotals.map(({ct,total,targetVal,pct,sisa}, i)=>{
        const dispTotal = Number.isInteger(total)? total : Number(total.toFixed(1));
        const dispSisa = Number.isInteger(sisa)? sisa : Number(sisa.toFixed(1));
        return [i+1, ct.name, targetVal, ct.unit, dispTotal, dispSisa, `${pct}%`];
      });
      // jika belum ada realisasi, tetap tampilkan target saja
      const wsRt = XLSX.utils.aoa_to_sheet([rtHeader, ...rtRows]);
      wsRt["!cols"] = [{wch:4},{wch:22},{wch:12},{wch:10},{wch:14},{wch:12},{wch:10}];
      (wsRt as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, wsRt, "Rincian Target");
      // --- Rincian Realisasi per Target (long format) ---
      const rrHeader = ["No","Judul Realisasi","Tanggal","Jam","Rencana Asal","Pelaksana","Nama Target","Nilai Capaian","Satuan"];
      const rrRows: (string|number)[][] = [];
      let rNo = 1;
      allReals.forEach(({r, empId, sourceTitle})=>{
        const emp = employees.find(e=>e.id===empId);
        const targs = (r as any).targets as Array<{name:string,value:string,unit:string}> | undefined;
        const jam = (r as any).time ?? "09:00";
        if (targs && targs.length>0) {
          targs.forEach(t=>{
            rrRows.push([rNo++, (r as any).title || "Realisasi", r.date, jam, sourceTitle, emp?.name ?? empId, t.name, t.value, t.unit]);
          });
        } else {
          // tetap satu baris dengan - jika tidak ada rincian
          // skip jika rencana memang tidak punya rincian (biar tidak spam)
          if (plan.customTargets && plan.customTargets.length>0) {
            rrRows.push([rNo++, (r as any).title || "Realisasi", r.date, jam, sourceTitle, emp?.name ?? empId, "-", "-", "-"]);
          }
        }
      });
      if (rrRows.length>0) {
        const wsRr = XLSX.utils.aoa_to_sheet([rrHeader, ...rrRows]);
        wsRr["!cols"] = [{wch:4},{wch:28},{wch:12},{wch:6},{wch:22},{wch:20},{wch:18},{wch:12},{wch:10}];
        (wsRr as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
        XLSX.utils.book_append_sheet(wb, wsRr, "Rincian Realisasi");
      }
    }
    XLSX.writeFile(wb, `realisasi-${plan.title.slice(0,30).replace(/[^a-zA-Z0-9]/g,"_")}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="seline-card !p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link href="/rencana" className="text-[12px] text-[#78716c] hover:text-[#0c0a09] inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Kembali
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={exportDetail} className="px-2.5 py-1 rounded-full bg-white border border-[#e8e6e5] text-[12px] font-medium text-[#0c0a09] hover:bg-[#fafaf9] inline-flex items-center gap-1" style={{borderRadius:9999}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Excel
            </button>
            <button onClick={() => setShowCascadeModal(plan)} className="px-3 py-1 rounded-full bg-[#0c0a09] text-white text-[12px] font-medium hover:bg-[#1c1917]" style={{borderRadius:9999}}>Delegasi</button>
          </div>
        </div>
        <div>
          <h2 className="text-[20px] font-normal leading-tight tracking-[-0.1px] text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{plan.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]">{period?.name ?? "-"}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09] inline-flex items-center gap-1">{assignee?.name.split(",")[0] ?? "-"}</span>
            {(plan as any).plannedDate && <span className="text-[11px] text-[#78716c]">{formatTanggalIndo((plan as any).plannedDate)}</span>}
            <span className="text-[11px] text-[#a8a29e]">• Dibuat {formatTanggalIndo((plan as any).createdAt ?? plan.createdAt ?? "")}</span>
            {parentPlan && <Link href={`/rencana/${parentPlan.id}`} className="text-[11px] px-2 py-0.5 rounded-full bg-[#c1e1f7] border border-[#e8e6e5] text-[#0c0a09]">↳ {parentPlan.title.slice(0,22)}</Link>}
          </div>
        </div>
      </div>

      {/* Compact Stats row — 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="seline-card !p-3">
          <div className="eyebrow !text-[10px]">Target</div>
          <div className="text-[22px] font-normal leading-none mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{plan.target}</div>
          {plan.customTargets && plan.customTargets.length>0 && <div className="mt-1.5 flex flex-wrap gap-1">{plan.customTargets.map(ct=><span key={ct.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#0c0a09]">{ct.name}: {ct.value}{ct.unit}</span>)}</div>}
        </div>
        <div className="seline-card !p-3">
          <div className="eyebrow !text-[10px]">Progress</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[22px] font-normal leading-none text-[#3ba6f1]" style={{fontFamily:"var(--font-roobert)"}}>{plan.progress}%</span>
            <span className="text-[11px] text-[#78716c]">{disp}/{plan.target}</span>
          </div>
          <div className="mt-2 h-1.5 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><div className="h-full bg-[#3ba6f1]" style={{width:`${Math.min(plan.progress,100)}%`}} /></div>
          <div className="text-[11px] text-[#a8a29e] mt-1">{directReals.length} langsung + {childReals.length} delegasi</div>
        </div>
        <div className="seline-card !p-3">
          <div className="eyebrow !text-[10px]">Delegasi</div>
          <div className="text-[22px] font-normal leading-none mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{children.length}</div>
          <div className={`text-[11px] mt-1 ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c]" : "text-[#78716c]"}`}>{totalPorsi}/{plan.target} porsi {parentTarget>0 && totalPorsi>parentTarget ? "• melebihi" : ""}</div>
        </div>
        <div className="seline-card !p-3">
          <div className="eyebrow !text-[10px]">Realisasi</div>
          <div className="text-[22px] font-normal leading-none mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{allReals.length}</div>
          <div className="text-[11px] text-[#78716c] mt-1">{attachments.filter(a=>a.planId===plan.id).length} bukti • {attachments.filter(a=> allReals.some(r=>r.r.id===a.realizationId)).length} lampiran realisasi</div>
        </div>
      </div>

      {/* Target & Realisasi berdampingan */}
      <div className={`grid gap-2 items-start ${plan.customTargets && plan.customTargets.length>0 || children.length>0 ? "lg:grid-cols-2" : ""}`}>
        {(plan.customTargets && plan.customTargets.length>0 || children.length>0) && (
          <div className="space-y-2 min-w-0">
            {plan.customTargets && plan.customTargets.length>0 && (
              <div className="seline-card !p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">Target & Capaian</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]">{plan.customTargets.length} • {customRealisasiTotals.filter(x=>x.pct>=100).length} tercapai</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {customRealisasiTotals.map(({ct,total,targetVal,pct,sisa})=>{
                    const dispTotal = Number.isInteger(total) ? total : Number(total.toFixed(1));
                    const dispSisaAbs = Number.isInteger(Math.abs(sisa)) ? Math.abs(sisa) : Number(Math.abs(sisa).toFixed(1));
                    const over = sisa < 0;
                    return (
                      <div key={ct.id} className="px-2 py-1.5 rounded-[6px] bg-[#fafaf9] border border-[#e8e6e5] flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium truncate text-[#0c0a09]">{ct.name}</span>
                            <span className="text-[10px] text-[#a8a29e] hidden sm:inline">{targetVal}{ct.unit}</span>
                            <span className={`shrink-0 text-[10px] px-1 py-0 rounded-full border ${over ? "bg-[#16a34a] text-white border-[#16a34a]" : sisa===0 ? "bg-[#0c0a09] text-white border-[#0c0a09]" : "bg-white border-[#e8e6e5] text-[#a8a29e]"}`}>{over ? `+${dispSisaAbs}` : sisa===0 ? "✓" : `${dispSisaAbs} sisa`}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-white rounded-full overflow-hidden border border-[#e8e6e5]"><div className={`h-full ${pct>100 ? "bg-[#16a34a]" : pct>=100 ? "bg-[#0c0a09]" : "bg-[#3ba6f1]"}`} style={{width:`${Math.min(pct,100)}%`}} /></div>
                            <span className="text-[10px] font-medium text-[#0c0a09] tabular-nums">{dispTotal}<span className="text-[#a8a29e] font-normal">/{targetVal}</span></span>
                            <span className={`text-[10px] font-medium px-1 py-0 rounded-full border ${pct>=100 ? "bg-[#0c0a09] text-white border-[#0c0a09]" : "bg-white border-[#e8e6e5] text-[#78716c]"}`}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {children.length>0 && (
              <div className="seline-card !p-3">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Delegasi ({children.length})</span>
                  <span className="text-[11px] text-[#78716c]">{totalPorsi}/{plan.target}</span>
                </div>
                <div className="mt-2 max-h-[180px] overflow-y-auto border border-[#e8e6e5] rounded-[8px]">
                  <table className="w-full text-[12px]">
                    <thead className="bg-[#fafaf9] text-[11px] uppercase text-[#78716c] sticky top-0">
                      <tr><th className="text-left px-2 py-1 font-medium">Nama</th><th className="text-left px-2 py-1 font-medium">Porsi</th><th className="text-right px-2 py-1 font-medium">Aksi</th></tr>
                    </thead>
                    <tbody>
                      {children.map(c=>{
                        const emp = employees.find(e=>e.id===c.assignedTo);
                        return (
                          <tr key={c.id} className="border-t border-[#e8e6e5] hover:bg-[#fafaf9]">
                            <td className="px-2 py-1"><div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[9px] font-medium">{emp?.avatar ?? "?"}</span><span className="truncate text-[12px]">{emp?.name.split(",")[0] ?? c.assignedTo}</span></div></td>
                            <td className="px-2 py-1 text-[12px] font-medium">{c.target}<span className="text-[#a8a29e] font-normal text-[11px]"> • {c.progress}%</span></td>
                            <td className="px-2 py-1 text-right"><Link href={`/rencana/${c.id}`} className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09]">→</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Realisasi — compact table grouped */}
        <div className="seline-card !p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">Realisasi — {allReals.length} entri</span>
            <span className="text-[11px] text-[#a8a29e]">{byEmp.size} pelaksana</span>
          </div>
          {allReals.length===0 ? (
            <div className="text-[12px] text-[#a8a29e] mt-2">Belum ada realisasi.</div>
          ) : (
            <div className="mt-2 space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {[...byEmp.entries()].map(([empId, items])=>{
                const emp = employees.find(e=>e.id===empId);
                return (
                  <div key={empId} className="border border-[#e8e6e5] rounded-[8px] overflow-hidden">
                    <div className="bg-[#fafaf9] px-2.5 py-1 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[10px] font-medium">{emp?.avatar ?? "?"}</span>
                      <span className="text-[12px] font-medium text-[#0c0a09]">{emp?.name?.split(",")[0] ?? "-"}</span>
                      <span className="text-[11px] text-[#78716c] ml-auto">{items.length} entri</span>
                    </div>
                    <div className="divide-y divide-[#e8e6e5]">
                      {items.map(({r, sourceTitle})=>(
                        <div key={r.id} onClick={()=>setSelectedRealId(r.id)} className="px-2.5 py-1.5 hover:bg-[#fafaf9] cursor-pointer flex gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] leading-tight text-[#0c0a09] truncate group-hover:text-[#3ba6f1]">{(r as any).title || "Realisasi"}</div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <span className="text-[11px] text-[#a8a29e]">{r.date}</span>
                              {sourceTitle!==plan.title && <span className="text-[11px] text-[#3ba6f1]">↳ {sourceTitle.slice(0,20)}</span>}
                              {(r as any).targets && (r as any).targets.length>0 && (r as any).targets.map((t:any)=><span key={t.id} className="text-[10px] px-1 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#78716c]">{t.name}:{t.value}</span>)}
                            </div>
                          </div>
                          <span className="text-[11px] text-[#a8a29e] shrink-0 hidden sm:inline">{attachments.filter(a=>a.realizationId===r.id).length ? `📎 ${attachments.filter(a=>a.realizationId===r.id).length}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bukti — compact inline */}
      {attachments.filter(a=>a.planId===plan.id).length>0 && (
        <div className="seline-card !p-3">
          <div className="eyebrow">Bukti Langsung ({attachments.filter(a=>a.planId===plan.id).length})</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {attachments.filter(a=>a.planId===plan.id).map(a=>(
              <a key={a.id} href={a.filePath} target="_blank" className="text-[11px] px-2 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#0c0a09] hover:bg-white inline-flex items-center gap-1">📎 {a.fileName} <span className="text-[#a8a29e]">{a.fileSize}</span></a>
            ))}
          </div>
        </div>
      )}

      {/* Popup */}
      {selectedReal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={()=>setSelectedRealId(null)}>
          <div onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto border border-[#e8e6e5]" style={{borderRadius:10}}>
            <div className="p-4 border-b border-[#e8e6e5] flex items-start justify-between gap-3">
              <h3 className="subheading text-[16px]">{(selectedReal as any).title || "Realisasi"}</h3>
              <button onClick={()=>setSelectedRealId(null)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] flex items-center justify-center">×</button>
            </div>
            <div className="p-4 space-y-2.5 text-[13px]">
              <div><div className="eyebrow">Pengirim</div><div className="flex items-center gap-2 mt-1"><span className="w-7 h-7 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[11px] font-medium">{selectedRealEmp?.avatar ?? "?"}</span><div><div className="font-medium text-[13px]">{selectedRealEmp?.name ?? "-"}</div><div className="text-[11px] text-[#78716c]">{selectedRealEmp?.role}</div></div></div></div>
              <div><div className="eyebrow">Deskripsi</div><div className="mt-1 text-[#0c0a09] whitespace-pre-wrap leading-relaxed">{selectedReal.description || "—"}</div></div>
              {(selectedReal as any).targets && (selectedReal as any).targets.length>0 && <div><div className="eyebrow">Target</div><div className="mt-1 flex flex-wrap gap-1">{(selectedReal as any).targets.map((t:any)=><span key={t.id} className="text-[11px] px-2 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#0c0a09]">{t.name}: {t.value} {t.unit}</span>)}</div></div>}
              <div><div className="eyebrow">Bukti</div>{attachments.filter(a=>a.realizationId===selectedReal.id).length===0 ? <div className="text-[12px] text-[#a8a29e] mt-1">Tidak ada</div> : attachments.filter(a=>a.realizationId===selectedReal.id).map(a=><div key={a.id} className="mt-1 text-[11px] px-2 py-1 rounded-full bg-[#fafaf9] border border-[#e8e6e5]">📎 {a.fileName}</div>)}</div>
            </div>
            <div className="p-3 border-t border-[#e8e6e5] flex justify-end bg-[#fafaf9]" style={{borderRadius:"0 0 10px 10px"}}><button onClick={()=>setSelectedRealId(null)} className="px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px]">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
