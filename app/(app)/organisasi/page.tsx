"use client";
import { OrgTree } from "@/components/ui/TreeViews";

export default function OrganisasiPage() {
  return (
    <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="eyebrow flex items-center gap-2">STRUKTUR ORGANISASI</div>
      <h2 className="heading-serif text-[28px]">Hierarki supervisor_id</h2>
      <p className="text-sm text-[#283338]/60">Fleksibel — tidak hardcode role. Garis = atasan langsung.</p>
      <div className="mt-6"><OrgTree /></div>
      <div className="mt-6 p-4 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] font-mono text-xs leading-5 text-[#283338]/70" style={{ borderRadius: 12 }}><span className="font-semibold">Catatan:</span> supervisor_id ≠ parent_id. Yang pertama untuk struktur orang, yang kedua untuk pelimpahan rencana.</div>
    </div>
  );
}
