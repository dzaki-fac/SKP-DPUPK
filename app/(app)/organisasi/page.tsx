"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrgStructure from "@/components/org/OrgStructure";
import EmployeeManager from "@/components/org/EmployeeManager";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

function OrganisasiContent() {
  const { currentUser } = useSKP();
  const isAdmin = currentUser?.role === "admin";
  const params = useSearchParams();
  const initialTab = params.get("tab") === "pegawai" ? "pegawai" : "struktur";
  const [tab, setTab] = useState<"struktur" | "pegawai">(initialTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#1c5d5f]">AKUN & ORGANISASI</p>
          <h2 className="heading-serif text-[30px] mt-1">Organisasi</h2>
          <p className="text-sm text-[#283338]/60 mt-2 max-w-[560px]">
            Struktur kepengurusan berbasis jabatan (pimpinan_1 → pimpinan_2 → pimpinan_3 → staf) dan daftar pegawai beserta akunnya.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#283338]/70">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">Role saat ini</span>
          <span className="font-medium text-[#1c5d5f]">{currentUser ? ROLE_SHORT[currentUser.role] : "—"}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-8 border-b border-[#e4f0f1]">
          <button onClick={() => setTab("struktur")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 ${tab === "struktur" ? "text-[#1c5d5f] border-[#1c5d5f]" : "text-[#283338]/55 border-transparent hover:text-[#283338]"}`}>
            Struktur Organisasi
          </button>
          <button onClick={() => setTab("pegawai")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 flex items-center gap-2 ${tab === "pegawai" ? "text-[#1c5d5f] border-[#1c5d5f]" : "text-[#283338]/55 border-transparent hover:text-[#283338]"}`}>
            Pegawai
            {isAdmin && <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#283338]/50">kelola</span>}
          </button>
        </div>
      </div>

      {tab === "struktur" && <OrgStructure />}
      {tab === "pegawai" && <EmployeeManager />}
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