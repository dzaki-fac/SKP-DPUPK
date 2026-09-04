"use client";
import { useMemo } from "react";
import { useSKP } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";

// Laporan SKP (pekerjaan/kinerja).
// Menggunakan data SKP SUDAH ADA (plans + realizations). Bisa di-export ke CSV
// yang langsung terbuka di Excel (delimiter ';' + BOM, sesuai regional Excel Indonesia).
// Hak akses mengikuti lingkup kewenangan: admin = semua, pimpinan_1 = semua,
// pimpinan_2/3 = diri + subtree (supervisorId), staf = akun sendiri.

function escCSV(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

export default function SkpReport() {
  const { plans, realizations, employees, periods, currentUser, getSubordinates } = useSKP();

  // Lingkup pegawai yang boleh dilihat sesuai role — kompatibel dengan store saat ini
  // (hanya supervisorId single chain, tanpa EmployeeSupervisor multi-relasi).
  const canViewIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const me = currentUser.id;
    if (currentUser.role === "staf") return new Set([me]);
    if (currentUser.role === "admin" || currentUser.role === "pimpinan_1") return new Set(employees.map(e => e.id));
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

  const exportCSV = () => {
    const header = [
      "Nama", "NIP", "Jabatan/Unit", "Periode SKP", "Sasaran/Kegiatan", "Indikator",
      "Target", "Realisasi", "Progress (%)", "Status", "Pimpinan/Penilai", "Dibuat Oleh",
    ];
    const line = (vals: Array<string | number>) => vals.map(escCSV).join(";");
    const body = rows.map(r =>
      line([r.nama, r.nip, r.jabatan, r.periode, r.sasaran, r.indikator, r.target, r.realisasi, r.progress, r.status, r.penilai, r.dibuatOleh])
    );
    const csv = "\uFEFF" + [line(header), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-skp.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="px-4 py-3 border-b border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.07em] text-[#6b7280]">Laporan SKP (Pekerjaan / Kinerja)</span>
          </div>
          {currentUser && (
            <button
              onClick={exportCSV}
              disabled={rows.length === 0}
              className="px-3.5 py-1.5 rounded-md bg-[#0e7490] text-white text-[12.5px] font-medium hover:bg-[#155e75] disabled:opacity-50"
            >
              ⬇ Export CSV
            </button>
          )}
        </div>

        {!currentUser ? (
          <div className="px-4 py-14 text-center text-[#6b7280] text-sm">
            Memuat data laporan…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-14 text-center text-[#6b7280] text-sm">Belum ada data rencana kinerja.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left font-mono text-[10.5px] uppercase tracking-[0.05em] text-[#283338]/50">
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
                  <tr key={i} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#f3f4f6]/60 align-top">
                    <td className="px-4 py-2.5 font-medium text-[#111827] whitespace-nowrap">{r.nama}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#283338]/55 whitespace-nowrap">{r.nip}</td>
                    <td className="px-4 py-2.5 text-[#283338]/70 whitespace-nowrap">{r.jabatan}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#283338]/60 whitespace-nowrap">{r.periode}</td>
                    <td className="px-4 py-2.5 text-[#283338]">{r.sasaran}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11.5px] text-[#283338]/70">{r.target}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11.5px] text-[#283338]/70">{r.realisasi}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11.5px] text-[#0e7490]">{r.progress}%</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`font-mono text-[11px] ${progressTone(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[#283338]/70 whitespace-nowrap">{r.penilai}</td>
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
  if (status === "Tercapai") return "text-[#17643a]";
  if (status === "Berjalan") return "text-[#0e7490]";
  return "text-[#9ca3af]";
}
