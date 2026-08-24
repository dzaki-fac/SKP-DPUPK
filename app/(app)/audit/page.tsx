"use client";
import { useSKP } from "@/lib/store";

export default function AuditPage() {
  const { logs } = useSKP();
  return (
    <div className="p-6 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
      <div className="eyebrow flex items-center gap-2">AUDIT TRAIL</div>
      <h2 className="heading-serif text-[28px] mt-1">activity_logs</h2>
      <div className="mt-4 space-y-2">
        {logs.map(l => (
          <div key={l.id} className="flex gap-3 p-3 rounded-xl bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 12 }}>
            <div className="w-8 h-8 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold shrink-0">{l.userName.slice(0, 2).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><div className="text-sm"><span className="font-semibold">{l.userName}</span> <span className="text-[#283338]/70">{l.action}</span></div><div className="font-mono text-xs tracking-wide text-[#283338]/60">{l.description} • {l.entityType}#{l.entityId}</div></div>
            <div className="font-mono text-xs tracking-wide text-[#283338]/50 shrink-0">{l.createdAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
