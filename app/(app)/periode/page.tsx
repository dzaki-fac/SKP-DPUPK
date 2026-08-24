"use client";
import { useSKP } from "@/lib/store";

export default function PeriodePage() {
  const { periods, setPeriods, plans, currentUser, periodForm, setPeriodForm, notify, addLog } = useSKP();
  if (!currentUser) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><p className="eyebrow">PERIODE SKP</p><h2 className="heading-serif text-[28px]">Kelola periode</h2></div><span className="font-mono text-xs tracking-wide px-3 py-1 rounded-full bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}>skp_periods</span></div>
      <div className="grid md:grid-cols-3 gap-4">
        {periods.map(p => (
          <div key={p.id} className="p-5 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="heading-serif text-[18px]">{p.name}</div>
            <div className="font-mono text-xs tracking-wide text-[#283338]/60">{p.startDate} → {p.endDate} • {p.year}</div>
            <div className="mt-3 font-mono text-xs tracking-wide text-[#283338]/60">{plans.filter(pl => pl.skpPeriodId === p.id).length} rencana</div>
          </div>
        ))}
      </div>
      {currentUser.role === "admin" && (
        <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
          <div className="eyebrow">TAMBAH PERIODE</div>
          <div className="mt-3 grid md:grid-cols-4 gap-3">
            <input placeholder="Nama (SKP 2027)" value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd]" style={{ borderRadius: 12 }} />
            <input type="number" placeholder="Tahun" value={periodForm.year} onChange={e => setPeriodForm({ ...periodForm, year: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} />
            <input type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} />
            <input type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} className="px-3 py-2 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm" style={{ borderRadius: 12 }} />
          </div>
          <button onClick={async () => {
            if (!periodForm.name || !periodForm.startDate) { notify("Lengkapi form"); return; }
            const np = { id: "sp" + Date.now(), name: periodForm.name, year: periodForm.year, startDate: periodForm.startDate, endDate: periodForm.endDate };
            setPeriods(prev => [np, ...prev]);
            try { await fetch("/api/periods", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(np) }); } catch {}
            addLog("Membuat periode", `Membuat periode ${np.name}`, "skp_period", np.id); notify("Periode ditambahkan"); setPeriodForm({ name: "", year: 2027, startDate: "", endDate: "" });
          }} className="mt-3 px-5 py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Simpan Periode</button>
        </div>
      )}
    </div>
  );
}
