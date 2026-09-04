"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSKP } from "@/lib/store";
import { AppNav } from "@/components/layout/AppNav";
import { GlobalModals } from "@/components/ui/Modals";

export default function AppLayout({ children }: { children: React.ReactNode }) {
 const { currentUser, authChecked, toast } = useSKP();
 const router = useRouter();

 useEffect(() => {
  if (authChecked && currentUser === null) {
  const t = setTimeout(() => router.push("/login"), 200);
  return () => clearTimeout(t);
  }
 }, [currentUser, authChecked, router]);

 if (!authChecked) {
 return (
 <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-8">
 <div className="text-center"><div className="eyebrow">MEMUAT...</div><p className="text-[14px] text-[#78716c] mt-2">Memeriksa sesi login</p></div>
 </div>
 );
 }

 if (!currentUser) {
 return (
 <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-8">
 <div className="text-center">
 <div className="eyebrow">AUTH REQUIRED</div>
 <p className="text-[14px] text-[#78716c] mt-2">Mengalihkan ke halaman login...</p>
  <button onClick={() => router.push("/login")} className="mt-4 px-5 py-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white text-[14px] font-medium" style={{ borderRadius: 9999 }}>Ke Login</button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[#fafaf9]">
 <AppNav />
 <main className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-8">{children}</main>
 <GlobalModals />
 {toast && <div className="fixed bottom-4 right-4 z-50 bg-[#1c1917] text-white text-[14px] px-4 py-2 rounded-full border border-[#e8e6e5]" style={{ borderRadius: 9999 }}>{toast}</div>}
 <footer className="max-w-[1200px] mx-auto px-6 py-8 text-center text-[12px] tracking-[0.06em] uppercase text-[#a8a29e] border-t border-[#e8e6e5]">© 2026 DPUPK Perpustakaan • Sistem SKP Digital</footer>
 </div>
 );
}
