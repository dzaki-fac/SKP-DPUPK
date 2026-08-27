"use client";
import { CascadingTree } from "@/components/ui/TreeViews";

export default function TreePage() {
  return (
    <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="eyebrow">CASCADING KINERJA</div>
      <h2 className="heading-serif text-[28px] mt-1">Alur pelimpahan rencana</h2>
      <p className="text-sm text-[#283338]/60">Klik kartu untuk detail. Garis = hubungan induk-anak. Progress induk = realisasi langsung + capaian delegasi penerima (bisa &gt;100%).</p>
      <div className="mt-6"><CascadingTree /></div>
    </div>
  );
}
