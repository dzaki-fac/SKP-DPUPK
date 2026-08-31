"use client";
import { useMemo, useState } from "react";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT, ROLE_LABEL } from "@/lib/roles";
import type { Employee } from "@/lib/types";

// Layout org chart: P1 di atas → cabang ke P2 → turun ke P3, lalu staf
// tersusun VERTIKAL dalam satu kolom di bawah tiap P3 (tumbuh ke bawah, tidak melebar).
const COL_W = 210; // lebar satu kolom = satu P3 + staf-stafnya
const NODE_W = 186; // lebar kartu P1/P2/P3
const NODE_H = 66; // tinggi kartu pimpinan
const STAF_H = 50; // tinggi kartu staf
const PAD_X = 16; // padding kiri/kanan area tree
const PAD_Y = 16;
const ROW_H = 92; // tinggi baris p1/p2/p3
const LEVEL_GAP = 46; // jarak antar level pimpinan (tempat connector elbow)
const STAF_TOP = 28; // jarak P3 → staf pertama
const STAF_GAP = 14; // jarak antar kartu staf

const ROLE_ACCENT: Record<string, string> = {
  pimpinan_1: "#1c5d5f",
  pimpinan_2: "#2f7a7c",
  pimpinan_3: "#4b9a9c",
  staf: "#283338",
};

export default function OrgStructure() {
  const { employees, plans, getActiveSupervisors, getSupervisorHistory } = useSKP();
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Struktur TIDAK difilter berdasarkan role login: tampil penuh semua jabatan.
  // Admin tidak tampil sebagai node (di luar hierarki jabatan).
  const treeNodes = useMemo(() => employees.filter(e => e.role !== "admin"), [employees]);

  // SEMUA pimpinan AKTIF (dari tabel relasi EmployeeSupervisor), bukan hanya primary supervisorId.
  // Tiap employee dipetakan ke himpunan id pimpinan aktifnya.
  // Fallback: jika pegawai TIDAK punya relasi aktif (mis. para pimpinan/manajer di atas), gunakan
  // supervisorId yang sudah ada agar hierarki lama/manajer TETAP tampil utuh seperti sebelumnya.
  const activeSupIdOf = useMemo(() => {
    const m = new Map<string, Set<string>>();
    treeNodes.forEach(e => {
      const rel = getActiveSupervisors(e.id).map(s => s.supervisorId);
      if (rel.length) m.set(e.id, new Set(rel));
      else if (e.supervisorId) m.set(e.id, new Set([e.supervisorId]));
    });
    return m;
  }, [treeNodes, getActiveSupervisors]);

  // childrenOf: supervisorId -> daftar bawahan LANGSUNG berdasar SELURUH relasi aktif.
  // Satu staf dengan 2 pimpinan aktif muncul di bawah KEDUA pimpinan (tanpa duplikasi akun).
  const childrenOf = useMemo(() => {
    const m = new Map<string, Employee[]>();
    treeNodes.forEach(e => {
      const supIds = activeSupIdOf.get(e.id);
      if (supIds && supIds.size) {
        supIds.forEach(sid => {
          const arr = m.get(sid) ?? [];
          arr.push(e);
          m.set(sid, arr);
        });
      }
    });
    m.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return m;
  }, [treeNodes, activeSupIdOf]);

  const roots = useMemo(() => treeNodes.filter(e => !(activeSupIdOf.get(e.id)?.size)), [treeNodes, activeSupIdOf]);

  // Levels dihitung per role (tiap pegawai selalu satu tingkat di bawah pimpinan-nya),
  // sehingga p1/p2/p3 tetap stabil. Dedupe per level agar node dengan beberapa pimpinan
  // TIDAK digambar berkali-kali di dalam level yang sama (tetap satu node per kolom).
  const levels = useMemo(() => {
    const out: Employee[][] = [];
    let cur = roots;
    while (cur.length) {
      const seen = new Set<string>();
      const uniq = cur.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
      out.push(uniq);
      cur = uniq.flatMap(n => childrenOf.get(n.id) ?? []);
    }
    return out;
  }, [roots, childrenOf]);

  // Kolom ditentukan oleh level P3 (parent dari leaf/staf). Setiap P3 = 1 kolom.
  const { p1Level, p2Level, p3Level, cols } = useMemo(() => {
    const l1 = levels[0] ?? [];
    const l2 = levels[1] ?? [];
    const l3 = levels[2] ?? [];
    return { p1Level: l1, p2Level: l2, p3Level: l3, cols: l3.length };
  }, [levels]);

  const colOf = useMemo(() => {
    const m = new Map<string, number>();
    p3Level.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [p3Level]);

  // span [minCol,maxCol] untuk node (p3=1 kolom; p2/p1 = gabungan kolom anak P3).
  const spanOf = useMemo(() => {
    const cache = new Map<string, [number, number]>();
    const build = (n: Employee): [number, number] => {
      if (cache.has(n.id)) return cache.get(n.id)!;
      const c = colOf.get(n.id);
      if (c !== undefined) { cache.set(n.id, [c, c]); return [c, c]; }
      const kids = childrenOf.get(n.id) ?? [];
      if (kids.length) {
        let min = Infinity, max = -Infinity;
        kids.forEach(k => { const [a, b] = build(k); min = Math.min(min, a); max = Math.max(max, b); });
        const r: [number, number] = [min, max];
        cache.set(n.id, r);
        return r;
      }
      const r: [number, number] = [0, 0];
      cache.set(n.id, r);
      return r;
    };
    treeNodes.forEach(build);
    return (id: string) => cache.get(id) ?? [0, 0];
  }, [colOf, childrenOf, treeNodes]);

  const colCenter = (col: number) => PAD_X + col * COL_W + COL_W / 2;
  const centerOfSpan = (a: number, b: number) => PAD_X + ((a + b) / 2) * COL_W + COL_W / 2;
  const cardCenter = (id: string) => { const [a, b] = spanOf(id); return centerOfSpan(a, b); };
  const rowTop = (i: number) => i * (ROW_H + LEVEL_GAP);
  const rowBottom = (i: number) => rowTop(i) + ROW_H;

  const totalW = PAD_X * 2 + Math.max(cols, 1) * COL_W;

  const stafTop = () => rowBottom(2) + STAF_TOP;
  const stafY = (idx: number) => stafTop() + idx * (STAF_H + STAF_GAP);

  const maxStafBottom = useMemo(() => {
    let bottom = rowBottom(2);
    p3Level.forEach(p3 => {
      const kids = childrenOf.get(p3.id) ?? [];
      if (kids.length) bottom = Math.max(bottom, stafTop() + (kids.length - 1) * (STAF_H + STAF_GAP) + STAF_H);
    });
    return bottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p3Level, childrenOf]);

  const totalH = maxStafBottom + PAD_Y;

  const connectorPath = useMemo(() => {
    let d = "";
    // Elbow P1→P2 dan P2→P3
    const elbow = (parentId: string, childIds: string[], fromLevel: number) => {
      if (!childIds.length) return;
      const px = cardCenter(parentId);
      const py = rowBottom(fromLevel);
      const hy = py + LEVEL_GAP / 2;
      const xs = childIds.map(c => cardCenter(c));
      const first = Math.min(...xs), last = Math.max(...xs);
      const childTop = rowTop(fromLevel + 1);
      d += `M ${px} ${py} V ${hy} L ${last} ${hy} H ${first}`;
      xs.forEach(x => { d += ` M ${x} ${childTop} V ${hy}`; });
    };
    p1Level.forEach(p1 => elbow(p1.id, (childrenOf.get(p1.id) ?? []).map(k => k.id), 0));
    p2Level.forEach(p2 => elbow(p2.id, (childrenOf.get(p2.id) ?? []).map(k => k.id), 1));
    // Rel staf vertikal di bawah tiap P3 (drop + rel + stub ke tiap kartu)
    p3Level.forEach(p3 => {
      const kids = childrenOf.get(p3.id) ?? [];
      if (!kids.length) return;
      const scol = colCenter(colOf.get(p3.id)!);
      const cardL = scol - NODE_W / 2;
      const railX = cardL - 14;
      const hubY = stafTop() - 10;
      const ycs = kids.map((_, i) => stafY(i) + STAF_H / 2);
      d += `M ${scol} ${rowBottom(2)} V ${hubY} H ${railX}`;
      d += ` V ${ycs[ycs.length - 1]}`;
      ycs.forEach(y => { d += ` M ${railX} ${y} H ${cardL}`; });
    });
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1Level, p2Level, p3Level, childrenOf, cols]);

  const counts = useMemo(() => {
    const c = { pimpinan_1: 0, pimpinan_2: 0, pimpinan_3: 0, staf: 0 };
    // Hitung ORANG UNIK per NIP: satu orang = satu NIP; relasi pimpinan berganda
    // TIDAK menambah jumlah orang.
    const seenNip = new Set<string>();
    treeNodes.forEach(e => {
      const key = e.employeeNumber || e.id;
      if (seenNip.has(key)) return;
      seenNip.add(key);
      if (e.role in c) (c as Record<string, number>)[e.role]++;
    });
    return c;
  }, [treeNodes]);

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    treeNodes.forEach(e => { const k = e.employeeNumber || e.id; if (!seen.has(k)) seen.add(k); });
    return seen.size;
  }, [treeNodes]);

  const q = search.trim().toLowerCase();
  const matches = (e: Employee) => !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.employeeNumber.includes(q) || ROLE_LABEL[e.role].toLowerCase().includes(q) || e.role.includes(q);
  const hasMatchDescendant = (e: Employee): boolean => {
    if (matches(e)) return true;
    return (childrenOf.get(e.id) ?? []).some(hasMatchDescendant);
  };
  const dimNode = (e: Employee) => (q && !matches(e) && !hasMatchDescendant(e));

  const planCountOf = (id: string) => plans.filter(p => p.assignedTo === id).length;
  const detailEmp = detailId ? treeNodes.find(e => e.id === detailId) : null;

  const nodeCard = (n: Employee, x: number, y: number, w: number, h: number, staf = false, itemKey = n.id) => (
    <div
      key={itemKey}
      className={`absolute bg-white border rounded-[10px] cursor-pointer transition-all ${dimNode(n) ? "opacity-30" : "hover:border-[#0e7490] hover:shadow-sm"} ${detailId === n.id ? "border-[#0e7490] ring-1 ring-[#0e7490]/20" : "border-[#e5e7eb] shadow-[0_1px_2px_rgba(17,24,39,0.04)]"}`}
      style={{ left: x, top: y, width: w, height: h, boxSizing: "border-box", padding: staf ? "6px 10px" : "8px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}
      onClick={() => setDetailId(n.id)}
      title={n.name}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`${staf ? "w-6 h-6" : "w-8 h-8"} rounded-full text-white flex items-center justify-center font-semibold leading-none shrink-0`} style={{ borderRadius: 9999, background: ROLE_ACCENT[n.role] || "#1c5d5f", fontSize: staf ? 9 : 11 }}>{n.avatar}</div>
        <div className="min-w-0 flex-1">
          <div className={`${staf ? "text-[12px]" : "text-[13px]"} font-semibold text-[#1f2937] truncate`}>{n.name}</div>
          <div className="font-mono text-[10px] text-[#9ca3af] truncate">{n.employeeNumber || "Tanpa NIP"}</div>
        </div>
      </div>
      {!staf && (
        <div className="mt-1.5 flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-medium bg-[#e0f2fe] text-[#0c4a6e] border border-[#bae6fd] shrink-0">{ROLE_SHORT[n.role]}</span>
          {(childrenOf.get(n.id)?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#6b7280] shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {childrenOf.get(n.id)!.length} bawahan
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderDetail = () => {
    const e = detailEmp;
    if (!e) return null;
    const sup = e.supervisorId ? treeNodes.find(x => x.id === e.supervisorId) : null;
    const kids = childrenOf.get(e.id) ?? [];
    const activeSps = getActiveSupervisors(e.id).map(s => treeNodes.find(x => x.id === s.supervisorId)).filter(Boolean);
    const historySps = getSupervisorHistory(e.id)
      .map(h => ({ rel: h, sup: treeNodes.find(x => x.id === h.supervisorId) }))
      .filter(h => h.sup);
    const supervisorsLabel = activeSps.length
      ? activeSps.map(s => (s as Employee).name).join(", ")
      : (sup ? sup.name : "—");
    const rows: Array<{ label: string; value: string }> = [
      { label: "NIP", value: e.employeeNumber || "—" },
      { label: "Email", value: e.email },
      { label: "Jabatan", value: ROLE_LABEL[e.role] },
      { label: "Pimpinan aktif", value: supervisorsLabel },
      { label: "Bawahan langsung", value: kids.length ? kids.map(k => k.name).join(", ") : "Tidak ada" },
      { label: "Rencana aktif", value: `${planCountOf(e.id)} rencana` },
    ];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetailId(null)}>
        <div className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg" onClick={e2 => e2.stopPropagation()}>
          <div className="px-6 py-5 flex items-center justify-between border-b border-[#f1f5f9]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-sm font-semibold leading-none shrink-0" style={{ borderRadius: 9999, background: ROLE_ACCENT[e.role] || "#1c5d5f" }}>{e.avatar}</div>
              <div>
                <div className="font-semibold text-[15px] text-[#1f2937]">{e.name}</div>
                <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#0e7490]">{ROLE_SHORT[e.role]}</div>
              </div>
            </div>
            <button type="button" onClick={() => setDetailId(null)} className="w-8 h-8 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#0e7490] hover:text-[#111827]" style={{ borderRadius: 9999 }}>✕</button>
          </div>
          <div className="px-6 py-5 space-y-4">
            {rows.map(r => (
              <div key={r.label}>
                <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#9ca3af]">{r.label}</div>
                <div className="mt-1 text-[14px] text-[#1f2937]">{r.value}</div>
              </div>
            ))}
            {historySps.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#9ca3af]">Riwayat pimpinan</div>
                <ul className="mt-1 space-y-0.5">
                  {historySps.map(h => (
                    <li key={h.rel.id} className="text-[13px] text-[#1f2937]">
                      {(h.sup as Employee).name}
                      <span className="font-mono text-[11px] text-[#9ca3af]"> — {h.rel.startDate} → {h.rel.endDate}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_220px] gap-5 items-start">
        {/* Area tree */}
        <div className="min-w-0 bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="px-4 py-3 border-b border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.07em] text-[#6b7280]">Peta Hierarki Jabatan</span>
            <div className="flex items-center">
              <div className="relative w-full sm:w-auto">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama, NIP, email, jabatan"
                  className="w-[230px] pl-7 pr-3 py-1 rounded-md border border-[#e5e7eb] bg-white text-[12.5px] text-[#1f2937] focus:outline-none focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490]/20 placeholder:text-[#9ca3af]"
                />
              </div>
            </div>
          </div>

          {roots.length === 0 ? (
            <div className="px-4 py-14 text-center text-[#6b7280] text-sm">Belum ada struktur organisasi.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="relative" style={{ width: totalW, height: totalH }}>
                <svg className="absolute inset-0" width={totalW} height={totalH} fill="none">
                  <path d={connectorPath} stroke="#94a3b8" strokeWidth={1.4} />
                </svg>

                {/* P1 */}
                {p1Level.map(n => nodeCard(n, cardCenter(n.id) - NODE_W / 2, rowTop(0) + (ROW_H - NODE_H) / 2, NODE_W, NODE_H))}
                {/* P2 */}
                {p2Level.map(n => nodeCard(n, cardCenter(n.id) - NODE_W / 2, rowTop(1) + (ROW_H - NODE_H) / 2, NODE_W, NODE_H))}
                {/* P3 */}
                {p3Level.map(n => nodeCard(n, cardCenter(n.id) - NODE_W / 2, rowTop(2) + (ROW_H - NODE_H) / 2, NODE_W, NODE_H))}
                {/* Staf (vertikal di bawah tiap P3) — key unik per (p3,staf) agar satu staf
                    dengan beberapa pimpinan aktif dapat tampil di beberapa kolom tanpa bentrok. */}
                {p3Level.map(p3 =>
                  (childrenOf.get(p3.id) ?? []).map((s, i) => nodeCard(s, colCenter(colOf.get(p3.id)!) - NODE_W / 2, stafY(i), NODE_W, STAF_H, true, `${p3.id}-${s.id}`))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel info samping */}
        <aside className="bg-white border border-[#e5e7eb] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.07em] text-[#6b7280]">Informasi Struktur</div>
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Pimpinan 1 (Direktur)", v: counts.pimpinan_1 },
              { label: "Pimpinan 2", v: counts.pimpinan_2 },
              { label: "Pimpinan 3", v: counts.pimpinan_3 },
              { label: "Staf", v: counts.staf },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[#f1f5f9] last:border-0">
                <span className="text-[12.5px] text-[#6b7280]">{row.label}</span>
                <span className="font-mono text-[14px] font-semibold text-[#1f2937]">{row.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-[#1f2937]">Total Pegawai</span>
            <span className="font-mono text-[16px] font-bold text-[#0f172a]">{uniquePeople}</span>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#e0f7f4] px-3 py-2.5">
            <svg className="mt-0.5 shrink-0 text-[#0e7490]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <p className="text-[11.5px] leading-relaxed text-[#0c5a6e]">
              Struktur dapat dilihat seluruh role namun hak kelola akun dibatasi sesuai kewenangan jabatan masing-masing.
            </p>
          </div>
        </aside>
      </div>

      {renderDetail()}
    </div>
  );
}