"use client";
import { useMemo } from "react";
import { useSKP } from "@/lib/store";

// Riwayat Aktivitas Khusus Admin: perubahan administratif Akun & Organisasi,
// diambil dari activity_logs existing (entityType employee / employee_supervisor).
// BUKAN aktivitas pekerjaan/SKP.

const ORG_TYPES = new Set(["employee", "employee_supervisor"]);

const ACTION_TONE: Record<string, string> = {
  "Menambah pegawai": "#16325a",
  "Menghapus pegawai": "#b91c1c",
  "Mengubah akun/pegawai": "#0e7490",
  "Menambah pimpinan": "#1c5d5f",
  "Mengubah organisasi": "#2f7a7c",
  "Memindahkan pegawai": "#0e7490",
};

function tone(action: string) {
  if (action in ACTION_TONE) return ACTION_TONE[action];
  if (action.toLowerCase().includes("pimpinan")) return "#2f7a7c";
  if (action.toLowerCase().includes("hapus")) return "#b91c1c";
  return "#6b7280";
}

export default function OrgAdminActivity() {
  const { logs, employees, currentUser } = useSKP();
  const isAdmin = !!currentUser && currentUser.role === "admin";

  const rows = useMemo(() => {
    // Hanya aktivitas administratif Akun & Organisasi (bukan SKP/rencana/realisasi).
    return logs
      .filter(l => ORG_TYPES.has(l.entityType))
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
        <div className="px-4 py-3 border-b border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.07em] text-[#6b7280]">Riwayat Aktivitas Akun &amp; Organisasi</span>
          <span className="font-mono text-[11px] text-[#9ca3af]">{rows.length} catatan</span>
        </div>

        {!isAdmin ? (
          <div className="px-4 py-14 text-center text-[#6b7280] text-sm">
            Riwayat Aktivitas hanya dapat dilihat oleh Administrator.
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-14 text-center text-[#6b7280] text-sm">Belum ada aktivitas administrasi akun &amp; organisasi.</div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {rows.map(l => {
              const emp = employees.find(e => e.id === l.entityId);
              return (
                <div key={l.id} className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ borderRadius: 9999, background: tone(l.action) }}
                  >
                    {l.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold text-[#111827]">{l.userName}</span>
                      <span className="text-[12.5px] text-[#6b7280]">{l.action}</span>
                      {emp && (
                        <span className="font-mono text-[11px] text-[#0e7490]">{emp.name.split(",")[0]}</span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[12px] tracking-wide text-[#283338]/60">{l.description}</div>
                  </div>
                  <div className="font-mono text-[11px] tracking-wide text-[#9ca3af] whitespace-nowrap shrink-0">{l.createdAt}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
