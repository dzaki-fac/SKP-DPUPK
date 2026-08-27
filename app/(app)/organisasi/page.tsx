"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrgStructure from "@/components/org/OrgStructure";
import EmployeeManager from "@/components/org/EmployeeManager";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

function OrganisasiContent() {
  const { currentUser } = useSKP();
  const isAdmin = !!currentUser && currentUser.role === "admin";
  const params = useSearchParams();
  const initialTab = isAdmin && params.get("tab") === "pegawai" ? "pegawai" : "struktur";
  const [tab, setTab] = useState<"struktur" | "pegawai">(initialTab);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-[#f7f8fb]">
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-[#6b7280]">Akun &amp; Organisasi</p>
            <h2 className="mt-2 text-[30px] sm:text-[34px] font-semibold tracking-[-0.02em] text-[#111827]">Struktur Organisasi</h2>
            <p className="mt-2 text-sm text-[#4b5563] max-w-[620px]">
              Peta hierarki jabatan dan daftar pegawai beserta akunnya — pimpinan_1 → pimpinan_2 → pimpinan_3 → staf.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4b5563]">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#9ca3af]">Role saat ini</span>
            <span className="font-medium text-[#059669]">{currentUser ? ROLE_SHORT[currentUser.role] : "—"}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-8 border-b border-[#e5e7eb]">
            <button onClick={() => setTab("struktur")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors ${tab === "struktur" ? "text-[#059669] border-[#059669]" : "text-[#6b7280] border-transparent hover:text-[#111827]"}`}>
              Struktur Organisasi
            </button>
            {isAdmin && (
              <button onClick={() => setTab("pegawai")} className={`-mb-px pb-3 pt-1 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "pegawai" ? "text-[#059669] border-[#059669]" : "text-[#6b7280] border-transparent hover:text-[#111827]"}`}>
                Pegawai
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#9ca3af]">kelola</span>
              </button>
            )}
          </div>
        </div>

        {tab === "struktur" && <OrgStructure />}
        {tab === "pegawai" && isAdmin && <EmployeeManager />}
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