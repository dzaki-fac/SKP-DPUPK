"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSKP } from "@/lib/store";

export default function LoginPage() {
 const { currentUser, login } = useSKP();
 const router = useRouter();
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [err, setErr] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (currentUser) {
 const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
 router.push(next || "/dashboard");
 }
 }, [currentUser, router]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email || !password) { setErr("Email dan password wajib diisi"); return; }
 setErr(null); setLoading(true);
 const res = await login(email, password);
 setLoading(false);
 if (res.ok) {
 const next = new URLSearchParams(window.location.search).get("next");
 router.push(next || "/dashboard");
 }
 else setErr(res.error || "Email atau password salah");
 };

 return (
 <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
 <div className="w-full max-w-[380px]">
 <div className="text-center mb-6">
 <Link href="/" className="inline-flex items-center gap-2">
 <div className="w-8 h-8 rounded-[8px] bg-[#0c0a09] flex items-center justify-center">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
 <path d="M18 6.00002V6.75002H18.75V6.00002H18ZM15.7172 2.32614L15.6111 1.58368L15.7172 2.32614ZM4.91959 3.86865L4.81353 3.12619H4.81353L4.91959 3.86865ZM5.07107 6.75002H18V5.25002H5.07107V6.75002ZM18.75 6.00002V4.30604H17.25V6.00002H18.75ZM15.6111 1.58368L4.81353 3.12619L5.02566 4.61111L15.8232 3.0686L15.6111 1.58368ZM4.81353 3.12619C3.91638 3.25435 3.25 4.0227 3.25 4.92895H4.75C4.75 4.76917 4.86749 4.63371 5.02566 4.61111L4.81353 3.12619ZM18.75 4.30604C18.75 2.63253 17.2678 1.34701 15.6111 1.58368L15.8232 3.0686C16.5763 2.96103 17.25 3.54535 17.25 4.30604H18.75ZM5.07107 5.25002C4.89375 5.25002 4.75 5.10627 4.75 4.92895H3.25C3.25 5.9347 4.06532 6.75002 5.07107 6.75002V5.25002Z" fill="white"/>
 <path d="M8 12H16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 <path d="M8 15.5H13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 <path d="M4 6V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V14M4 6V5M4 6H17C18.6569 6 20 7.34315 20 9V10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
 </svg>
 </div>
 <span className="font-medium text-[14px] tracking-[-0.015em] text-[#0c0a09]" style={{ fontFamily: "var(--font-inter)" }}>SKP DPUPK</span>
 </Link>
 <h1 className="mt-4 text-[22px] font-normal leading-tight text-[#0c0a09]" style={{ fontFamily: "var(--font-roobert)" }}>Masuk ke SKP</h1>
 <p className="mt-1 text-[13px] text-[#78716c]">Gunakan email dan password Anda</p>
 </div>

 <div className="seline-card !p-6">
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="text-[11px] font-medium tracking-[0.04em] uppercase text-[#78716c]">Email</label>
 <input
 type="email"
 required
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="nama@dpupk.go.id"
 className="seline-input mt-1.5 w-full"
 autoComplete="email"
 />
 </div>
 <div>
 <label className="text-[11px] font-medium tracking-[0.04em] uppercase text-[#78716c]">Password</label>
 <input
 type="password"
 required
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="••••••••"
 className="seline-input mt-1.5 w-full"
 autoComplete="current-password"
 />
 </div>
 {err && <div className="text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-3 py-2">{err}</div>}
 <button type="submit" disabled={loading} className="w-full h-[40px] rounded-full bg-[#3ba6f1] text-white text-[14px] font-medium hover:bg-[#3398e1] disabled:opacity-60 transition">
 {loading ? "Memproses..." : "Masuk"}
 </button>
 </form>
 </div>

 <p className="text-center text-[11px] text-[#a8a29e] mt-4">© 2026 DPUPK Kabupaten</p>
 </div>
 </div>
 );
}
