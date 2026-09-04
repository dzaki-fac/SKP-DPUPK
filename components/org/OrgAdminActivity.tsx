"use client";
import { useMemo } from "react";
import { useSKP } from "@/lib/store";

// Riwayat Aktivitas Khusus Admin: perubahan administratif Akun & Organisasi,
// diambil dari activity_logs existing (entityType employee / employee_supervisor).
// BUKAN aktivitas pekerjaan/SKP.

const ORG_TYPES = new Set(["employee", "employee_supervisor"]);

const ACTION_TONE: Record<string, string> = {
 "Menambah pegawai": "#0c0a09",
 "Menghapus pegawai": "#78716c",
 "Mengubah akun/pegawai": "#3ba6f1",
 "Menambah pimpinan": "#3ba6f1",
 "Mengubah organisasi": "#78716c",
 "Memindahkan pegawai": "#3ba6f1",
};

function tone(action: string) {
 if (action in ACTION_TONE) return ACTION_TONE[action];
 if (action.toLowerCase().includes("pimpinan")) return "#78716c";
 if (action.toLowerCase().includes("hapus")) return "#78716c";
 return "#78716c";
}

export default function OrgAdminActivity() {
 const { logs, employees, currentUser } = useSKP();
 const isAdmin = !!currentUser && currentUser.role === "admin";

 const rows = useMemo(() => {
 return logs
 .filter(l => ORG_TYPES.has(l.entityType))
 .slice()
 .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
 }, [logs]);

 return (
 <div className="space-y-4">
 <div className="bg-white border border-[#e8e6e5] rounded-[10px] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
 <div className="px-4 py-3 border-b border-[#fafaf9] flex flex-wrap items-center justify-between gap-2">
 <span className="text-[12px] uppercase tracking-[0.07em] text-[#78716c]">Riwayat Aktivitas Akun &amp; Organisasi</span>
 <span className="text-[12px] text-[#a8a29e]">{rows.length} catatan</span>
 </div>

 {!isAdmin ? (
 <div className="px-4 py-14 text-center text-[#78716c] text-[14px]">
 Riwayat Aktivitas hanya dapat dilihat oleh Administrator.
 </div>
 ) : rows.length === 0 ? (
 <div className="px-4 py-14 text-center text-[#78716c] text-[14px]">Belum ada aktivitas administrasi akun &amp; organisasi.</div>
 ) : (
 <div className="divide-y divide-[#fafaf9]">
 {rows.map(l => {
 const emp = employees.find(e => e.id === l.entityId);
 return (
 <div key={l.id} className="flex items-start gap-3 px-4 py-3">
 <div
 className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[12px] font-medium shrink-0"
 style={{ borderRadius: 9999, background: tone(l.action) }}
 >
 {l.userName.slice(0, 2).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
 <span className="text-[12px] font-semibold text-[#0c0a09]">{l.userName}</span>
 <span className="text-[12px] text-[#78716c]">{l.action}</span>
 {emp && (
 <span className="text-[12px] text-[#3ba6f1]">{emp.name.split(",")[0]}</span>
 )}
 </div>
 <div className="mt-0.5 text-[12px] tracking-wide text-[#0c0a09]/60">{l.description}</div>
 </div>
 <div className="text-[12px] tracking-wide text-[#a8a29e] whitespace-nowrap shrink-0">{l.createdAt}</div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}
