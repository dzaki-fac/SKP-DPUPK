"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSKP } from "@/lib/store";

type Plan = { id: string; title: string; target: string; progress: number; skpPeriodId: string };
type Real = { id: string; planId: string; title: string; date: string; description: string };
type Period = { id: string; name: string; startDate: string; endDate: string };

export default function LandingPage() {
 const { currentUser } = useSKP();
 const [plans, setPlans] = useState<Plan[]>([]);
 const [reals, setReals] = useState<Real[]>([]);
 const [periods, setPeriods] = useState<Period[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch("/api/db").then(r => r.ok ? r.json() : null).then(d => {
 if (!d) return;
 setPlans(d.plans ?? []);
 setReals(d.realizations ?? []);
 setPeriods(d.periods ?? []);
 }).catch(()=>{}).finally(()=>setLoading(false));
 }, []);

 const totalRencana = plans.length;
 const totalRealisasi = reals.length;
 const avgProgress = plans.length ? Math.round(plans.reduce((a,b)=>a+(b.progress||0),0)/plans.length) : 0;
 const selesai = plans.filter(p=>p.progress>=100).length;
 const topRencana = [...plans].sort((a,b)=>b.progress-a.progress).slice(0,6);
 const recentReals = [...reals].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 const periodAktif = periods[0]?.name ?? "—";

 return (
 <div className="min-h-screen bg-[#fafaf9]">
 <header className="sticky top-0 z-30 bg-[#fafaf9]/80 backdrop-blur border-b border-[#e8e6e5]">
 <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between gap-6">
 <div className="flex items-center gap-2.5 shrink-0">
 <div className="w-[32px] h-[32px] rounded-[8px] bg-[#0c0a09] flex items-center justify-center">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
 <path d="M18 6.00002V6.75002H18.75V6.00002H18ZM15.7172 2.32614L15.6111 1.58368L15.7172 2.32614ZM4.91959 3.86865L4.81353 3.12619H4.81353L4.91959 3.86865ZM5.07107 6.75002H18V5.25002H5.07107V6.75002ZM18.75 6.00002V4.30604H17.25V6.00002H18.75ZM15.6111 1.58368L4.81353 3.12619L5.02566 4.61111L15.8232 3.0686L15.6111 1.58368ZM4.81353 3.12619C3.91638 3.25435 3.25 4.0227 3.25 4.92895H4.75C4.75 4.76917 4.86749 4.63371 5.02566 4.61111L4.81353 3.12619ZM18.75 4.30604C18.75 2.63253 17.2678 1.34701 15.6111 1.58368L15.8232 3.0686C16.5763 2.96103 17.25 3.54535 17.25 4.30604H18.75ZM5.07107 5.25002C4.89375 5.25002 4.75 5.10627 4.75 4.92895H3.25C3.25 5.9347 4.06532 6.75002 5.07107 6.75002V5.25002Z" fill="white"/>
 <path d="M8 12H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 <path d="M8 15.5H13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 <path d="M4 6V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V14M4 6V5M4 6H17C18.6569 6 20 7.34315 20 9V10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 </svg>
 </div>
 <span className="font-medium text-[14px] tracking-[-0.015em] text-[#0c0a09]" style={{ fontFamily: "var(--font-inter)"}}>SKP DPUPK</span>
 </div>
 {currentUser ? (
 <Link href="/dashboard" className="h-[32px] px-4 inline-flex items-center text-[14px] font-medium text-white bg-[#3ba6f1] border border-[#3398e1]" style={{ borderRadius: 9999 }}>Ke Dashboard →</Link>
 ) : (
 <Link href="/login" className="h-[32px] px-4 inline-flex items-center text-[14px] font-medium text-white bg-[#3ba6f1] border border-[#3398e1]" style={{ borderRadius: 9999 }}>Masuk →</Link>
 )}
 </div>
 </header>

 <main className="max-w-[1200px] mx-auto px-6 pb-12">
 <section className="pt-10 pb-8 max-w-[760px]">
 <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#78716c]" style={{ fontFamily: "var(--font-inter)"}}>MANAJEMEN KINERJA PEGAWAI</p>
 <h1 className="mt-3 text-[32px] md:text-[52px] font-normal leading-[1.12] tracking-[-1.092px] text-[#0c0a09]" style={{ fontFamily: "var(--font-roobert)"}}>
 Kinerja yang <span className="inline-flex px-2.5 py-0.5 text-[#3398e1] bg-[#c1e1f7] rounded-[4px]">transparan</span><br />
 terpantau setiap saat.
 </h1>
 <p className="mt-4 text-[16px] leading-[1.69] text-[#78716c] max-w-[560px]" style={{ fontFamily: "var(--font-inter)"}}>
 Ringkasan rencana dan realisasi SKP DPUPK periode {periodAktif} — terbuka untuk dipantau.
 </p>
 {!currentUser && (
 <div className="mt-6">
 <Link href="/login" className="px-5 py-2.5 bg-[#3ba6f1] text-white text-[14px] font-medium border border-[#3398e1] hover:brightness-[0.96] transition" style={{ borderRadius: 9999 }}>Masuk untuk mengelola →</Link>
 </div>
 )}
 </section>

 {loading ? (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {[0,1,2,3].map(i=><div key={i} className="seline-card animate-pulse h-24"/>)}
 </div>
 ) : (
 <>
 <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 <div className="seline-card !p-4">
 <div className="eyebrow !text-[10px]">Rencana</div>
 <div className="text-[32px] font-normal leading-none mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{totalRencana}</div>
 <div className="text-[12px] text-[#78716c] mt-1">{selesai} selesai</div>
 </div>
 <div className="seline-card !p-4">
 <div className="eyebrow !text-[10px]">Realisasi</div>
 <div className="text-[32px] font-normal leading-none mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{totalRealisasi}</div>
 <div className="text-[12px] text-[#78716c] mt-1">entri terkirim</div>
 </div>
 <div className="seline-card !p-4">
 <div className="eyebrow !text-[10px]">Rata-rata Progress</div>
 <div className="text-[32px] font-normal leading-none mt-1 text-[#3ba6f1]" style={{fontFamily:"var(--font-roobert)"}}>{avgProgress}%</div>
 <div className="mt-2 h-1.5 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><div className="h-full bg-[#3ba6f1]" style={{width:`${Math.min(avgProgress,100)}%`}} /></div>
 </div>
 <div className="seline-card !p-4">
 <div className="eyebrow !text-[10px]">Periode Aktif</div>
 <div className="text-[20px] font-normal leading-tight mt-1 text-[#0c0a09]" style={{fontFamily:"var(--font-roobert)"}}>{periodAktif}</div>
 <div className="text-[12px] text-[#78716c] mt-1">{periods[0] ? `${periods[0].startDate} → ${periods[0].endDate}` : "—"}</div>
 </div>
 </section>

 <section className="grid lg:grid-cols-2 gap-3 mt-3 items-start">
 <div className="seline-card !p-4">
 <div className="eyebrow">RINGKASAN RENCANA</div>
 {topRencana.length===0 ? (
 <div className="text-[13px] text-[#a8a29e] mt-2">Belum ada rencana.</div>
 ) : (
 <div className="mt-3 space-y-3">
 {topRencana.map(p=>(
 <div key={p.id}>
 <div className="flex items-center justify-between gap-2">
 <span className="text-[13px] font-medium text-[#0c0a09] truncate">{p.title}</span>
 <span className="text-[12px] font-medium text-[#0c0a09] shrink-0 tabular-nums">{p.progress}%</span>
 </div>
 <div className="mt-1.5 h-1.5 bg-[#fafaf9] rounded-full overflow-hidden border border-[#e8e6e5]"><div className="h-full bg-[#3ba6f1]" style={{width:`${Math.min(p.progress,100)}%`}} /></div>
 <div className="text-[11px] text-[#a8a29e] mt-0.5">Target {p.target}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="seline-card !p-4">
 <div className="eyebrow">REALISASI TERBARU</div>
 {recentReals.length===0 ? (
 <div className="text-[13px] text-[#a8a29e] mt-2">Belum ada realisasi.</div>
 ) : (
 <div className="mt-3 divide-y divide-[#e8e6e5]">
 {recentReals.map(r=>{
 const plan = plans.find(p=>p.id===r.planId);
 return (
 <div key={r.id} className="py-2.5 first:pt-0 last:pb-0">
 <div className="text-[13px] font-medium text-[#0c0a09] leading-tight truncate">{r.title || "Realisasi"}</div>
 <div className="text-[12px] text-[#78716c] truncate mt-0.5">{plan?.title ?? "—"}</div>
 <div className="text-[11px] text-[#a8a29e] tabular-nums mt-0.5">{r.date}</div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </section>
 </>
 )}

 <div className="text-center text-[10px] tracking-[0.06em] uppercase text-[#a8a29e] pt-10" style={{ fontFamily: "var(--font-inter)"}}>© 2026 DPUPK Kabupaten</div>
 </main>
 </div>
 );
}
