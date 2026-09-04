"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrgStructure from "@/components/org/OrgStructure";
import EmployeeManager from "@/components/org/EmployeeManager";
import OrgAdminActivity from "@/components/org/OrgAdminActivity";
import SkpReport from "@/components/org/SkpReport";
import KinerjaPerOrang from "@/components/org/KinerjaPerOrang";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

function OrganisasiContent() {
 const { currentUser } = useSKP();
 const isAdmin = !!currentUser && currentUser.role === "admin";
 const params = useSearchParams();
 const rawTab = params.get("tab");
  const initialTab: "struktur"| "pegawai"| "aktivitas"| "laporan"| "kinerja"=
  rawTab === "pegawai"&& isAdmin ? "pegawai"
  : rawTab === "aktivitas"&& isAdmin ? "aktivitas"
  : rawTab === "laporan"? "laporan"
  : rawTab === "kinerja" ? "kinerja"
  : "struktur";
  const [tab, setTab] = useState<"struktur"| "pegawai"| "aktivitas"| "laporan"| "kinerja">(initialTab);

 return (
 <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-4 -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8 bg-[#fafaf9]">
 <div className="space-y-8">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div>
  <p className="eyebrow">Akun &amp; Organisasi</p>
  <h2 className="heading-sm mt-1">Struktur Organisasi</h2>
  <p className="mt-1 text-[14px] text-[#78716c] max-w-[620px]">
 Peta hierarki jabatan dan daftar pegawai beserta akunnya.
 </p>
 </div>
 <div className="flex items-center gap-2 text-[14px] text-[#78716c]">
 <span className="text-[12px] uppercase tracking-[0.06em] text-[#a8a29e]">Role saat ini</span>
 <span className="font-medium text-[#0c0a09]">{currentUser ? ROLE_SHORT[currentUser.role] : "—"}</span>
 </div>
 </div>

 <div>
 <div className="flex items-center gap-8 border-b border-[#e8e6e5] overflow-x-auto">
 <button onClick={() => setTab("struktur")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap ${tab === "struktur"? " text-[#3ba6f1] border-[#3ba6f1]": " text-[#78716c] border-transparent hover:text-[#0c0a09]"}`}>
 Struktur Organisasi
 </button>
 {isAdmin && (
 <button onClick={() => setTab("pegawai")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === "pegawai"? " text-[#3ba6f1] border-[#3ba6f1]": " text-[#78716c] border-transparent hover:text-[#0c0a09]"}`}>
 Kelola Akun
 </button>
 )}
 {isAdmin && (
 <button onClick={() => setTab("aktivitas")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === "aktivitas"? " text-[#3ba6f1] border-[#3ba6f1]": " text-[#78716c] border-transparent hover:text-[#0c0a09]"}`}>
 Riwayat Aktivitas
 </button>
 )}
  <button onClick={() => setTab("laporan")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === "laporan"? " text-[#3ba6f1] border-[#3ba6f1]": " text-[#78716c] border-transparent hover:text-[#0c0a09]"}`}>
  Laporan SKP
  </button>
  <button onClick={() => setTab("kinerja")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${tab === "kinerja"? " text-[#3ba6f1] border-[#3ba6f1]": " text-[#78716c] border-transparent hover:text-[#0c0a09]"}`}>
  Kinerja Pegawai
  </button>
  </div>
  </div>

  {tab === "struktur"&& <OrgStructure />}
  {tab === "pegawai"&& isAdmin && <EmployeeManager />}
  {tab === "aktivitas"&& isAdmin && <OrgAdminActivity />}
  {tab === "laporan"&& <SkpReport />}
  {tab === "kinerja"&& <KinerjaPerOrang />}
 </div>
 </div>
 );
}

export default function OrganisasiPage() {
 return (
 <Suspense>
 <OrganisasiContent />
 </Suspense>
 );
}