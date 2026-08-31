"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
      <div className="p-8 text-center border border-dashed bg-white" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>
        <div className="heading-serif text-lg">Rencana tidak ditemukan</div>
        <Link href="/rencana" className="inline-block mt-3 px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium" style={{ borderRadius: 48 }}>← Kembali ke Rencana</Link>
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
  const canManage = ["direktur","supervisor","admin"].includes(currentUser.role);

  // Delegasi penerima
  const children = plans.filter(c => c.parentId === plan.id).sort((a,b) => {
    const na = employees.find(e=>e.id===a.assignedTo)?.name ?? "";
    const nb = employees.find(e=>e.id===b.assignedTo)?.name ?? "";
    return na.localeCompare(nb);
  });
  const parentTarget = parseFloat(String(plan.target).replace(",","."))||0;
  const totalPorsi = children.reduce((s,c)=> s + (parseFloat(String(c.target).replace(",","."))||0),0);

  // Descendants untuk progress & realisasi turunan
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

  // Semua realisasi (langsung + delegasi), kelompokkan per orang
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

  // Realisasi total per target kustom — agregat dari semua realisasi (langsung + delegasi turunan)
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link href="/rencana" className="font-mono text-xs text-[#1c5d5f] hover:underline inline-flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Kembali ke Rencana
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="heading-serif text-[26px] leading-tight">{plan.title}</h2>
            <div className="font-mono text-[11px] text-[#283338]/60 mt-1">Dibuat: {formatTanggalIndo((plan as any).createdAt || plan.createdAt || "")}{(plan as any).createdAt && (plan as any).createdAt.includes(" ") ? `, ${(plan as any).createdAt.split(" ")[1]} WIB` : ""}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="font-mono text-xs tracking-wide px-2 py-1 rounded-full bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}>{period?.name}</span>
              <span className="font-mono text-xs tracking-wide px-2 py-1 rounded-full bg-[#e4f0f1] border border-[#a2cbcd] text-[#0e4749]" style={{ borderRadius: 100 }}>{assignee?.avatar} {assignee?.name.split(",")[0]}</span>
            </div>
          </div>
          {canManage && children.length >= 0 && (
            <button onClick={() => setShowCascadeModal(plan)} className="px-4 py-2 rounded-full bg-[#1c5d5f] text-white text-xs font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>
              Kelola Pelimpahan
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Target</div>
          <div className="heading-serif text-2xl mt-1 text-[#1c5d5f]">{plan.target}</div>
          {plan.customTargets && plan.customTargets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {plan.customTargets.map(ct => (
                <span key={ct.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e4f0f1] border border-[#a2cbcd] font-mono text-[11px] text-[#1c5d5f]">
                  <span className="font-semibold">{ct.name}:</span> {ct.value} {ct.unit}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Progress</div>
          <div className="heading-serif text-2xl mt-1 text-[#1c5d5f]">{plan.progress}%</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Delegasi</div>
          <div className="heading-serif text-2xl mt-1 text-[#231e21]">{children.length}</div>
        </div>
      </div>

      {/* Target Kustom (jika ada) */}
      {plan.customTargets && plan.customTargets.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="eyebrow text-[11px]">TARGET KUSTOM (DIREKTUR)</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.customTargets.map(ct => (
              <div key={ct.id} className="p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                <div className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60">{ct.name}</div>
                <div className="font-mono text-sm font-bold text-[#1c5d5f] mt-1">{ct.value} <span className="font-normal text-[#283338]/60">{ct.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Realisasi Total per Target Kustom — agregat dari semua realisasi (langsung + delegasi) */}
      {plan.customTargets && plan.customTargets.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="flex items-center justify-between gap-2">
            <div className="eyebrow text-[11px]">REALISASI TOTAL PER TARGET KUSTOM</div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#e4f0f1] border border-[#a2cbcd] text-[#1c5d5f]">{allReals.length} realisasi • {directReals.length} langsung + {childReals.length} delegasi</span>
          </div>
          <p className="font-mono text-[11px] text-[#283338]/50 mt-1">Jumlah nilai terealisasi dijumlahkan per nama target kustom (case-insensitive) dari semua realisasi turunan.</p>
          <div className="mt-3 space-y-3">
            {customRealisasiTotals.map(({ ct, total, targetVal, pct, sisa }) => {
              const dispTotal = Number.isInteger(total) ? total : Number(total.toFixed(1));
              const dispSisa = Number.isInteger(Math.abs(sisa)) ? Math.abs(sisa) : Number(Math.abs(sisa).toFixed(1));
              const over = sisa < 0;
              return (
                <div key={ct.id} className="p-3 rounded-xl border bg-[#f2f8f7]" style={{ borderRadius: 12, borderColor: pct >= 100 ? "#1c5d5f" : "#e4f0f1" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-xs font-semibold uppercase tracking-wide text-[#1c5d5f] truncate">{ct.name}</div>
                    <span className={`shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${pct >= 100 ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : pct >= 50 ? "bg-[#e4f0f1] text-[#1c5d5f] border-[#a2cbcd]" : "bg-white text-[#283338]/70 border-[#e4f0f1]"}`} style={{ borderRadius: 100 }}>{pct}%</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                    <span className="text-[#283338]"><span className="text-[#283338]/50">Target:</span> <span className="font-bold text-[#1c5d5f]">{ct.value} {ct.unit}</span></span>
                    <span className="text-[#283338]"><span className="text-[#283338]/50">Terealisasi:</span> <span className={`font-bold ${over ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{dispTotal} {ct.unit}</span></span>
                    <span className={`text-[11px] ${over ? "text-[#b91c1c] font-semibold" : sisa === 0 ? "text-[#1c5d5f] font-semibold" : "text-[#283338]/60"}`}>{over ? `+${dispSisa} ${ct.unit} melebihi target` : sisa === 0 ? "✓ tepat target" : `Sisa ${dispSisa} ${ct.unit}`}</span>
                  </div>
                  <div className="mt-2 h-2.5 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className={`h-full ${pct > 100 ? "bg-[#b91c1c]" : pct >= 100 ? "bg-[#1c5d5f]" : "bg-[#a2cbcd]"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  <div className="mt-1 font-mono text-[11px] text-[#283338]/50">{dispTotal} / {targetVal} {ct.unit}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-2.5 rounded-xl bg-[#1c5d5f] text-white flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]" style={{ borderRadius: 12 }}>
            <span className="opacity-90">Jenis target: {plan.customTargets.length}</span>
            <span className="opacity-50">•</span>
            <span>Tercapai {customRealisasiTotals.filter(x => x.pct >= 100).length}/{plan.customTargets.length} jenis (100%+)</span>
            <span className="opacity-50">•</span>
            <span className="opacity-80">Klik entri realisasi di bawah untuk rincian per entri</span>
          </div>
        </div>
      )}

      {/* Tanggal Rencana Dijalankan */}
      <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
        <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/60">Tanggal Rencana Dijalankan</div>
        {(plan as any).plannedDate ? (
          <div className="font-mono text-sm font-bold text-[#1c5d5f] mt-1">{formatTanggalIndo((plan as any).plannedDate)}, {(plan as any).plannedTime || "09:00"} WIB</div>
        ) : (
          <div className="font-mono text-sm text-[#283338]/40 mt-1">— Belum ditentukan</div>
        )}
        <div className="font-mono text-[11px] text-[#283338]/50 mt-1">Dibuat: {formatTanggalIndo((plan as any).createdAt || plan.createdAt || "")}{(plan as any).createdAt && (plan as any).createdAt.includes(" ") ? `, ${(plan as any).createdAt.split(" ")[1]} WIB` : ""}</div>
      </div>

      {/* Progress kumulatif */}
      <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(plan.progress, 100)}%` }} /></div>
          <span className={`font-mono text-sm font-bold ${plan.progress > 100 ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{plan.progress}%</span>
        </div>
        <div className="font-mono text-[11px] text-[#1c5d5f] mt-1.5">{disp} / {plan.target} terealisasi • entri langsung {directReals.length} + dari delegasi {childReals.length}</div>
      </div>

      {/* Induk */}
      {parentPlan && (
        <Link href={`/rencana/${parentPlan.id}`} className="block p-3 rounded-xl bg-[#f2e8e2] border border-[#e4f0f1] hover:border-[#a2cbcd]" style={{ borderRadius: 12 }}>
          <span className="font-mono text-[10px] tracking-wide uppercase text-[#283338]/60">Induk</span>
          <div className="font-medium text-sm text-[#231e21] mt-0.5">{parentPlan.title}</div>
        </Link>
      )}

      {/* Delegasi Penerima */}
      {children.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
          <div className="eyebrow text-[11px] flex items-center justify-between">
            <span>DELEGASI PENERIJA ({children.length})</span>
            <span className={`font-mono text-xs normal-case ${parentTarget>0 && totalPorsi>parentTarget ? "text-[#b91c1c]" : "text-[#1c5d5f]"}`}>{totalPorsi} / {plan.target} porsi</span>
          </div>
          <table className="mt-2 w-full table-fixed border border-[#e4f0f1]" style={{ borderRadius: 8 }}>
            <colgroup><col className="w-[180px]" /><col /><col className="w-[72px]" /><col className="w-[64px]" /><col className="w-[64px]" /></colgroup>
            <thead className="bg-[#f2f8f7] font-mono text-[11px] tracking-wide uppercase text-[#283338]/60">
              <tr>
                <th className="text-left px-2.5 py-1.5 font-semibold">Nama</th>
                <th className="text-left px-2.5 py-1.5 font-semibold">Judul Pelimpahan</th>
                <th className="text-left px-2.5 py-1.5 font-semibold">Porsi</th>
                <th className="text-left px-2.5 py-1.5 font-semibold">Prog.</th>
                <th className="text-right px-2.5 py-1.5 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {children.map(c => {
                const emp = employees.find(e => e.id === c.assignedTo);
                return (
                  <tr key={c.id} className="border-t border-[#e4f0f1]">
                    <td className="px-2.5 py-1.5"><div className="flex items-center gap-1.5 min-w-0"><span className="w-5 h-5 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[9px] font-bold shrink-0">{emp?.avatar ?? "?"}</span><span className="text-xs truncate">{emp?.name?.split(",")[0] ?? c.assignedTo}</span></div></td>
                    <td className="px-2.5 py-1.5 text-xs text-[#283338] truncate" title={c.title || undefined}>{c.title || "—"}</td>
                    <td className="px-2.5 py-1.5 font-mono text-xs font-bold text-[#1c5d5f]">{c.target}</td>
                    <td className="px-2.5 py-1.5 font-mono text-xs text-[#283338]/70">{c.progress}%</td>
                    <td className="px-2.5 py-1.5 text-right"><Link href={`/rencana/${c.id}`} className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white border border-[#e4f0f1] text-[#283338]/70 hover:text-[#1c5d5f] hover:border-[#a2cbcd]" title="Lihat detail">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                    </Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Realisasi — langsung + dari delegasi, per orang */}
      <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
        <div className="eyebrow text-[11px]">REALISASI ({allReals.length}) — LANGSUNG & DARI DELEGASI</div>
        {allReals.length === 0 ? (
          <div className="font-mono text-xs text-[#283338]/60 mt-2">Belum ada realisasi.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {[...byEmp.entries()].map(([empId, items]) => {
              const emp = employees.find(e => e.id === empId);
              return (
                <table key={empId} className="w-full table-fixed border border-[#e4f0f1]" style={{ borderRadius: 8 }}>
                  <colgroup><col /><col className="w-[170px]" /></colgroup>
                  <thead className="bg-[#e4f0f1]">
                    <tr>
                      <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-[#231e21]">{emp?.name?.split(",")[0] ?? "-"}</th>
                      <th className="text-right px-2.5 py-1.5 font-mono text-[11px] text-[#283338]/60">{items.length} entri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ r, sourceTitle }) => (
                      <tr key={r.id} className="border-t border-[#e4f0f1] bg-white align-top hover:bg-[#f2f8f7]/50">
                        <td className="px-2.5 py-1.5 cursor-pointer group" onClick={() => setSelectedRealId(r.id)} title="Lihat detail realisasi">
                          <div className="text-sm text-[#231e21] leading-snug group-hover:text-[#1c5d5f] group-hover:underline underline-offset-2">{(r as any).title || "Realisasi"}</div>
                          {r.description && <div className="text-xs text-[#283338]/60 mt-0.5 line-clamp-2">{r.description}</div>}
                          {(r as any).targets && (r as any).targets.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(r as any).targets.map((t:any)=>(
                                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e4f0f1] border border-[#a2cbcd] font-mono text-[11px] text-[#1c5d5f]"><span className="font-semibold">{t.name}:</span> {t.value} {t.unit}</span>
                              ))}
                            </div>
                          )}
                          {(r as any).participants && (r as any).participants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(r as any).participants.map((pp:any)=>{
                                const emp = employees.find(e=>e.id===pp.employeeId);
                                return <span key={pp.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f2e8e2] border border-[#d6aec1] font-mono text-[11px] text-[#4a2c2a]"><span className="w-4 h-4 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[8px] font-bold">{emp?.avatar ?? "?"}</span> {emp?.name?.split(",")[0] ?? pp.employeeId} — {pp.role}</span>;
                              })}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-3 mt-1">
                            <span className="font-mono text-[11px] text-[#283338]/50">{r.date}</span>
                            {sourceTitle !== plan.title && <span className="font-mono text-[11px] text-[#1c5d5f] truncate max-w-[240px]">↳ {sourceTitle}</span>}
                          </div>
                          {attachments.filter(a => a.realizationId === r.id).map(a => (
                            <div key={a.id} className="text-[11px] text-[#1c5d5f] mt-1">📎 {a.fileName} • {a.fileSize}</div>
                          ))}
                        </td>
                        <td className="px-2.5 py-1.5 text-right align-top">
                          {sourceTitle !== plan.title && (
                            <Link href={`/rencana/${r.planId}`} className="font-mono text-[11px] text-[#1c5d5f] hover:underline">lihat tugas →</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })}
          </div>
        )}
      </div>

      {/* Bukti */}
      <div className="p-4 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
        <div className="eyebrow text-[11px]">BUKTI ({attachments.filter(a=>a.planId===plan.id).length})</div>
        {attachments.filter(a=>a.planId===plan.id).length===0 ? (
          <div className="font-mono text-xs text-[#283338]/60 mt-2">Belum ada bukti</div>
        ) : attachments.filter(a=>a.planId===plan.id).map(a=> (
          <div key={a.id} className="mt-1 p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>📎 {a.fileName} • {a.fileSize} • {a.date}</div>
        ))}
      </div>

      {/* Popup: Detail Realisasi */}
      {selectedReal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#283338]/30 backdrop-blur-sm" onClick={() => setSelectedRealId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="p-6 border-b border-[#e4f0f1] flex items-start justify-between gap-3">
              <h3 className="heading-serif text-lg leading-tight">{(selectedReal as any).title || "Realisasi"}</h3>
              <button onClick={() => setSelectedRealId(null)} className="w-8 h-8 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center shrink-0">×</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div><div className="eyebrow text-[11px]">PENGIRIM</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold">{selectedRealEmp?.avatar ?? "?"}</span>
                  <div><div className="font-medium">{selectedRealEmp?.name ?? "-"}</div><div className="font-mono text-xs text-[#283338]/60">{selectedRealEmp?.role}</div></div>
                </div>
              </div>
              <div>
                <div className="eyebrow text-[11px]">TUGAS</div>
                {selectedRealPlan && selectedRealPlan.id !== plan.id ? (
                  <Link href={`/rencana/${selectedRealPlan.id}`} onClick={() => setSelectedRealId(null)} className="block mt-1 p-2.5 rounded-xl bg-[#e4f0f1] border border-[#a2cbcd] hover:bg-white">
                    <div className="font-medium text-[#231e21]">{selectedRealPlan.title}</div>
                    <div className="font-mono text-[11px] text-[#1c5d5f] mt-0.5">lihat tugas →</div>
                  </Link>
                ) : (
                  <div className="mt-1 text-[#283338]/80">{selectedRealPlan?.title ?? "-"}</div>
                )}
              </div>
              <div><div className="eyebrow text-[11px]">TANGGAL</div><div className="font-mono text-xs mt-1 text-[#283338]/70">{selectedReal.date} • {(selectedReal as any).time ?? "09:00"} WIB</div></div>
              <div><div className="eyebrow text-[11px]">DESKRIPSI</div><div className="mt-1 leading-relaxed text-[#283338]/80 whitespace-pre-wrap">{selectedReal.description || "—"}</div></div>
              {(selectedReal as any).targets && (selectedReal as any).targets.length > 0 && (
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
              {(selectedReal as any).participants && (selectedReal as any).participants.length > 0 && (
                <div><div className="eyebrow text-[11px]">PEGAWAI TERLIBAT</div>
                  <div className="mt-1 space-y-1">
                    {(selectedReal as any).participants.map((pp:any)=>{
                      const emp = employees.find(e=>e.id===pp.employeeId);
                      return <div key={pp.id} className="p-2 rounded-xl bg-[#f2e8e2]/50 border border-[#e4f0f1] flex items-center gap-2" style={{ borderRadius: 12 }}><span className="w-6 h-6 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[10px] font-bold">{emp?.avatar ?? "?"}</span><span className="text-sm text-[#231e21] flex-1">{emp?.name ?? pp.employeeId}</span><span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white border border-[#d6aec1] text-[#4a2c2a]">{pp.role}</span></div>;
                    })}
                  </div>
                </div>
              )}
              <div><div className="eyebrow text-[11px]">BUKTI</div>
                {attachments.filter(a => a.realizationId === selectedReal.id).length === 0 ? (
                  <div className="font-mono text-xs text-[#283338]/60 mt-1">Tidak ada bukti terlampir</div>
                ) : attachments.filter(a => a.realizationId === selectedReal.id).map(a => (
                  <div key={a.id} className="mt-1 p-2 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>📎 {a.fileName} • {a.fileSize} • {a.date}</div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[#e4f0f1] flex justify-end sticky bottom-0 bg-white" style={{ borderRadius: "0 0 12px 12px" }}>
              <button onClick={() => setSelectedRealId(null)} className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
