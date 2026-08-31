"use client";
import Link from "next/link";
import { useSKP } from "@/lib/store";

export default function DashboardPage() {
  const { currentUser, employees, plans, realizations, periods } = useSKP();
  if (!currentUser) return null;

  const totalPegawai = employees.length;
  const totalSupervisor = employees.filter(e => e.role === "supervisor").length;
  const totalStaff = employees.filter(e => e.role === "staff").length;
  const totalDirektur = employees.filter(e => e.role === "direktur").length;
  const totalAdmin = employees.filter(e => e.role === "admin").length;
  const totalRencana = plans.length;
  const selesaiCount = plans.filter(p => p.progress >= 100).length;
  const berjalanCount = totalRencana - selesaiCount;
  const orgProgress = Math.round(plans.reduce((a, b) => a + b.progress, 0) / (plans.length || 1));
  const totalRealisasi = realizations.length;
  const periodAktif = periods[0];
  const avgRealisasiPerRencana = totalRencana ? (totalRealisasi / totalRencana).toFixed(1) : "0";

  // Statistik per role (jabatan = role)
  const perRole = (["direktur","supervisor","staff","admin"] as const).map(role => {
    const emps = employees.filter(e => e.role === role);
    const pls = plans.filter(p => emps.some(e => e.id === p.assignedTo));
    const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
    return { role, emps: emps.length, pls: pls.length, avg };
  });

  // Statistik per pegawai (top)
  const perPegawai = [...employees]
    .map(e => {
      const pls = plans.filter(p => p.assignedTo === e.id);
      const avg = pls.length ? Math.round(pls.reduce((a, b) => a + b.progress, 0) / pls.length) : 0;
      const reals = realizations.filter(r => {
        const pl = plans.find(p => p.id === r.planId);
        return pl?.assignedTo === e.id;
      }).length;
      return { e, pls: pls.length, avg, reals };
    })
    .sort((a, b) => b.avg - a.avg);

  // Rencana yang saya terlibat + perannya
  const myInvolved = (() => {
    const map = new Map<string, { plan: typeof plans[number]; roles: Set<string> }>();
    // 1) sebagai pelaksana (assignedTo)
    for (const p of plans) {
      if (p.assignedTo === currentUser.id) {
        const entry = map.get(p.id) ?? { plan: p, roles: new Set<string>() };
        entry.roles.add("Pelaksana");
        map.set(p.id, entry);
      }
    }
    // 2) sebagai peserta realisasi (participants)
    for (const r of realizations) {
      const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
      if (!parts) continue;
      const myPart = parts.find(pp => pp.employeeId === currentUser.id);
      if (myPart) {
        const plan = plans.find(p => p.id === r.planId);
        if (!plan) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add(myPart.role);
        map.set(plan.id, entry);
      }
    }
    // 3) sebagai pengirim realisasi (uploadedBy) tapi bukan pelaksana — tetap tampil sebagai Kontributor
    for (const r of realizations) {
      if (r.uploadedBy === currentUser.id) {
        const plan = plans.find(p => p.id === r.planId);
        if (!plan || plan.assignedTo === currentUser.id) continue; // sudah terhitung Pelaksana
        const parts = (r as any).participants as Array<{employeeId:string,role:string}> | undefined;
        const already = parts?.some(p=>p.employeeId===currentUser.id);
        if (already) continue;
        const entry = map.get(plan.id) ?? { plan, roles: new Set<string>() };
        entry.roles.add("Kontributor");
        map.set(plan.id, entry);
      }
    }
    return [...map.values()].sort((a,b)=> a.plan.title.localeCompare(b.plan.title));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">DASHBOARD • <span className="text-[#1c5d5f]">{currentUser.role.toUpperCase()}</span> • {currentUser.name.split(",")[0]}</p>
        <h2 className="heading-serif text-[28px]">Statistik</h2>
        <p className="text-sm text-[#283338]/60">Ringkasan angka — tanpa daftar tugas.</p>
      </div>

      {/* Periode */}
      <div className="rounded-[12px] border border-[#a2cbcd] bg-[#e4f0f1] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow text-[11px]">PERIODE AKTIF</div>
          <div className="heading-serif text-[20px] mt-1">{periodAktif?.name ?? "—"}</div>
          <div className="font-mono text-xs tracking-wide text-[#283338]/60">{periodAktif ? `${periodAktif.startDate} → ${periodAktif.endDate}` : "—"}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-[#283338]/60">Avg progress organisasi</div>
          <div className="heading-serif text-2xl text-[#1c5d5f]">{orgProgress}%</div>
          <div className="h-1.5 w-32 bg-white rounded-full overflow-hidden border border-[#e4f0f1] mt-1 ml-auto"><div className="h-full bg-[#1c5d5f]" style={{ width: `${Math.min(orgProgress, 100)}%` }} /></div>
        </div>
      </div>

      {/* Kartu utama — 4 statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">PEGAWAI</div>
          <div className="heading-serif text-[30px] leading-none mt-1">{totalPegawai}</div>
          <div className="font-mono text-xs text-[#283338]/60 mt-1">{totalDirektur} Direktur • {totalSupervisor} Supervisor • {totalStaff} Staff • {totalAdmin} Admin</div>
        </div>
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">RENCANA</div>
          <div className="heading-serif text-[30px] leading-none mt-1">{totalRencana}</div>
          <div className="font-mono text-xs text-[#283338]/60 mt-1">{selesaiCount} selesai • {berjalanCount} berjalan</div>
          <div className="h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1] mt-2"><div className="h-full bg-[#1c5d5f]" style={{ width: `${totalRencana ? (selesaiCount/totalRencana)*100 : 0}%` }} /></div>
        </div>
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">REALISASI</div>
          <div className="heading-serif text-[30px] leading-none mt-1">{totalRealisasi}</div>
          <div className="font-mono text-xs text-[#283338]/60 mt-1">avg {avgRealisasiPerRencana} / rencana • {totalRealisasi} entri</div>
        </div>
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">CAPAIAN</div>
          <div className="heading-serif text-[30px] leading-none mt-1">{orgProgress}%</div>
          <div className="font-mono text-xs text-[#283338]/60 mt-1">{selesaiCount}/{totalRencana} rencana ≥100%</div>
        </div>
      </div>

      {/* Rencana yang saya terlibat */}
      <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow text-[11px]">RENCANA SAYA TERLIBAT</div>
            <div className="heading-serif text-[18px] mt-1">Saya terlibat di {myInvolved.length} rencana sebagai {myInvolved.length===0 ? "—" : [...new Set(myInvolved.flatMap(x=>[...x.roles]))].join(", ")}</div>
            <div className="font-mono text-xs text-[#283338]/60 mt-1">Pelaksana + peserta realisasi (peran: Moderator, Narasumber, dll) • klik untuk detail</div>
          </div>
          <Link href="/rencana" className="hidden sm:inline-flex px-3 py-1.5 rounded-full border border-[#e4f0f1] bg-[#f2f8f7] text-xs font-medium hover:bg-white" style={{ borderRadius: 100 }}>Lihat Rencana →</Link>
        </div>
        {myInvolved.length === 0 ? (
          <div className="mt-3 p-4 rounded-xl bg-[#f2f8f7] border border-dashed border-[#a2cbcd] text-center" style={{ borderRadius: 12 }}>
            <div className="text-sm text-[#283338]/70">Belum terlibat di rencana manapun</div>
            <div className="font-mono text-xs text-[#283338]/50 mt-1">Anda akan muncul di sini setelah ditugaskan sebagai Pelaksana atau dipilih sebagai pegawai terlibat di realisasi</div>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60 border-b border-[#e4f0f1]">
                <tr><th className="text-left py-1.5 font-semibold">Rencana</th><th className="text-left py-1.5 font-semibold">Peran Saya</th><th className="text-center py-1.5 font-semibold">Target</th><th className="text-left py-1.5 font-semibold">Progress</th></tr>
              </thead>
              <tbody>
                {myInvolved.map(({ plan, roles }) => {
                  const period = periods.find(p=>p.id===plan.skpPeriodId);
                  const isPelaksana = roles.has("Pelaksana");
                  return (
                    <tr key={plan.id} className="border-b border-[#e4f0f1]/60 hover:bg-[#f2f8f7]/50">
                      <td className="py-2.5 pr-2">
                        <Link href={`/rencana/${plan.id}`} className="font-medium text-[#231e21] hover:text-[#1c5d5f] hover:underline underline-offset-2 line-clamp-2 leading-snug">{plan.title}</Link>
                        <div className="font-mono text-[11px] text-[#283338]/50 truncate">{period?.name ?? plan.skpPeriodId}{plan.plannedDate ? ` • ${plan.plannedDate} ${plan.plannedTime ?? "09:00"} WIB` : ""}</div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {[...roles].map(role=>(
                            <span key={role} className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[11px] border ${role==="Pelaksana" ? "bg-[#1c5d5f] text-white border-[#1c5d5f]" : role==="Kontributor" ? "bg-[#e4f0f1] text-[#1c5d5f] border-[#a2cbcd]" : "bg-[#f2e8e2] text-[#4a2c2a] border-[#d6aec1]"}`} style={{ borderRadius: 100 }}>{role}</span>
                          ))}
                        </div>
                        {isPelaksana && <div className="font-mono text-[10px] text-[#283338]/50 mt-0.5">Penanggung jawab</div>}
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs font-bold text-[#1c5d5f]">{plan.customTargets && plan.customTargets.length>0 ? `${plan.customTargets.length} kolom` : plan.target}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-14 h-1.5 bg-[#f2f8f7] rounded-full overflow-hidden border border-[#e4f0f1]"><span className="block h-full bg-[#1c5d5f]" style={{ width: `${Math.min(plan.progress,100)}%` }} /></span>
                          <span className="font-mono text-xs font-bold text-[#1c5d5f]">{plan.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">PER ROLE</div>
          <table className="w-full mt-3 text-sm">
            <thead className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60 border-b border-[#e4f0f1]"><tr><th className="text-left py-1.5 font-semibold">Role</th><th className="text-center py-1.5 font-semibold">Pegawai</th><th className="text-center py-1.5 font-semibold">Rencana</th><th className="text-right py-1.5 font-semibold">Avg</th></tr></thead>
            <tbody>
              {perRole.map(j => (
                <tr key={j.role} className="border-b border-[#e4f0f1]/60">
                  <td className="py-2.5 font-medium capitalize">{j.role}</td>
                  <td className="py-2.5 text-center font-mono text-xs">{j.emps}</td>
                  <td className="py-2.5 text-center font-mono text-xs">{j.pls}</td>
                  <td className="py-2.5 text-right"><span className={`font-mono text-xs font-bold px-2 py-1 rounded-full ${j.avg >= 70 ? "bg-[#e4f0f1] text-[#1c5d5f]" : j.avg >= 40 ? "bg-[#f2e8e2] text-[#283338]" : "bg-[#f2f8f7] text-[#283338]/60"}`} style={{ borderRadius: 100 }}>{j.avg}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">PER PEGAWAI</div>
          <table className="w-full mt-3 text-sm">
            <thead className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60 border-b border-[#e4f0f1]"><tr><th className="text-left py-1.5 font-semibold">Nama</th><th className="text-center py-1.5 font-semibold">Rencana</th><th className="text-center py-1.5 font-semibold">Realisasi</th><th className="text-right py-1.5 font-semibold">Avg</th></tr></thead>
            <tbody>
              {perPegawai.slice(0, 8).map(r => (
                <tr key={r.e.id} className="border-b border-[#e4f0f1]/60">
                  <td className="py-2 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#16325a] text-white flex items-center justify-center text-[10px] font-bold">{r.e.avatar}</span><span className="text-xs font-medium truncate max-w-[140px]">{r.e.name.split(",")[0]}</span></td>
                  <td className="py-2 text-center font-mono text-xs">{r.pls}</td>
                  <td className="py-2 text-center font-mono text-xs">{r.reals}</td>
                  <td className="py-2 text-right font-mono text-xs font-bold text-[#1c5d5f]">{r.avg}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {perPegawai.length > 8 && <div className="font-mono text-xs text-[#283338]/50 mt-2 text-center">+{perPegawai.length - 8} pegawai lainnya</div>}
        </div>
      </div>
    </div>
  );
}
