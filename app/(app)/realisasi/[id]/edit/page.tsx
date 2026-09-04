"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";
import { DatePicker } from "@/components/ui/date-picker";

export default function EditRealisasiPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { currentUser, plans, employees, periods, realizations, attachments, setRealizations, setAttachments, setPlans, notify } = useSKP();

 const real = realizations.find(r=> r.id===id);
 const plan = real ? plans.find(p=>p.id===real.planId) ?? null : null;

 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [date, setDate] = useState("");
 const [time, setTime] = useState("09:00");
 const [targets, setTargets] = useState<Array<{name:string,value:string,unit:string}>>([]);
 const [participants, setParticipants] = useState<Array<{employeeId:string,role:string}>>([]);
 const [existingFiles, setExistingFiles] = useState<typeof attachments>([]);
 const [newFiles, setNewFiles] = useState<Array<{fileName:string,filePath:string,fileSize:string}>>([]);
 const [pickerOpen, setPickerOpen] = useState(false);
 const [pickerQ, setPickerQ] = useState("");
 const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
 const [submitting, setSubmitting] = useState(false);
 const [uploading, setUploading] = useState(false);
 const initialized = useRef(false);

 const getEffective = (p:any): any[] => {
 if (!p) return [];
 if (p.customTargets && p.customTargets.length) return p.customTargets;
 let cur:any = p;
 while (cur?.parentId) {
 const parent = plans.find(x=>x.id===cur.parentId);
 if (!parent) break;
 if ((parent as any).customTargets && (parent as any).customTargets.length) return (parent as any).customTargets;
 cur = parent;
 }
 return [];
 };

 useEffect(()=>{
 if (!real || !plan) return;
 if (initialized.current) return;
 setTitle(real.title);
 setDescription(real.description || "");
 setDate(real.date);
 setTime((real as any).time ?? "09:00");
 const eff = getEffective(plan);
 const map = new Map(((real as any).targets ?? []).map((t:any)=>[String(t.name).trim().toLowerCase(), t]));
 const tpl = eff.map((e:any)=>{
 const found:any = map.get(e.name.trim().toLowerCase());
 return { name:e.name, value: found ? String(found.value) : "", unit:e.unit };
 });
 setTargets(tpl);
 setParticipants(((real as any).participants ?? []).filter((p:any)=> !!p.employeeId).map((p:any)=>({ employeeId: p.employeeId, role: p.role })));
 setExistingFiles(attachments.filter(a=>a.realizationId===real.id));
 initialized.current = true;
 }, [real?.id]);

 if (!currentUser) return null;
 if (!real) {
 return (
 <div className="max-w-[720px] mx-auto p-6 text-center border border-dashed bg-white rounded-xl" style={{borderRadius:12}}>
 <p className="subheading">Realisasi tidak ditemukan</p>
 <Link href="/realisasi" className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#0c0a09] text-white text-[13px]">← Kembali</Link>
 </div>
 );
 }
 if (!plan) return <div className="p-6 text-center">Rencana tidak ditemukan</div>;
 if (real.uploadedBy && real.uploadedBy !== currentUser.id) {
 return (
 <div className="max-w-[720px] mx-auto p-6 text-center border border-dashed bg-white rounded-xl" style={{borderRadius:12}}>
 <p className="text-[14px] text-[#b91c1c]">Hanya penulis yang dapat mengubah realisasi ini</p>
 <Link href={`/realisasi/${real.id}`} className="inline-block mt-3 px-4 py-1.5 rounded-full bg-white border border-[#e8e6e5] text-[13px]">Kembali</Link>
 </div>
 );
 }

 const effective = getEffective(plan);
 const hasEffective = effective.length>0;
 const isInherited = hasEffective && !(plan as any).customTargets?.length;
 const filledCount = targets.filter(t=> String(t.value).trim().length>0).length;

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const list = Array.from(e.target.files ?? []);
 if (!list.length) return;
 const valid = list.filter(f=>{
 if(f.size>10*1024*1024){ notify(`${f.name} melebihi 10MB — dilewati`); return false; }
 return true;
 });
 if (!valid.length) { (e.target as HTMLInputElement).value=""; return; }
 if (existingFiles.length + newFiles.length + valid.length > 5) { notify(`Maksimal 5 bukti (sudah ${existingFiles.length}, baru ${newFiles.length})`); (e.target as HTMLInputElement).value=""; return; }
 setUploading(true);
 const uploaded: Array<{fileName:string,filePath:string,fileSize:string}> = [];
 for(const f of valid){
 const fd=new FormData(); fd.append("file", f); fd.append("planId", plan.id);
 try{
 const r=await fetch("/api/uploads",{method:"POST", body:fd, credentials:"include"});
 const j=await r.json();
 if(!r.ok) notify(j.error||`Gagal upload ${f.name}`);
 else uploaded.push({fileName:j.fileName||f.name, filePath:j.filePath, fileSize:j.fileSize||`${(f.size/1024).toFixed(1)} KB`});
 }catch{ notify(`Gagal upload ${f.name}`); }
 }
 if(uploaded.length) setNewFiles(prev=>[...prev, ...uploaded]);
 setUploading(false);
 (e.target as HTMLInputElement).value="";
 };

 const handleSubmit = async () => {
 const titleTrim = title.trim();
 if(!titleTrim) { notify("Judul realisasi wajib diisi"); return; }
 if(titleTrim.length<3) { notify("Judul minimal 3 karakter"); return; }
 if(titleTrim.length>200){ notify("Judul maksimal 200 karakter"); return; }
 if(description && description.length>1000){ notify("Deskripsi maksimal 1000 karakter"); return; }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ notify("Format tanggal harus YYYY-MM-DD"); return; }
 const period = periods.find(p=>p.id===plan.skpPeriodId);
 if(period && (date < period.startDate || date > period.endDate)) { notify(`Tanggal harus dalam periode ${period.name}`); return; }
 if(!/^\d{2}:\d{2}$/.test(time) || Number(time.split(":")[0])>23 || Number(time.split(":")[1])>59){ notify("Format jam harus HH:mm"); return; }
 if(existingFiles.length + newFiles.length > 5){ notify("Maksimal 5 bukti per realisasi"); return; }
 const filtered = targets.filter(t=> String(t.value).trim().length>0);
 if(effective.length===0){
 if(filtered.length>0){ notify("Rencana ini tidak memiliki rincian target — target terealisasi tidak boleh diisi"); return; }
 } else {
 if(filtered.length > effective.length){ notify(`Maksimal ${effective.length} target`); return; }
 const effMap=new Map(effective.map(e=>[e.name.trim().toLowerCase(), e]));
 const seen=new Set<string>();
 for(const t of filtered){
 const key=t.name.trim().toLowerCase();
 const eff=effMap.get(key) as any;
 if(!eff){ notify(`Target "${t.name}" tidak ada di rincian rencana. Hanya: ${effective.map(e=>e.name).join(", ")}`); return; }
 if(String(t.unit).trim()!==String(eff.unit).trim()){ notify(`Satuan untuk "${t.name}" harus "${eff.unit}"`); return; }
 if(seen.has(key)){ notify(`Target "${t.name}" duplikat`); return; }
 seen.add(key);
 if(!/^\d+$/.test(String(t.value).trim())){ notify(`Nilai capaian untuk "${t.name}" harus angka`); return; }
 }
 }
 if(participants.length>10){ notify("Maksimal 10 pegawai terlibat"); return; }
 const pKeys=participants.map(p=> `id:${p.employeeId}`);
 if(new Set(pKeys).size !== pKeys.length){ notify("Pegawai terlibat tidak boleh duplikat"); return; }
 for(const p of participants){
 if(!p.employeeId){ notify("Pilih pegawai terlibat"); return; }
 if(!p.role.trim()|| p.role.trim().length>30){ notify("Peran 1-30 karakter"); return; }
 }
 setSubmitting(true);
 try{
 const res=await fetch("/api/realizations",{method:"PATCH", headers:{"Content-Type":"application/json"}, credentials:"include", body: JSON.stringify({
 id: real.id,
 title: titleTrim,
 description,
 date,
 time,
 files: newFiles,
 fileNames: newFiles.map(f=>f.fileName),
 targets: filtered,
 participants,
 })});
 const j=await res.json().catch(()=>({}));
 if(!res.ok){ notify(j.error || "Gagal ubah realisasi"); setSubmitting(false); return; }
 // update dari server (j sudah mapOut dengan targets & participants)
 const serverReal = j && j.id ? j : null;
 if (serverReal) {
 setRealizations(prev=> prev.map(r=> r.id===real.id ? { ...r, title: serverReal.title ?? titleTrim, description: serverReal.description ?? description, date: serverReal.date ?? date, time: serverReal.time ?? time, targets: serverReal.targets ?? filtered.map(t=>({id: t.name, name:t.name, value:t.value, unit:t.unit})) as any, participants: serverReal.participants ?? participants.map(p=>({id:"rp"+Date.now()+Math.random().toString(36).slice(2,3), employeeId:p.employeeId, customName: null, role:p.role})) as any } : r));
 } else {
 setRealizations(prev=> prev.map(r=> r.id===real.id ? { ...r, title:titleTrim, description, date, time, targets: filtered.map(t=>({id: t.name, name:t.name, value:t.value, unit:t.unit})) as any, participants: participants.map(p=>({id:"rp"+Date.now()+Math.random().toString(36).slice(2,3), employeeId:p.employeeId, customName: null, role:p.role})) as any } : r));
 }
 // refetch fresh (no-cache) untuk sinkron attachments & plans
 fetch("/api/db", { cache:"no-store", credentials:"include" } as any).then(r=>r.ok?r.json():null).then(d=>{
 if(d?.realizations) setRealizations(d.realizations);
 if(d?.attachments) setAttachments(d.attachments);
 if(d?.plans) setPlans(d.plans);
 }).catch(()=>{});
 notify("Realisasi diperbarui");
 router.push(`/realisasi/${real.id}`);
 }catch(e:any){ notify(e?.message||"Gagal ubah"); }
 finally{ setSubmitting(false); }
 };

 return (
 <div className="max-w-[720px] mx-auto space-y-5">
 <div className="flex items-center gap-3">
 <Link href={`/realisasi/${real.id}`} className="w-8 h-8 rounded-full bg-white border border-[#e8e6e5] flex items-center justify-center text-[#78716c] hover:bg-[#fafaf9]">←</Link>
 <div>
 <p className="eyebrow">EDIT REALISASI</p>
 <h1 className="subheading text-[20px] leading-tight truncate">{real.title}</h1>
 <p className="text-[12px] text-[#78716c]">Tugas: {plan.title}</p>
 </div>
 </div>

 <div className="seline-card !p-5 space-y-4">
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Judul Realisasi *</label>
 <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:12}} />
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Deskripsi</label>
 <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:12}} />
 </div>

 {hasEffective && (
 <details className="border border-[#e8e6e5] rounded-xl bg-[#fafaf9]/50 group" style={{borderRadius:12}} open>
 <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
 <span className="text-[12px] tracking-[0.04em] uppercase font-semibold">Target Terealisasi <span className="normal-case font-normal text-[#0c0a09]/50">• {effective.length} kolom {isInherited ? "warisan induk" : "dari rencana"}</span></span>
 <span className="flex items-center gap-2">
 {filledCount>0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white">{filledCount}/{effective.length} terisi</span>}
 {filledCount===0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-[#e8e6e5] text-[#0c0a09]/60">{effective.length} kolom</span>}
 <span className="text-[#0c0a09]/40 group-open:rotate-180 transition-transform">▾</span>
 </span>
 </summary>
 <div className="px-3 pb-3">
 <p className="text-[12px] text-[#0c0a09]/60">Isi capaian sesuai target dari rencana. Kosongkan jika tidak terealisasi.</p>
 <div className="mt-3 space-y-2">
 {effective.map((eff:any, idx:number)=>{
 const curVal = targets[idx]?.value ?? "";
 return (
 <div key={eff.id ?? `${eff.name}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e6e5] bg-white" style={{borderRadius:12}}>
 <div className="flex-1 min-w-0">
 <div className="text-[14px] font-medium truncate">{eff.name}</div>
 <div className="text-[12px] text-[#0c0a09]/60">{eff.value} {eff.unit} • target</div>
 </div>
 <div className="shrink-0 w-[110px]">
 <input value={curVal} onChange={e=>{
 const copy=[...targets];
 while(copy.length < effective.length){
 const ei=effective[copy.length];
 copy.push({name:ei.name,value:"",unit:ei.unit});
 }
 let v=e.target.value.replace(/[^0-9]/g,"").slice(0,20);
 copy[idx]={name:eff.name,value:v,unit:eff.unit};
 if(copy.length>effective.length) copy.length=effective.length;
 setTargets(copy);
 }} placeholder="0" maxLength={20} inputMode="numeric" className="w-full px-3 py-2 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] text-center focus:outline-none focus:border-[#d6d3d1] focus:bg-white" style={{borderRadius:12}} />
 <div className="text-[10px] text-center mt-1 text-[#0c0a09]/50">{eff.unit}</div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </details>
 )}

 <details className="border border-[#e8e6e5] rounded-xl bg-white group" style={{borderRadius:12}} open>
 <summary className="list-none p-3 flex items-center justify-between cursor-pointer select-none">
 <span className="text-[12px] tracking-[0.04em] uppercase font-semibold">Pegawai Terlibat <span className="normal-case font-normal text-[#0c0a09]/50">• opsional</span></span>
 <span className="flex items-center gap-2">
 {participants.length>0 && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white">{participants.length} orang</span>}
 <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#fafaf9] border border-[#e8e6e5] text-[#0c0a09]/60 group-open:hidden">+ tambah</span>
 <span className="text-[#0c0a09]/40 group-open:rotate-180 transition-transform">▾</span>
 </span>
 </summary>
 <div className="px-3 pb-3">
 <div className="mt-3 space-y-2">
 {participants.map((p, idx)=>{
 return (
 <div key={idx} className="space-y-1">
 <div className="grid grid-cols-[1fr_110px_32px] sm:grid-cols-[1fr_120px_32px] gap-1.5 sm:gap-2 items-start">
 <div>
 <label className="text-[10px] tracking-wide uppercase text-[#0c0a09]/60">Pegawai</label>
 <select value={p.employeeId} onChange={e=>{
 const val=e.target.value;
 if (!val) return;
 if (participants.some((pp,i)=>i!==idx && pp.employeeId===val)) { notify("Pegawai sudah dipilih"); return; }
 const copy=[...participants];
 copy[idx]={...copy[idx], employeeId: val};
 setParticipants(copy);
 }} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}}>
 <option value="">-- Pilih pegawai --</option>
 {employees.filter(e=> !participants.some((pp,i)=>i!==idx && pp.employeeId===e.id)).map(e=>(
 <option key={e.id} value={e.id}>{e.name.split(",")[0]} — {roleLabel[e.role] ?? e.role}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-[10px] uppercase tracking-wide text-[#0c0a09]/60">Peran</label>
 <input value={p.role} onChange={e=>{ const copy=[...participants]; copy[idx]={...copy[idx], role:e.target.value}; setParticipants(copy); }} placeholder="Narasumber" className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[14px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 </div>
 <button type="button" onClick={()=> setParticipants(participants.filter((_,i)=>i!==idx))} className="mt-5 w-8 h-8 rounded-full bg-white border border-[#e8e6e5] text-[#b91c1c] flex items-center justify-center">×</button>
 </div>
 </div>
 );
 })}
 {participants.length < 10 && (
 <div className="relative">
 <button type="button" onClick={()=>{ if(!pickerOpen){ setTempSelected(new Set()); setPickerQ(""); } setPickerOpen(v=>!v); }} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#e8e6e5] bg-white hover:border-[#d6d3d1] text-left transition-colors" style={{borderRadius:8}}>
 <span className="text-[13px] text-[#78716c] truncate">Pilih pegawai untuk ditambah...</span>
 <span className="flex items-center gap-1.5 shrink-0">
 {tempSelected.size>0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#3ba6f1] text-white font-medium">{tempSelected.size}</span>}
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`text-[#a8a29e] transition-transform ${pickerOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
 </span>
 </button>
 {pickerOpen && (
 <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#e8e6e5] rounded-lg shadow-lg overflow-hidden" style={{borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.08)"}}>
 <div className="p-2 border-b border-[#e8e6e5] bg-[#fafaf9]/60 flex items-center gap-2">
 <input value={pickerQ} onChange={e=>setPickerQ(e.target.value)} placeholder="Cari nama / jabatan..." className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-[#e8e6e5] bg-white text-[13px] focus:outline-none focus:border-[#d6d3d1]" style={{borderRadius:8}} />
 <button type="button" onClick={()=>{
 const available=employees.filter(e=>{
 if(participants.some(pp=>pp.employeeId===e.id)) return false;
 if(!pickerQ.trim()) return true;
 const q=pickerQ.toLowerCase();
 return e.name.toLowerCase().includes(q) || (e.role&&e.role.toLowerCase().includes(q));
 });
 const remaining=10-participants.length;
 if (tempSelected.size >= Math.min(available.length, remaining) && available.length>0) {
 setTempSelected(new Set());
 } else {
 setTempSelected(new Set(available.slice(0, remaining).map(e=>e.id)));
 }
 }} className="text-[12px] font-medium text-[#3ba6f1] hover:underline whitespace-nowrap shrink-0">Pilih semua</button>
 </div>
 <div className="max-h-48 overflow-y-auto bg-white divide-y divide-[#e8e6e5]">
 {(() =>{
 const available=employees.filter(e=>{
 if(participants.some(pp=>pp.employeeId===e.id)) return false;
 if(!pickerQ.trim()) return true;
 const q=pickerQ.toLowerCase();
 return e.name.toLowerCase().includes(q) || (e.role&&e.role.toLowerCase().includes(q));
 });
 if(available.length===0) return <div className="p-3 text-[12px] text-center text-[#a8a29e]">Tidak ada pegawai</div>;
 return available.map(e=>{
 const checked=tempSelected.has(e.id);
 return (
 <label key={e.id} className="flex items-center gap-2 px-2 py-2 hover:bg-[#fafaf9] cursor-pointer">
 <input type="checkbox" checked={checked} onChange={ev=>{ const ns=new Set(tempSelected); if(ev.target.checked) ns.add(e.id); else ns.delete(e.id); setTempSelected(ns); }} className="accent-[#3ba6f1] w-4 h-4" />
 <span className="flex-1 text-[13px] truncate"><span className="font-medium">{e.name.split(",")[0]}</span> <span className="text-[11px] text-[#78716c]">— {roleLabel[e.role] ?? e.role}</span></span>
 </label>
 );
 });
 })()}
 </div>
 <div className="p-2 border-t border-[#e8e6e5] bg-[#fafaf9]/50 flex items-center justify-between gap-2">
 <span className="text-[11px] text-[#78716c]">{tempSelected.size} dipilih</span>
 <div className="flex gap-2">
 <button type="button" onClick={()=> setPickerOpen(false)} className="px-3 py-1.5 rounded-full border border-[#e8e6e5] bg-white text-[12px]">Batal</button>
 <button type="button" disabled={tempSelected.size===0} onClick={()=>{
 const remaining=10-participants.length;
 const toAdd=Array.from(tempSelected).slice(0,remaining);
 const newParts=toAdd.map(id=>({employeeId:id, role:"Peserta"} as any));
 setParticipants(prev=>[...prev, ...newParts]);
 setPickerOpen(false); setTempSelected(new Set()); setPickerQ("");
 }} className="px-4 py-1.5 rounded-full bg-[#3ba6f1] text-white text-[12px] font-medium disabled:opacity-40">Tambah {tempSelected.size?`(${tempSelected.size})`:""}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </details>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Tanggal</label>
 <DatePicker value={date} onChange={setDate} placeholder="Pilih tanggal realisasi" className="mt-1.5" />
 </div>
 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Jam</label>
 <div className="flex gap-2 mt-1.5">
 {(() =>{
 const [hStr,mStr]=(time||"09:00").split(":");
 const hVal=hStr?.padStart(2,"0") ?? "09";
 const mVal=mStr?.padStart(2,"0") ?? "00";
 return (
 <>
 <select value={hVal} onChange={e=> setTime(`${e.target.value}:${mVal}`)} className="flex-1 px-2 py-2.5 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px]" style={{borderRadius:12}}>
 {Array.from({length:24},(_,i)=> <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
 </select>
 <span className="flex items-center">:</span>
 <select value={mVal} onChange={e=> setTime(`${hVal}:${e.target.value}`)} className="flex-1 px-2 py-2.5 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px]" style={{borderRadius:12}}>
 {Array.from({length:60},(_,i)=> <option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}
 </select>
 </>
 );
 })()}
 </div>
 </div>
 </div>

 <div>
 <label className="text-[12px] tracking-[0.04em] uppercase font-semibold">Bukti — tambah baru (opsional)</label>
 <div className="mt-1.5 space-y-2">
 {existingFiles.length>0 && (
 <div className="space-y-1">
 <div className="text-[11px] text-[#78716c]">Bukti sudah ada ({existingFiles.length})</div>
 {existingFiles.map(a=>(
 <div key={a.id} className="flex items-center justify-between p-2 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[12px]" style={{borderRadius:12}}>
 <span className="truncate">📎 {a.fileName} • {a.fileSize}</span>
 <span className="text-[11px] text-[#a8a29e]">tersimpan</span>
 </div>
 ))}
 </div>
 )}
 <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv" onChange={handleFileChange} disabled={uploading} className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6e5] bg-[#fafaf9] text-[14px] file:mr-3 file:px-3 file:py-1 file:rounded-full file:border-0 file:bg-[#3ba6f1] file:text-white file:text-[12px] disabled:opacity-50" style={{borderRadius:12}} />
 {uploading && <p className="text-[11px] text-[#3ba6f1]">Mengunggah...</p>}
 {newFiles.length>0 && newFiles.map((f,idx)=>(
 <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[12px]" style={{borderRadius:12}}>
 <span className="truncate">📎 {f.fileName} • {f.fileSize}</span>
 <button type="button" onClick={()=> setNewFiles(newFiles.filter((_,i)=>i!==idx))} className="text-[#b91c1c]">hapus</button>
 </div>
 ))}
 <p className="text-[11px] text-[#a8a29e]">Total maks 5 bukti (sudah {existingFiles.length} + baru {newFiles.length})</p>
 </div>
 </div>
 </div>

 <div className="flex gap-2 justify-end">
 <Link href={`/realisasi/${real.id}`} className="px-5 py-2.5 rounded-full border border-[#e8e6e5] bg-white text-[14px]" style={{borderRadius:48}}>Batal</Link>
 <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 rounded-full bg-[#0c0a09] text-white text-[14px] font-medium disabled:opacity-40" style={{borderRadius:48}}>{submitting ? "Menyimpan..." : "Simpan Perubahan"}</button>
 </div>
 </div>
 );
}
