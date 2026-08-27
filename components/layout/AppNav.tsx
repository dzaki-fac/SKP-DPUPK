"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, employees, login, logout } = useSKP();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/rencana", label: "Rencana" },
    { href: "/tree", label: "Cascading" },
    { href: "/realisasi", label: "Realisasi" },
    { href: "/organisasi", label: "Organisasi" },
    { href: "/periode", label: "Periode" },
    { href: "/audit", label: "Audit" },
  ].filter(n => {
    if (!currentUser) return false;
    if (n.href === "/tree" && currentUser.role === "staf") return false;
    if (n.href === "/periode" && !["admin","pimpinan_1"].includes(currentUser.role)) return false;
    return true;
  });

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e4f0f1]">
      {/* Top bar — Gov editorial, not pill-slop */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="flex items-center h-[64px] gap-6">
          {/* Logo — refined */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-[8px] bg-[#1c5d5f] flex items-center justify-center text-white">
              {/* shield emblem */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3L4 7v6c0 4.2 2.9 8 8 9 5.1-1 8-4.8 8-9V7l-8-4z" stroke="white" strokeWidth="1.6" fill="none" />
                <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hidden sm:block leading-none">
              <div className="font-semibold text-[14px] tracking-[-0.01em] text-[#231e21]">SKP DPUPK</div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#283338]/60">Kabupaten • 2026</div>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-[#e4f0f1] ml-1" />

          {/* Nav — editorial underline, not pill fill */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navItems.map(n => {
              const active = pathname === n.href || (n.href === "/rencana" && pathname.startsWith("/rencana"));
              return (
                <Link key={n.href} href={n.href} className={`relative px-3 py-2 text-[14px] font-medium transition-colors ${active ? "text-[#1c5d5f]" : "text-[#283338]/70 hover:text-[#283338]"}`}>
                  {n.label}
                  {active && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1c5d5f] rounded-full" />}
                </Link>
              );
            })}
          </nav>

          {/* Right — user only */}
          <div className="flex items-center gap-2 ml-auto">
            {/* User — perfect circle */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowUserMenu(v => !v)} className="flex items-center gap-3 pl-1 pr-1 py-1 rounded-full hover:bg-[#f2f8f7] transition">
                <div className="text-right hidden lg:block leading-none">
                  <div className="text-[13px] font-semibold text-[#231e21]">{currentUser.name.split(",")[0]}</div>
                  <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#1c5d5f]">{roleLabel[currentUser.role]}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold shrink-0 leading-none aspect-square overflow-hidden" style={{ borderRadius: 9999 }}>{currentUser.avatar}</div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#e4f0f1] rounded-xl shadow-none overflow-hidden" style={{ borderRadius: 12 }}>
                  <div className="p-4 bg-[#f2f8f7] border-b border-[#e4f0f1]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#16325a] text-white flex items-center justify-center text-sm font-bold shrink-0 leading-none aspect-square overflow-hidden" style={{ borderRadius: 9999 }}>{currentUser.avatar}</div>
                      <div>
                        <div className="text-sm font-semibold text-[#231e21]">{currentUser.name}</div>
                        <div className="font-mono text-xs text-[#283338]/60">{currentUser.email}</div>
                        <div className="font-mono text-[11px] tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-[#1c5d5f] text-white inline-block mt-1" style={{ borderRadius: 100 }}>{currentUser.role}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 max-h-[220px] overflow-y-auto">
                    <div className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#283338]/50 px-2 py-1">Ganti peran (demo)</div>
                    {employees.map(e => (
                      <button key={e.id} onClick={async () => { await login(e.email, "password"); setShowUserMenu(false); }} className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${currentUser.id === e.id ? "bg-[#e4f0f1] border border-[#a2cbcd]" : "hover:bg-[#f2f8f7] border border-transparent"}`} style={{ borderRadius: 12 }}>
                        <span className="w-7 h-7 rounded-full bg-white border border-[#e4f0f1] flex items-center justify-center text-xs font-bold shrink-0 leading-none aspect-square overflow-hidden" style={{ borderRadius: 9999 }}>{e.avatar}</span>
                        <span className="flex-1"><span className="font-medium text-[#283338]">{e.name.split(",")[0]}</span><span className="font-mono text-xs text-[#283338]/50 ml-1">• {e.role}</span></span>
                        {currentUser.id === e.id && <span className="text-[#1c5d5f] text-xs">●</span>}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-[#e4f0f1] flex gap-2">
                    <button onClick={async () => { await logout(); router.push("/"); setShowUserMenu(false); }} className="flex-1 py-2 rounded-full bg-white border border-[#e4f0f1] text-sm font-medium text-[#283338] hover:border-[#a2cbcd]" style={{ borderRadius: 48 }}>Keluar</button>
                    <Link href="/audit" onClick={() => setShowUserMenu(false)} className="flex-1 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium text-center hover:bg-[#156152]" style={{ borderRadius: 48 }}>Audit Trail</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav — underline style */}
      <div className="lg:hidden border-t border-[#e4f0f1] bg-white">
        <nav className="flex gap-1 px-2 py-2 overflow-x-auto scrollbar-none">
          {navItems.map(n => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={`shrink-0 relative px-3 py-1.5 text-xs font-medium whitespace-nowrap ${active ? "text-[#1c5d5f]" : "text-[#283338]/60"}`}>
                {n.label}
                {active && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1c5d5f] rounded-full" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
