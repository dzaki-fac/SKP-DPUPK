"use client";
import { CascadingTree } from "@/components/ui/TreeViews";

export default function TreePage() {
 return (
 <div className="space-y-4">
 <div>
 <div className="eyebrow">CASCADING KINERJA</div>
  <h2 className="heading-sm mt-1">Alur pelimpahan rencana</h2>
 </div>
 <div className="seline-card">
  <CascadingTree />
 </div>
 </div>
 );
}
