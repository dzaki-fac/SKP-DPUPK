"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT, ROLE_LABEL } from "@/lib/roles";
import type { Employee } from "@/lib/types";

const ROLE_TEXT: Record<string, string> = {
  admin: "text-[#16325a]",
  pimpinan_1: "text-[#1c5d5f]",
  pimpinan_2: "text-[#1c5d5f]",
  pimpinan_3: "text-[#1c5d5f]",
  staf: "text-[#283338]/70",
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

  const detailEmp = detailId ? employees.find(e => e.id === detailId) : null;
  const renderDetail = (e: Employee) => {
    if (!currentUser) return null;
    if (!detailEmp || detailEmp.id !== e.id) return null;
    const sup = e.supervisorId ? employees.find(x => x.id === e.supervisorId) : null;
    const rows: Array<{ label: string; value: string }> = [
      { label: "NIP", value: e.employeeNumber || "—" },
      { label: "Email", value: e.email },
      { label: "Jabatan", value: ROLE_LABEL[e.role] },
      { label: "Atasan langsung", value: sup ? sup.name : "—" },
      { label: "Status", value: e.isActive ? "Aktif" : "Non-aktif" },
      { label: "Rencana aktif", value: `${planCountOf(e.id)} rencana` },
    ];
    return (
      <div className="fixed inset-0 z-50 bg-[#0e4749]/30" onClick={() => setDetailId(null)}>
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white border-l border-[#e4f0f1] overflow-y-auto" onClick={e2 => e2.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-[#e4f0f1] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-sm font-bold leading-none shrink-0" style={{ borderRadius: 9999 }}>{e.avatar}</div>
              <div>
                <div className="font-medium text-[15px] text-[#283338]">{e.name}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#1c5d5f]">{ROLE_SHORT[e.role]}</div>
              </div>
            </div>
            <button type="button" onClick={() => setDetailId(null)} className="w-8 h-8 rounded-full border border-[#e4f0f1] text-[#283338]/60 hover:border-[#a2cbcd] hover:text-[#283338]" style={{ borderRadius: 9999 }}>✕</button>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-4">
              {rows.map(r => (
                <div key={r.label}>
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">{r.label}</div>
                  <div className="mt-1 text-[14px] text-[#283338]">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-[#e4f0f1]">
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">Lingkup</div>
              <p className="mt-1 text-[13px] text-[#283338]/70">
                {currentUser.role === "pimpinan_1" || currentUser.role === "admin"
                  ? "Terlihat dalam struktur organisasi secara penuh."
                  : "Terlihat dalam subtree jabatan Anda."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNode = (e: Employee, depth: number): React.ReactNode => {
    if (!inScope(e)) return null;
    const kids = (childrenOf.get(e.id) ?? []).filter(inScope);
    const isRootOfScope = roots.some(r => r.id === e.id);
    const hasKids = kids.length > 0;
    const open = search ? (hasMatchDescendant(e) || matches(e)) : (expanded.has(e.id) || isRootOfScope || depth === 0);
    const showKids = hasKids && open;
    const isMatchHere = matches(e);
    if (search && !isMatchHere && !hasMatchDescendant(e)) return null;

    return (
      <div key={e.id}>
        <div
          className={`flex items-center gap-3 py-2.5 pr-3 group transition-colors ${depth === 0 ? "border-b border-[#d5e6e8]" : ""} ${isMatchHere ? "bg-[#f2f8f7]" : "hover:bg-[#f2f8f7]/60"}`}
          style={{ paddingLeft: depth * 24 + 4 }}
        >
          {hasKids ? (
            <button
              type="button"
              onClick={() => toggle(e.id)}
              aria-label={showKids ? "Ciutkan" : "Bentangkan"}
              className="w-4 shrink-0 text-center text-[12px] text-[#1c5d5f] hover:text-[#0e4749] select-none"
            >
              {showKids ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-4 shrink-0 text-center text-[12px] text-[#a2cbcd] select-none" aria-hidden>·</span>
          )}
          <div className="w-8 h-8 rounded-full bg-[#1c5d5f] text-white flex items-center justify-center text-[11px] font-bold shrink-0 leading-none" style={{ borderRadius: 9999 }}>{e.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[14px] ${depth === 0 ? "font-semibold text-[#283338]" : "font-medium text-[#283338]"}`}>{e.name}</span>
              {!e.isActive && <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#b91c1c]">non-aktif</span>}
            </div>
            <div className="font-mono text-[11px] text-[#283338]/50">{e.employeeNumber || "Tanpa NIP"}</div>
          </div>
          <span className={`hidden sm:inline font-mono text-[12px] whitespace-nowrap ${ROLE_TEXT[e.role] || "text-[#283338]/70"}`}>{ROLE_SHORT[e.role]}</span>
          {showCounts && (
            <span className="hidden md:inline font-mono text-[11px] text-[#283338]/45 whitespace-nowrap">
              {kids.length > 0 && `${kids.length} bawahan`}
              {kids.length > 0 && " · "}
              {planCountOf(e.id)} rencana
            </span>
          )}
          <button
            type="button"
            onClick={() => setDetailId(detailId === e.id ? null : e.id)}
            className="shrink-0 px-3 py-1 rounded-md border border-[#e4f0f1] text-[12px] font-medium text-[#1c5d5f] hover:border-[#a2cbcd] hover:bg-[#f2f8f7]"
          >
            Detail
          </button>
        </div>

        {renderDetail(e)}

        {showKids && kids.map(k => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#283338]/40 text-[14px]" aria-hidden>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, email, atau jabatan"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-[#e4f0f1] bg-white text-sm focus:outline-none focus:border-[#a2cbcd]"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCounts(v => !v)}
          className="px-3 py-2 rounded-md border border-[#e4f0f1] bg-white text-xs font-medium text-[#283338]/70 hover:border-[#a2cbcd] hover:text-[#283338]"
        >
          {showCounts ? "Sembunyikan rincian" : "Tampilkan rincian"}
        </button>
      </div>

      <div>
        <div className="border border-[#e4f0f1] bg-white">
          <div className="px-4 py-3 border-b border-[#e4f0f1] flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#283338]/50">Struktur organisasi</span>
            <span className="font-mono text-[11px] text-[#283338]/45">{scope.size} node</span>
          </div>
          {roots.length === 0 && (
            <div className="px-4 py-12 text-center text-[#283338]/60 text-sm">Belum ada struktur organisasi.</div>
          )}
          <div className="px-2 py-2">
            {roots.map(r => renderNode(r, 0))}
          </div>
        </div>

        {currentUser && currentUser.role !== "admin" && currentUser.role !== "pimpinan_1" && (
          <p className="font-mono text-[11px] text-[#283338]/50 pt-3">
            • Anda melihat subtree untuk jabatan Anda saat ini. Direktur (pimpinan_1) & administrator melihat seluruh struktur.
          </p>
        )}
      </div>
    </div>
  );
}
