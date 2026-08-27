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
      const t = setTimeout(() => router.push("/"), 200);
      return () => clearTimeout(t);
    }
  }, [currentUser, authChecked, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f2f8f7] flex items-center justify-center p-8">
        <div className="text-center"><div className="eyebrow">MEMUAT...</div><p className="text-sm text-[#283338]/60 mt-2">Memeriksa sesi login</p></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f2f8f7] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="eyebrow">AUTH REQUIRED</div>
          <p className="text-sm text-[#283338]/60 mt-2">Mengalihkan ke halaman login...</p>
          <button onClick={() => router.push("/")} className="mt-4 px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm" style={{ borderRadius: 48 }}>Ke Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f8f7]">
      <AppNav />
      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-8">{children}</main>
      <GlobalModals />
      {toast && <div className="fixed bottom-4 right-4 z-50 bg-[#283338] text-white text-sm px-4 py-3 rounded-full border border-[#e4f0f1]" style={{ borderRadius: 48 }}>{toast}</div>}
      <footer className="max-w-[1200px] mx-auto px-6 py-8 text-center font-mono text-xs tracking-wide text-[#283338]/50 border-t border-[#e4f0f1]">© 2026 DPUPK Perpustakaan • Sistem SKP Digital</footer>
    </div>
  );
}
