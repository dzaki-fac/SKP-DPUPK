"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT, ROLE_LABEL } from "@/lib/roles";
import type { Employee } from "@/lib/types";

const ROLE_CHIP: Record<string, string> = {
  admin: "bg-[#16325a] text-white",
  pimpinan_1: "bg-[#1c5d5f] text-white",
  pimpinan_2: "bg-[#e4f0f1] text-[#1c5d5f] border border-[#a2cbcd]",
  pimpinan_3: "bg-[#f2f8f7] text-[#1c5d5f] border border-[#d5e6e8]",
  staf: "bg-white text-[#283338] border border-[#e4f0f1]",
};

export default function OrgStructure() {
  const { employees, currentUser, isSubordinate, plans } = useSKP();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCounts, setShowCounts] = useState(true);

  const scope = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const set = new Set<string>();
    if (currentUser.role === "admin" || currentUser.role === "pimpinan_1") {
      employees.forEach(e => set.add(e.id));
    } else if (currentUser.role === "pimpinan_2" || currentUser.role === "pimpinan_3") {
      set.add(currentUser.id);
      employees.forEach(e => { if (isSubordinate(currentUser.id, e.id)) set.add(e.id); });
    } else {
      set.add(currentUser.id);
    }
    return set;
  }, [employees, currentUser, isSubordinate]);

  const inScope = (e: Employee) => scope.has(e.id);

  const childrenOf = useMemo(() => {
    const m = new Map<string, Employee[]>();
    employees.forEach(e => {
      if (e.supervisorId) {
        const arr = m.get(e.supervisorId) ?? [];
        arr.push(e);
        m.set(e.supervisorId, arr);
      }
    });
    m.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return m;
  }, [employees]);

  const roots = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin" || currentUser.role === "pimpinan_1") {
      return employees.filter(e => !e.supervisorId);
    }
    const self = employees.find(e => e.id === currentUser.id);
    return self ? [self] : [];
  }, [employees, currentUser]);

  const q = search.trim().toLowerCase();
  const matches = (e: Employee) => !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.employeeNumber.includes(q) || ROLE_LABEL[e.role].toLowerCase().includes(q) || e.role.includes(q);

  const hasMatchDescendant = (e: Employee): boolean => {
    if (matches(e)) return true;
    return (childrenOf.get(e.id) ?? []).some(hasMatchDescendant);
  };

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const planCountOf = (id: string) => plans.filter(p => p.assignedTo === id).length;

  const renderNode = (e: Employee, depth: number): React.ReactNode => {
    if (!inScope(e)) return null;
    const kids = (childrenOf.get(e.id) ?? []).filter(inScope);
    const isRootOfScope = roots.some(r => r.id === e.id);
    const hasKids = kids.length > 0;
    const open = search ? (hasMatchDescendant(e) || matches(e)) : (expanded.has(e.id) || isRootOfScope || depth === 0);
    const showKids = hasKids && open;
    const isMatchHere = matches(e);
    // ketika searching: sembunyikan node yang tidak relevan (tapi tampilkan leluhurnya)
    if (search && !isMatchHere && !hasMatchDescendant(e)) return null;

    return (
      <div key={e.id}>
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border bg-white transition-colors ${isMatchHere ? "border-[#a2cbcd] bg-[#f2f8f7]" : "border-[#e4f0f1] hover:border-[#a2cbcd]"}`}
          style={{ borderRadius: 12, marginLeft: depth * 28 }}
        >
          <button type="button" onClick={() => hasKids && toggle(e.id)} className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-xs ${hasKids ? "bg-[#e4f0f1] text-[#1c5d5f] hover:bg-[#a2cbcd]" : "text-transparent cursor-default"}`} style={{ borderRadius: 9999 }}>
            {hasKids ? (showKids ? "▾" : "▸") : "•"}
          </button>
          <div className="w-9 h-9 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ borderRadius: 9999 }}>{e.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[13px] text-[#283338]">{e.name}</span>
              {!e.isActive && <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-[#f2e8e2] text-[#b91c1c] border border-[#edd5c9]" style={{ borderRadius: 100 }}>non-aktif</span>}
            </div>
            <div className="font-mono text-[11px] text-[#283338]/50">{e.employeeNumber}</div>
          </div>
          <span className={`hidden sm:inline-block font-mono text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_CHIP[e.role] || "bg-white border border-[#e4f0f1] text-[#283338]"}`} style={{ borderRadius: 100 }}>{ROLE_SHORT[e.role]}</span>
          {depth === 0 && (e.role === "pimpinan_1" || e.role === "admin") && (
            <span className="hidden md:inline-block font-mono text-[10px] uppercase text-[#283338]/50">tertinggi</span>
          )}
          {showCounts && (
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-[#283338]/60">
              <span className="px-2 py-1 rounded-full bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 100 }}>{kids.length} bawahan</span>
              <span className="px-2 py-1 rounded-full bg-[#f2f8f7] border border-[#e4f0f1]" style={{ borderRadius: 100 }}>{planCountOf(e.id)} rencana</span>
            </div>
          )}
          <button type="button" onClick={() => setDetailId(detailId === e.id ? null : e.id)} className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#e4f0f1] text-[#1c5d5f] hover:border-[#a2cbcd]" style={{ borderRadius: 48 }}>
            {detailId === e.id ? "Tutup" : "Detail"}
          </button>
        </div>

        {detailId === e.id && (
          <div className="ml-[64px] mt-1 p-3 rounded-xl bg-[#f2f8f7] border border-[#d5e6e8] text-sm text-[#283338]/80" style={{ borderRadius: 12, marginLeft: depth * 28 + 60 }}>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
              <div><span className="text-[#283338]/50">Email</span><br />{e.email}</div>
              <div><span className="text-[#283338]/50">NIP</span><br />{e.employeeNumber}</div>
              <div><span className="text-[#283338]/50">Jabatan</span><br />{ROLE_LABEL[e.role]}</div>
              <div><span className="text-[#283338]/50">Atasan langsung</span><br />{e.supervisorId ? (employees.find(x => x.id === e.supervisorId)?.name ?? "—") : "—"}</div>
              <div><span className="text-[#283338]/50">Status</span><br />{e.isActive ? "Aktif" : "Non-aktif"}</div>
              <div><span className="text-[#283338]/50">Rencana</span><br />{planCountOf(e.id)} rencana</div>
            </div>
          </div>
        )}

        {showKids && kids.map(k => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, NIP, email, jabatan…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]"
          style={{ borderRadius: 12 }}
        />
        <button
          type="button"
          onClick={() => setShowCounts(v => !v)}
          className="px-3 py-2 rounded-full border border-[#e4f0f1] bg-white text-xs font-medium text-[#283338] hover:border-[#a2cbcd]"
          style={{ borderRadius: 48 }}
        >
          {showCounts ? "Sembunyikan penghitung" : "Tampilkan penghitung"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pimpinan_1", "pimpinan_2", "pimpinan_3", "staf", "admin"] as const).map(r => (
          <span key={r} className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#e4f0f1] text-[#283338]/70" style={{ borderRadius: 100 }}>
            {ROLE_LABEL[r]}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {roots.length === 0 && <div className="p-8 text-center border border-dashed bg-white text-[#283338]/60" style={{ borderRadius: 12, borderColor: "#a2cbcd" }}>Belum ada struktur organisasi.</div>}
        {roots.map(r => renderNode(r, 0))}

        {currentUser && currentUser.role !== "admin" && currentUser.role !== "pimpinan_1" && (
          <p className="font-mono text-[11px] text-[#283338]/50 pt-1">
            • Anda melihat subtree untuk jabatan Anda saat ini. Direktur (pimpinan_1) & administrator melihat seluruh struktur.
          </p>
        )}
      </div>
    </div>
  );
}