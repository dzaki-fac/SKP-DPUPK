"use client";
import { useState } from "react";
import OrgStructure from "@/components/org/OrgStructure";
import EmployeeManager from "@/components/org/EmployeeManager";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

export default function OrganisasiPage() {
  const { currentUser } = useSKP();
  const isAdmin = currentUser?.role === "admin";
  const [tab, setTab] = useState<"struktur" | "pegawai">("struktur");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow">AKUN & ORGANISASI</p>
          <h2 className="heading-serif text-[28px]">Struktur organisasi</h2>
          <p className="text-sm text-[#283338]/60 mt-1">
            Hierarki berbasis jabatan (pimpinan_1 → pimpinan_2 → pimpinan_3 → staf) dengan akses sesuai subtree.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#e4f0f1] px-3 py-2 rounded-xl" style={{ borderRadius: 12 }}>
          <span className="font-mono text-[11px] uppercase text-[#283338]/50">Role saat ini</span>
          <span className="font-mono text-xs font-semibold text-[#1c5d5f]">{currentUser ? ROLE_SHORT[currentUser.role] : "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#e4f0f1]">
        <button onClick={() => setTab("struktur")} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "struktur" ? "text-[#1c5d5f] border-[#1c5d5f]" : "text-[#283338]/60 border-transparent hover:text-[#283338]"}`}>
          Struktur Jabatan
        </button>
        <button onClick={() => setTab("pegawai")} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "pegawai" ? "text-[#1c5d5f] border-[#1c5d5f]" : "text-[#283338]/60 border-transparent hover:text-[#283338]"}`}>
          Kelola Pegawai {isAdmin && <span className="font-mono text-[10px] uppercase text-[#b45309] ml-1">admin</span>}
        </button>
      </div>

      {tab === "struktur" && <OrgStructure />}
      {tab === "pegawai" && <EmployeeManager />}
    </div>
  );
}