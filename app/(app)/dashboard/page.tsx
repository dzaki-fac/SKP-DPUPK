"use client";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

export default function DashboardPage() {
  const { currentUser, employees, plans, realizations, periods } = useSKP();
  if (!currentUser) return null;

  const totalPegawai = employees.length;
  const totalPimpinan2 = employees.filter(e => e.role === "pimpinan_2").length;
  const totalPimpinan3 = employees.filter(e => e.role === "pimpinan_3").length;
  const totalStaff = employees.filter(e => e.role === "staf").length;
  const totalPimpinan1 = employees.filter(e => e.role === "pimpinan_1").length;
  const totalAdmin = employees.filter(e => e.role === "admin").length;
  const totalRencana = plans.length;
  const selesaiCount = plans.filter(p => p.progress >= 100).length;
  const berjalanCount = totalRencana - selesaiCount;
  const orgProgress = Math.round(plans.reduce((a, b) => a + b.progress, 0) / (plans.length || 1));
  const totalRealisasi = realizations.length;
  const periodAktif = periods[0];
  const avgRealisasiPerRencana = totalRencana ? (totalRealisasi / totalRencana).toFixed(1) : "0";

  // Statistik per role (jabatan = role)
  const perRole = (["pimpinan_1","pimpinan_2","pimpinan_3","staf","admin"] as const).map(role => {
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
          <div className="font-mono text-xs text-[#283338]/60 mt-1">{totalPimpinan1} Direktur • {totalPimpinan2} Pimpinan 2 • {totalPimpinan3} Pimpinan 3 • {totalStaff} Staf • {totalAdmin} Admin</div>
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

      {/* Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-5 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow text-[11px]">PER ROLE</div>
          <table className="w-full mt-3 text-sm">
            <thead className="font-mono text-[11px] tracking-wide uppercase text-[#283338]/60 border-b border-[#e4f0f1]"><tr><th className="text-left py-1.5 font-semibold">Role</th><th className="text-center py-1.5 font-semibold">Pegawai</th><th className="text-center py-1.5 font-semibold">Rencana</th><th className="text-right py-1.5 font-semibold">Avg</th></tr></thead>
            <tbody>
              {perRole.map(j => (
                <tr key={j.role} className="border-b border-[#e4f0f1]/60">
                  <td className="py-2.5 font-medium">{ROLE_SHORT[j.role]}</td>
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
