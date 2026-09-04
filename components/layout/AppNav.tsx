"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSKP } from "@/lib/store";
import { roleLabel } from "@/lib/data";

export function AppNav() {
 const pathname = usePathname();
 const router = useRouter();
 const { currentUser, logout } = useSKP();
 const [showUserMenu, setShowUserMenu] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false); };
 document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
 }, []);

 const navItems = [
 { href: "/dashboard", label: "Dashboard"},
 { href: "/rencana", label: "Rencana"},
 { href: "/tree", label: "Cascading"},
 { href: "/realisasi", label: "Realisasi"},
 { href: "/organisasi", label: "Organisasi"},
 { href: "/periode", label: "Periode"},
 { href: "/audit", label: "Audit"},
 ].filter(n => {
 if (!currentUser) return false;
 if (n.href === "/tree"&& currentUser.role === "staf") return false;
 if (n.href === "/periode"&& !["admin","pimpinan_1"].includes(currentUser.role)) return false;
 return true;
 });

 if (!currentUser) return null;

 return (
 <header className="sticky top-0 z-30 bg-white border-b border-[#e8e6e5] backdrop-blur">
 <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
 <div className="flex items-center h-[56px] gap-6">
 {/* Logo wordmark — Seline compact */}
  <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
  <span className="w-[32px] h-[32px] rounded-[8px] bg-[#0c0a09] flex items-center justify-center">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
  <path d="M18 6.00002V6.75002H18.75V6.00002H18ZM15.7172 2.32614L15.6111 1.58368L15.7172 2.32614ZM4.91959 3.86865L4.81353 3.12619H4.81353L4.91959 3.86865ZM5.07107 6.75002H18V5.25002H5.07107V6.75002ZM18.75 6.00002V4.30604H17.25V6.00002H18.75ZM15.6111 1.58368L4.81353 3.12619L5.02566 4.61111L15.8232 3.0686L15.6111 1.58368ZM4.81353 3.12619C3.91638 3.25435 3.25 4.0227 3.25 4.92895H4.75C4.75 4.76917 4.86749 4.63371 5.02566 4.61111L4.81353 3.12619ZM18.75 4.30604C18.75 2.63253 17.2678 1.34701 15.6111 1.58368L15.8232 3.0686C16.5763 2.96103 17.25 3.54535 17.25 4.30604H18.75ZM5.07107 5.25002C4.89375 5.25002 4.75 5.10627 4.75 4.92895H3.25C3.25 5.9347 4.06532 6.75002 5.07107 6.75002V5.25002Z" fill="white"/>
  <path d="M8 12H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M8 15.5H13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M4 6V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V14M4 6V5M4 6H17C18.6569 6 20 7.34315 20 9V10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  </span>
 <span className="hidden sm:block leading-none">
 <span className="font-medium text-[14px] tracking-[-0.015em] text-[#0c0a09]" style={{ fontFamily: "var(--font-inter)"}}>SKP DPUPK</span>
 </span>
 </Link>

 <span className="hidden lg:block w-px h-6 bg-[#e8e6e5] ml-1"/>

 {/* Nav — Seline Navigation Link: 14px Inter 400, #78716c, 32px height, hover #0c0a09, active cyan underline? Use pill for active */}
 <nav className="hidden lg:flex items-center gap-1 flex-1">
 {navItems.map(n => {
 const active = pathname === n.href || (n.href === "/rencana"&& pathname.startsWith("/rencana"));
 return (
 <Link key={n.href} href={n.href} className={`h-[32px] px-3 inline-flex items-center text-[14px] transition-colors ${active ? " text-[#0c0a09] font-medium": " text-[#78716c] font-normal hover:text-[#0c0a09]"}`}>
 {n.label}
 {active && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#3ba6f1]"/>}
 </Link>
 );
 })}
 </nav>

 {/* Right */}
 <div className="flex items-center gap-2 ml-auto">
 <div className="relative" ref={menuRef}>
 <button onClick={() => setShowUserMenu(v => !v)} className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-transparent hover:bg-[#fafaf9] hover:border-[#e8e6e5] transition">
 <span className="hidden lg:block text-right leading-none">
 <span className="block text-[12px] font-medium text-[#0c0a09] leading-none">{currentUser.name.split(",")[0]}</span>
 <span className="block mt-1 text-[10px] tracking-[0.06em] uppercase text-[#3ba6f1] font-semibold leading-none">{roleLabel[currentUser.role]}</span>
 </span>
 <span className="w-8 h-8 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[12px] font-medium shrink-0" style={{ borderRadius: 9999 }}>{currentUser.avatar}</span>
 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#a8a29e] hidden lg:block"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
 </button>

 {showUserMenu && (
 <div className="absolute right-0 top-full mt-2 w-[300px] bg-white border border-[#e8e6e5] rounded-[10px] overflow-hidden z-40" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px"}}>
 <div className="p-4 bg-[#fafaf9] border-b border-[#e8e6e5]">
 <div className="flex items-center gap-3">
 <span className="w-9 h-9 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[14px] font-medium shrink-0" style={{ borderRadius: 9999 }}>{currentUser.avatar}</span>
 <div>
 <div className="text-[14px] font-medium text-[#0c0a09]">{currentUser.name.split(",")[0]}</div>
 <div className="text-[12px] text-[#78716c]">{currentUser.email}</div>
 <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white text-[10px] font-semibold tracking-[0.04em] uppercase" style={{ borderRadius: 9999 }}>{roleLabel[currentUser.role]}</span>
 </div>
 </div>
 </div>
 <div className="p-2 border-t border-[#e8e6e5]">
  <button onClick={async () => { await logout(); router.push("/login"); setShowUserMenu(false); }} className="w-full py-2 rounded-full bg-white border border-[#e8e6e5] text-[14px] text-[#0c0a09] hover:bg-[#fafaf9]" style={{ borderRadius: 9999 }}>Keluar</button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Mobile nav — Seline horizontal pill scroll */}
 <div className="lg:hidden border-t border-[#e8e6e5] bg-white">
 <nav className="flex gap-1 px-2 py-2 overflow-x-auto">
 {navItems.map(n => {
 const active = pathname === n.href || (n.href === "/rencana"&& pathname.startsWith("/rencana"));
 return (
 <Link key={n.href} href={n.href} className={`shrink-0 px-3 py-1.5 text-[12px] font-medium whitespace-nowrap rounded-full ${active ? " bg-[#0c0a09] text-white": " text-[#78716c] border border-[#e8e6e5] bg-[#fafaf9]"}`} style={{ borderRadius: 9999 }}>
 {n.label}
 </Link>
 );
 })}
 </nav>
 </div>
 </header>
 );
}
