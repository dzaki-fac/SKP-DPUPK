"use client";
import Link from "next/link";
import { useSKP } from "@/lib/store";
import { PlanCard } from "@/components/ui/PlanCard";

export default function DashboardPage() {
  const { currentUser, employees, plans, realizations, logs, getDirectSubordinates, visiblePlans: myPlans } = useSKP();
  if (!currentUser) return null;

  const totalPegawai = employees.length;
  const totalSupervisor = employees.filter(e => e.role === "supervisor").length;
  const totalStaff = employees.filter(e => e.role === "staff").length;
  const totalRencana = plans.length;
  const orgProgress = Math.round(plans.reduce((a, b) => a + b.progress, 0) / (plans.length || 1));
  const selesaiCount = plans.filter(p => p.progress >= 100).length;

  return (
    <div className="space-y-8">
      {/* Hero — editorial, warm paper */}
      <section className="relative overflow-hidden rounded-[12px] border border-[#e4f0f1] bg-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[380px] h-[380px] rounded-full bg-[#e4f0f1] opacity-60 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-[320px] h-[320px] rounded-full bg-[#f2e8e2] opacity-70 blur-3xl" />
        </div>
        <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-6 p-6 lg:p-8">
          <div>
            <p className="eyebrow flex items-center gap-2">DASHBOARD • <span className="text-[#1c5d5f]">{roleLabelUpper(currentUser.role)}</span></p>
            <h1 className="heading-serif text-[34px] lg:text-[44px] leading-[1.05] mt-2">
              Selamat datang,<br />
              <span className="italic font-bold">{currentUser.name.split(",")[0]}</span>
              <span className="font-normal text-[#283338]/60">.</span>
            </h1>
              <p className="text-[15px] leading-6 text-[#283338]/70 mt-3 max-w-[560px]">
                {currentUser.role === "direktur" ? "Lihat capaian per supervisor dan dorong pelimpahan." : currentUser.role === "supervisor" ? "Kelola turunan untuk staff dan verifikasi realisasi." : currentUser.role === "staff" ? "Fokus pada targetmu dan pantau progres harian." : "Monitoring global seluruh organisasi."}
              </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/rencana" className="px-5 py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152] transition" style={{ borderRadius: 48 }}>Buka Rencana →</Link>
              <Link href="/tree" className="px-5 py-2.5 rounded-full bg-white border border-[#0e4749] text-[#0e4749] text-sm font-medium hover:bg-[#f2f8f7] transition" style={{ borderRadius: 48 }}>Lihat Cascading</Link>
            </div>
          </div>
          {/* Right — period + quick stats */}
          <div className="space-y-4">
            <div className="rounded-[12px] border border-[#a2cbcd] bg-[#e4f0f1] p-5">
              <div className="eyebrow text-[11px] flex items-center gap-2">PERIODE AKTIF</div>
              <div className="heading-serif text-[22px] mt-1">SKP 2026</div>
              <div className="font-mono text-xs tracking-wide text-[#283338]/60">01 Jan — 31 Des 2026 • 365 hari</div>
              <div className="mt-4">
                <div className="flex justify-between font-mono text-xs"><span className="uppercase tracking-wide text-[#283338]/60">Progress periode</span><span className="font-bold text-[#1c5d5f]">68%</span></div>
                <div className="h-2 bg-white rounded-full overflow-hidden mt-1 border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: "68%" }} /></div>
                <div className="font-mono text-[11px] text-[#283338]/50 mt-1">248 hari berjalan • sisa 117 hari</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { k: "Rencana", v: totalRencana },
                  { k: "Selesai", v: selesaiCount },
                  { k: "Progress", v: `${orgProgress}%` },
                ].map(s => (
                  <div key={s.k} className="rounded-xl bg-white border border-[#e4f0f1] py-2.5" style={{ borderRadius: 12 }}>
                    <div className="heading-serif text-lg leading-none">{s.v}</div><div className="font-mono text-[10px] tracking-[0.06em] uppercase text-[#283338]/60 mt-1">{s.k}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[12px] bg-[#f2e8e2] border border-[#e4f0f1] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center text-[#1c5d5f]">✦</div>
              <div className="text-sm leading-tight"><div className="font-medium text-[#283338]">Alur terhubung</div><div className="text-xs text-[#283338]/60">Rencana atasan mengalir ke bawahan otomatis</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip — mono, bordered */}
      <div className="flex flex-wrap gap-3 lg:gap-0 lg:justify-between py-3 px-4 border-y border-[#e4f0f1] bg-white/70">
        {[
          { n: String(totalPegawai), l: "TOTAL PEGAWAI" },
          { n: `${totalSupervisor} SUPERVISOR`, l: `• ${totalStaff} STAFF` },
          { n: String(totalRencana), l: "RENCANA" },
          { n: String(realizations.length), l: "REALISASI" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-[0.04em]">{s.n}</span>
            <span className="font-mono text-xs tracking-[0.06em] uppercase text-[#283338]/60">{s.l}</span>
            {i < 3 && <span className="hidden lg:inline text-[#a2cbcd] ml-4">|</span>}
          </div>
        ))}
      </div>

      {/* 4 stat cards — refined */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pegawai", value: totalPegawai, sub: `${totalSupervisor} Supervisor • ${totalStaff} Staff`, accent: "#65b8a2" },
          { label: "Rencana Kinerja", value: totalRencana, sub: `${selesaiCount} selesai`, accent: "#1c5d5f" },
          { label: "Capaian Org", value: `${orgProgress}%`, sub: `${selesaiCount} selesai • avg progress`, accent: "#16325a" },
          { label: "Realisasi", value: realizations.length, sub: `${realizations.length} entri`, accent: "#65b8a2" },
        ].map(c => (
          <div key={c.label} className="p-5 border bg-white relative overflow-hidden" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[32px] opacity-10" style={{ background: c.accent }} />
            <div className="eyebrow text-[11px] flex items-center gap-1.5">{c.label.toUpperCase()}</div>
            <div className="heading-serif text-[30px] mt-2 leading-none">{c.value}</div><div className="text-xs text-[#283338]/60 mt-1 leading-tight">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Role-specific — two-column feature cards style */}
      {currentUser.role === "direktur" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 lg:p-7 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow flex items-center gap-2">PROGRESS ORGANISASI • SKP 2026</div>
            <h3 className="heading-serif text-[24px] mt-2">Capaian per supervisor</h3>
            <p className="text-sm text-[#283338]/60 mt-1">Rata-rata progress dari rencana yang diampu. Klik untuk detail.</p>
            <div className="mt-6">
              {/* Org big bar */}
              <div className="rounded-xl bg-white border border-[#e4f0f1] p-4 flex items-center gap-4" style={{ borderRadius: 12 }}>
                <div className="relative w-14 h-14 shrink-0">
                  <svg width="56" height="56" viewBox="0 0 36 36" className="block">
                    <path d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32" fill="none" stroke="#f2f8f7" strokeWidth="2" />
                    <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="#1c5d5f" strokeWidth="2.5" strokeDasharray={`${orgProgress},100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-[#1c5d5f]">{orgProgress}%</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#231e21]">Progress Organisasi</div><div className="font-mono text-xs text-[#283338]/60">{totalRencana} rencana</div>
                  <div className="h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden mt-2 border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(orgProgress, 100)}%` }} /></div>
                </div>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {getDirectSubordinates(currentUser.id).map(sup => {
                  const pls = plans.filter(p => p.assignedTo === sup.id); const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
                  return (
                    <div key={sup.id} className="rounded-xl bg-white border border-[#e4f0f1] p-4" style={{ borderRadius: 12 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{sup.avatar}</div>
                        <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{sup.name.split(",")[0]}</div><div className="font-mono text-xs text-[#283338]/60">{pls.length} rencana • avg</div></div>
                        <span className="font-mono text-sm font-bold text-[#1c5d5f]">{avg}%</span>
                      </div>
                      <div className="h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden mt-3 border border-[#e4f0f1]"><div className="h-full bg-[#65b8a2]" style={{ width: `${Math.min(avg, 100)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm">
                <li className="flex gap-2 items-start rounded-xl bg-white border border-[#e4f0f1] px-3 py-2.5" style={{ borderRadius: 12 }}><span className="text-[#1c5d5f] font-bold mt-0.5">✓</span><span><span className="font-medium">Alur fleksibel</span><br /><span className="text-xs text-[#283338]/60">Mendukung banyak tingkatan organisasi</span></span></li>
                <li className="flex gap-2 items-start rounded-xl bg-white border border-[#e4f0f1] px-3 py-2.5" style={{ borderRadius: 12 }}><span className="text-[#1c5d5f] font-bold mt-0.5">✓</span><span><span className="font-medium">Hanya ke bawahan</span><br /><span className="text-xs text-[#283338]/60">Rencana hanya bisa diturunkan ke tim sendiri</span></span></li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="eyebrow text-[11px]">RENCANA TERBARU</div>
              <div className="mt-3 space-y-2">{plans.slice(0, 4).map(p => (
                <Link key={p.id} href="/rencana" className="block p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] hover:border-[#a2cbcd] hover:bg-white transition" style={{ borderRadius: 12 }}>
                  <div className="text-sm font-medium truncate leading-tight">{p.title}</div>
                  <div className="font-mono text-xs tracking-wide text-[#283338]/60">{employees.find(e => e.id === p.assignedTo)?.name.split(",")[0]} • {p.progress}%</div>
                </Link>
              ))}</div>
              <Link href="/rencana" className="mt-4 block text-center py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Lihat semua rencana →</Link>
            </div>
            <div className="p-6 border bg-[#f2e8e2]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="eyebrow text-[11px]">AKTIVITAS TERBARU</div>
              <div className="mt-3 space-y-2">{logs.slice(0,3).map(l => (
                <div key={l.id} className="p-2.5 rounded-xl bg-white border border-[#e4f0f1] " style={{ borderRadius: 12 }}>
                  <div className="font-mono text-[11px] tracking-wide text-[#1c5d5f] uppercase">{l.action}</div><div className="text-xs text-[#283338] truncate">{l.description}</div><div className="font-mono text-[11px] text-[#283338]/50">{l.createdAt}</div>
                </div>
              ))}</div>
              <Link href="/audit" className="mt-3 block text-center py-2 rounded-full bg-white border border-[#e4f0f1] text-xs font-medium hover:border-[#a2cbcd]" style={{ borderRadius: 48 }}>Buka Audit Trail</Link>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === "supervisor" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow">RENCANA DARI ATASAN</div>
            <h3 className="heading-serif text-[22px] mt-1">Tugas yang dilimpahkan kepada Anda</h3>
            <p className="text-sm text-[#283338]/60 mt-1">Turunkan lagi ke staff — pilih rencana → Limpahkan.</p>
            <div className="mt-4 space-y-3">{plans.filter(p => p.assignedTo === currentUser.id).map(p => <PlanCard key={p.id} p={p} />)}{plans.filter(p => p.assignedTo === currentUser.id).length === 0 && <div className="p-8 text-center rounded-xl bg-white border border-dashed border-[#a2cbcd] text-sm text-[#283338]/60" style={{ borderRadius: 12 }}>Tidak ada rencana dari atasan — hubungi Direktur.</div>}</div>
          </div>
          <div className="space-y-4">
            <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="eyebrow text-[11px]">STAFF BAWAHAN</div>
              <div className="mt-3 space-y-2">{getDirectSubordinates(currentUser.id).map(s => {
                const pls = plans.filter(p => p.assignedTo === s.id); const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                    <div className="w-8 h-8 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-xs font-bold shrink-0">{s.avatar}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.name.split(",")[0]}</div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{avg}% • {pls.length} rencana</div></div>
                    <span className="font-mono text-xs font-bold text-[#1c5d5f]">{avg}%</span>
                  </div>
                );
              })}</div>
              <Link href="/organisasi" className="mt-3 block text-center text-xs font-mono tracking-wide text-[#1c5d5f] hover:underline">Lihat struktur →</Link>
            </div>
            <div className="p-5 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="eyebrow text-[11px]">REALISASI BAWAHAN</div>
              <div className="heading-serif text-3xl mt-1">{realizations.filter(r => { const plan = plans.find(p => p.id === r.planId); return plan && getDirectSubordinates(currentUser.id).some(s => s.id === plan.assignedTo); }).length}</div>
              <div className="text-xs text-[#283338]/70">Total realisasi staff</div>
              <Link href="/realisasi" className="mt-3 block text-center py-2.5 rounded-full bg-[#16325a] text-white text-xs font-medium hover:opacity-90" style={{ borderRadius: 48 }}>Lihat realisasi →</Link>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === "staff" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {myPlans.map(p => <PlanCard key={p.id} p={p} />)}
            {myPlans.length === 0 && <div className="p-8 text-center border border-dashed bg-white text-[#283338]/60" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>Belum ada rencana kinerja yang ditugaskan</div>}
          </div>
          <div className="space-y-4">
            <div className="p-6 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="eyebrow text-[11px]">RINGKASAN KINERJA</div>
              {(() => { const avg = myPlans.length ? Math.round(myPlans.reduce((a, b) => a + b.progress, 0) / myPlans.length) : 0;
                return (
                  <>
                    <div className="flex items-end gap-3 mt-2"><div className="heading-serif text-4xl leading-none">{avg}<span className="text-2xl">%</span></div><div className="font-mono text-xs tracking-wide uppercase text-[#283338]/60 pb-1">rata-rata capaian</div></div>
                    <div className="mt-3 h-2 bg-white rounded-full overflow-hidden border border-[#e4f0f1]"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(avg, 100)}%` }} /></div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-xl border border-[#e4f0f1] text-center" style={{ borderRadius: 12 }}><div className="heading-serif text-xl leading-none">{myPlans.length}</div><div className="font-mono text-[11px] uppercase tracking-wide text-[#283338]/60 mt-1">Rencana</div></div>
                      <div className="p-3 bg-white rounded-xl border border-[#e4f0f1] text-center" style={{ borderRadius: 12 }}><div className="heading-serif text-xl leading-none">{realizations.filter(r => myPlans.some(m => m.id === r.planId)).length}</div><div className="font-mono text-[11px] uppercase tracking-wide text-[#283338]/60 mt-1">Realisasi</div></div>
                    </div>
                  </>
                );
              })()}
              <ul className="mt-4 space-y-1.5 text-xs p-3 rounded-xl bg-white border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
                <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> Upload bukti PDF/JPG/PNG</li>
                <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> Pantau progres real-time</li>
              </ul>
              <Link href="/realisasi" className="mt-3 block text-center py-2.5 rounded-full bg-[#16325a] text-white text-xs font-medium" style={{ borderRadius: 48 }}>Buka Realisasi →</Link>
            </div>
            {false && <div className="hidden" />}
          </div>
        </div>
      )}

      {currentUser.role === "admin" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><div className="eyebrow">ADMIN • MONITORING GLOBAL</div><h3 className="heading-serif text-[24px] mt-1">Seluruh rencana kinerja</h3></div>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#e4f0f1] border border-[#a2cbcd]" style={{ borderRadius: 100 }}>{plans.length} rencana</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">{plans.map(p => <PlanCard key={p.id} p={p} />)}</div>
        </div>
      )}
    </div>
  );
}

function roleLabelUpper(r: string) { return r.toUpperCase(); }
