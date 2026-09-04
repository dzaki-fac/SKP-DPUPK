"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import * as XLSX from "xlsx";
import { useSKP } from "@/lib/store";

export default function RealisasiViewPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { realizations, plans, employees, attachments, periods, currentUser, handleDeleteRealization, handleDeleteAttachment, isSubordinate } = useSKP();
 const [confirmDelete, setConfirmDelete] = useState(false);

 if (!currentUser) return null;
 const real = realizations.find(r => r.id === id);
 if (!real) {
 return (
 <div className="max-w-[720px] mx-auto p-6 text-center border border-dashed bg-white rounded-xl" style={{borderRadius:12}}>
 <p className="subheading">Realisasi tidak ditemukan</p>
 <Link href="/realisasi" className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px]">← Kembali</Link>
 </div>
 );
 }
 const plan = plans.find(p => p.id === real.planId) ?? null;
 const period = plan ? periods.find(pe => pe.id === plan.skpPeriodId) : null;
 const emp = real.uploadedBy ? employees.find(e=>e.id===real.uploadedBy) : (plan ? employees.find(e=>e.id===plan.assignedTo) : null);
 const canEdit = real.uploadedBy ? real.uploadedBy === currentUser.id : false;
 const canDelete = (() => {
 if (!real.uploadedBy) return ["admin","pimpinan_1"].includes(currentUser.role);
 if (real.uploadedBy === currentUser.id) return true;
 if (["admin","pimpinan_1"].includes(currentUser.role)) return true;
 if (!plan) return false;
 const ownerId = real.uploadedBy ?? plan.assignedTo;
 return isSubordinate(currentUser.id, ownerId);
 })();
 const canDeleteBukti = (a: typeof attachments[number]) => {
 if (a.uploadedBy === currentUser.id) return true;
 if (["admin","pimpinan_1"].includes(currentUser.role)) return true;
 if (isSubordinate(currentUser.id, a.uploadedBy)) return true;
 const r = realizations.find(x=>x.id===a.realizationId);
 if (r?.uploadedBy && isSubordinate(currentUser.id, r.uploadedBy)) return true;
 return false;
 };
 const formatTanggal = (s: string) => {
 if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
 const [y,m,d]=s.split("-"); const months=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
 return `${parseInt(d,10)} ${months[parseInt(m,10)-1]||m} ${y}`;
 };
 const exportDetail = () => {
 const targets = (real as any).targets as Array<{name:string,value:string,unit:string}> | undefined;
 const parts = (real as any).participants as Array<{employeeId?:string,customName?:string,role:string}> | undefined;
 const bukti = attachments.filter(a=>a.realizationId===real.id);
 const header: (string|number)[] = ["Field","Value"];
 const rows: (string|number)[][] = [
 ["Judul Realisasi", real.title || "-"],
 ["Rencana", plan?.title ?? "-"],
 ["Periode", period ? `${period.name} (${period.startDate} s/d ${period.endDate})` : (plan?.skpPeriodId ?? "-")],
 ["Pelaksana / Pengirim", emp?.name ?? real.uploadedBy ?? "-"],
 ["Jabatan", emp?.role ?? "-"],
 ["NIP", (emp as any)?.employeeNumber ?? "-"],
 ["Target Rencana", plan?.target ?? "-"],
 ["Progress Rencana", plan ? `${plan.progress}%` : "-"],
 ["Tanggal", formatTanggal(real.date)],
 ["Jam", (real as any).time ?? "09:00"],
 ["Deskripsi", (real.description || "-").replace(/\r?\n/g," ")],
 ["Target Terealisasi", targets && targets.length ? targets.map(t=>`${t.name}: ${t.value} ${t.unit}`).join(" | ") : "-"],
 ["Pegawai Terlibat", parts && parts.length ? parts.map(pp=>{ const e=pp.employeeId? employees.find(x=>x.id===pp.employeeId):null; const n=e?.name ?? pp.customName ?? "-"; return `${n} (${pp.role})`; }).join(" | ") : "-"],
 ["Bukti", bukti.length ? bukti.map(b=>`${b.fileName} (${b.fileSize})`).join(" | ") : "-"],
 ];
 const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
 (ws as any)["!cols"]=[{wch:22},{wch:62}];
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "Detail");
 if (targets && targets.length) {
 const tHeader: (string|number)[] = ["No","Nama Target","Nilai","Satuan"];
 const tRows = targets.map((t,i)=>[i+1, t.name, t.value, t.unit]);
 const ws2 = XLSX.utils.aoa_to_sheet([tHeader, ...tRows]);
 (ws2 as any)["!cols"]=[{wch:4},{wch:24},{wch:12},{wch:12}];
 XLSX.utils.book_append_sheet(wb, ws2, "Target");
 }
 if (parts && parts.length) {
 const pHeader: (string|number)[] = ["No","Nama","Jabatan","Peran","NIP"];
 const pRows = parts.map((pp,i)=>{ const e=pp.employeeId? employees.find(x=>x.id===pp.employeeId):null; return [i+1, e?.name ?? pp.customName ?? "-", e?.role ?? "-", pp.role, (e as any)?.employeeNumber ?? "-"]; });
 const ws3 = XLSX.utils.aoa_to_sheet([pHeader, ...pRows]);
 (ws3 as any)["!cols"]=[{wch:4},{wch:22},{wch:16},{wch:16},{wch:16}];
 XLSX.utils.book_append_sheet(wb, ws3, "Pegawai Terlibat");
 }
 if (bukti.length) {
 const bHeader: (string|number)[] = ["No","Nama File","Ukuran","Tanggal"];
 const bRows = bukti.map((b,i)=>[i+1, b.fileName, b.fileSize, b.date]);
 const ws4 = XLSX.utils.aoa_to_sheet([bHeader, ...bRows]);
 (ws4 as any)["!cols"]=[{wch:4},{wch:32},{wch:12},{wch:14}];
 XLSX.utils.book_append_sheet(wb, ws4, "Bukti");
 }
 const safe=(real.title||"realisasi").replace(/[^a-zA-Z0-9]/g,"_").slice(0,30)||"realisasi";
 XLSX.writeFile(wb, `detail-realisasi-${safe}-${real.date}.xlsx`);
 };

 return (
 <div className="max-w-[720px] mx-auto space-y-4">
 <div className="flex items-center gap-3">
 <Link href="/realisasi" className="w-8 h-8 rounded-full bg-white border border-[#e8e6e5] flex items-center justify-center text-[#78716c] hover:bg-[#fafaf9]">←</Link>
 <div className="flex-1 min-w-0">
 <p className="eyebrow">DETAIL REALISASI</p>
 <h1 className="subheading text-[20px] leading-tight truncate">{real.title || "Realisasi"}</h1>
 </div>
 <button onClick={exportDetail} className="px-3 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[12px] font-medium hover:bg-[#fafaf9] inline-flex items-center gap-1.5">Export Excel</button>
 </div>

 <div className="seline-card !p-5 space-y-4">
 <div>
 <div className="eyebrow">PENGIRIM</div>
 <div className="flex items-center gap-2 mt-1.5">
 <span className="w-8 h-8 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[12px] font-medium">{emp?.avatar ?? "?"}</span>
 <div>
 <div className="font-medium text-[14px]">{emp?.name ?? "-"}</div>
 <div className="text-[12px] text-[#78716c]">{emp?.role}{real.uploadedBy ? "" : " • data lama"}</div>
 </div>
 </div>
 </div>

 <div><div className="eyebrow">TUGAS</div><div className="mt-1.5 text-[14px] text-[#0c0a09]">{plan?.title ?? "-"}</div>
 {period && <div className="text-[12px] text-[#78716c] mt-0.5">{period.name} • {period.startDate} s/d {period.endDate}</div>}
 </div>

 <div><div className="eyebrow">TANGGAL & JAM</div><div className="text-[13px] mt-1.5">{formatTanggal(real.date)}, {(real as any).time ?? "09:00"} WIB</div></div>

 <div><div className="eyebrow">DESKRIPSI</div><div className="mt-1.5 text-[14px] leading-relaxed whitespace-pre-wrap text-[#0c0a09]/80">{real.description || "—"}</div></div>

 {(real as any).targets && (real as any).targets.length>0 && (
 <div><div className="eyebrow">TARGET TEREALISASI</div>
 <div className="mt-2 grid grid-cols-1 gap-2">
 {(real as any).targets.map((t:any)=>(
 <div key={t.id} className="p-2.5 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] flex justify-between items-center" style={{borderRadius:12}}>
 <span className="text-[13px] text-[#0c0a09]/70">{t.name}</span>
 <span className="text-[14px] font-medium text-[#3ba6f1]">{t.value} <span className="font-normal text-[#0c0a09]/60">{t.unit}</span></span>
 </div>
 ))}
 </div>
 </div>
 )}

 {(real as any).participants && (real as any).participants.length>0 && (
 <div><div className="eyebrow">PEGAWAI TERLIBAT</div>
 <div className="mt-2 space-y-1.5">
 {(real as any).participants.map((pp:any)=>{
 const e = pp.employeeId ? employees.find(x=>x.id===pp.employeeId) : null;
 const name = e?.name ?? pp.customName ?? "-";
 const isCustom = !pp.employeeId && !!pp.customName;
 return <div key={pp.id} className="p-2.5 rounded-xl bg-[#fafaf9]/50 border border-[#e8e6e5] flex items-center gap-2" style={{borderRadius:12}}><span className="flex-1 text-[14px]">{name} {isCustom && <span className="text-[10px] text-[#a8a29e]">(luar sistem)</span>}</span><span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-[#e8e6e5]">{pp.role}</span></div>;
 })}
 </div>
 </div>
 )}

 <div>
 <div className="eyebrow">BUKTI ({attachments.filter(a=>a.realizationId===real.id).length})</div>
 {attachments.filter(a=>a.realizationId===real.id).length===0 ? (
 <div className="text-[13px] text-[#a8a29e] mt-1.5">Tidak ada bukti terlampir</div>
 ) : (
 <div className="mt-2 space-y-1.5">
 {attachments.filter(a=>a.realizationId===real.id).map(a=>(
 <div key={a.id} className="p-2.5 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[13px] flex items-center justify-between gap-2" style={{borderRadius:12}}>
 <span className="truncate">📎 {a.fileName} • {a.fileSize} • {formatTanggal(a.date)}</span>
 <div className="flex items-center gap-1.5 shrink-0">
 <a href={a.filePath} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-full bg-white border border-[#e8e6e5] text-[#3ba6f1] text-[12px]">lihat</a>
 {canDeleteBukti(a) && <button onClick={()=> handleDeleteAttachment(a.id, a.fileName)} className="w-7 h-7 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center hover:bg-[#fef2f2]">×</button>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="flex gap-2 justify-between">
 <Link href="/realisasi" className="px-5 py-2.5 rounded-full border border-[#e8e6e5] bg-white text-[14px] hover:bg-[#fafaf9]" style={{borderRadius:48}}>Kembali</Link>
 <div className="flex gap-2">
 {canEdit && <button onClick={()=> router.push(`/realisasi/${real.id}/edit`)} className="px-5 py-2.5 rounded-full bg-white border border-[#d6d3d1] text-[14px] font-medium hover:bg-[#fafaf9]" style={{borderRadius:48}}>Edit</button>}
 {canDelete && <button onClick={()=> setConfirmDelete(true)} className="px-5 py-2.5 rounded-full bg-[#b91c1c] text-white text-[14px] font-medium hover:bg-[#991b1b]" style={{borderRadius:48}}>Hapus</button>}
 </div>
 </div>

 {confirmDelete && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/30 backdrop-blur-sm" onClick={()=> setConfirmDelete(false)}>
 <div onClick={e=>e.stopPropagation()} className="bg-white w-full max-w-md border border-[#e8e6e5] overflow-hidden" style={{borderRadius:12}}>
 <div className="p-6">
 <h3 className="subheading">Hapus realisasi ini?</h3>
 <p className="text-[13px] text-[#78716c] mt-1">"{real.title}" — aksi tidak dapat dibatalkan</p>
 </div>
 <div className="p-4 border-t border-[#e8e6e5] flex gap-2 justify-end">
 <button onClick={()=> setConfirmDelete(false)} className="px-4 py-2 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{borderRadius:48}}>Batal</button>
 <button onClick={async()=>{ setConfirmDelete(false); await handleDeleteRealization(real.id, real.title); router.push("/realisasi"); }} className="px-5 py-2 rounded-full bg-[#b91c1c] text-white text-[14px] font-medium" style={{borderRadius:48}}>Ya, Hapus</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
