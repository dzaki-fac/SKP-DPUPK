"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSKP } from "@/lib/store";
import { seedEmployees } from "@/lib/data";
import { roleLabel } from "@/lib/data";
import { IllustrationLeft, IllustrationRight } from "@/components/illustrations/BrowserIllustrations";

export default function LandingPage() {
  const { currentUser, login } = useSKP();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) router.push("/dashboard");
  }, [currentUser, router]);

  const handleLogin = async (emp: typeof seedEmployees[number]) => {
    setErr(null); setLoading(true);
    const res = await login(emp.email, "password");
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setErr(res.error || "Gagal masuk");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErr("Email dan password wajib diisi"); return; }
    setErr(null); setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setErr(res.error || "Email atau password salah");
  };

  return (
    <div className="min-h-screen bg-[#f2f8f7]">
      {/* Header — simple */}
      <header className="sticky top-0 z-20 bg-[#f2f8f7]/80 backdrop-blur border-b border-[#e4f0f1]">
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#1c5d5f] flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3L4 7v6c0 4.2 2.9 8 8 9 5.1-1 8-4.8 8-9V7l-8-4z" stroke="white" strokeWidth="1.6" fill="none"/><path d="M8 12l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="leading-none">
              <div className="font-semibold text-[15px] tracking-[-0.01em] text-[#231e21]">SKP DPUPK</div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#283338]/60">Kabupaten • Sistem Kinerja</div>
            </div>
          </div>
          <a href="#login" className="px-5 py-2 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152] transition hidden sm:inline-flex" style={{ borderRadius: 48 }}>Masuk</a>
        </div>
      </header>

      {/* Announce */}
      <div className="max-w-[1200px] mx-auto px-6 mt-6 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#e4f0f1] border border-[#a2cbcd] text-sm" style={{ borderRadius: 1000 }}>
          <span className="w-2 h-2 rounded-full bg-[#1c5d5f] animate-pulse" />
          <span className="font-mono text-xs tracking-[0.04em] uppercase text-[#0e4749] font-semibold">Periode SKP 2026 aktif</span>
          <span className="hidden sm:inline text-[#283338]/60 text-xs">•</span>
          <span className="text-[#283338] text-xs hidden sm:inline">Transparan dari Direktur hingga Staff</span>
        </div>
      </div>

      {/* Hero — simple, no tech jargon */}
      <section className="max-w-[1200px] mx-auto px-6 mt-8">
        <div className="relative overflow-hidden rounded-[12px] border border-[#e4f0f1] bg-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full bg-[#e4f0f1] opacity-70 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 w-[360px] h-[360px] rounded-full bg-[#f2e8e2] opacity-60 blur-3xl" />
          </div>
          <div className="relative flex items-center justify-center gap-3 lg:gap-6 p-6 lg:p-10">
            <div className="hidden lg:block shrink-0"><IllustrationLeft /></div>
            <div className="text-center max-w-[720px] flex-1">
              <p className="eyebrow flex items-center justify-center gap-2">MANAJEMEN KINERJA PEGAWAI</p>
              <h1 className="heading-serif text-[38px] md:text-[52px] lg:text-[64px] font-normal leading-[0.95] mt-3">
                Kinerja yang <span className="italic font-bold" style={{ fontFamily: "var(--font-p22-mackinac-pro)" }}>mengalir</span><br />dari atas ke bawah.
              </h1>
              <p className="mt-4 text-[15px] md:text-[17px] leading-7 text-[#283338]/75 max-w-[560px] mx-auto">
                Kelola rencana, pantau progress, dan tindak lanjuti laporan dalam satu tempat. Cocok untuk organisasi dengan banyak tim dan tingkatan.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => handleLogin(seedEmployees[0])} className="px-7 py-3 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152] transition shadow-none" style={{ borderRadius: 48 }}>Masuk sebagai Direktur →</button>
                <button onClick={() => handleLogin(seedEmployees[7])} className="px-7 py-3 rounded-full bg-white border border-[#0e4749] text-[#0e4749] text-sm font-medium hover:bg-[#f2f8f7] transition" style={{ borderRadius: 48 }}>Lihat sebagai Admin</button>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2 font-mono text-[11px] tracking-wide">
                <span className="px-2.5 py-1 rounded-full bg-[#f2f8f7] border border-[#e4f0f1]">✓ Mudah digunakan</span>
                <span className="px-2.5 py-1 rounded-full bg-[#f2f8f7] border border-[#e4f0f1]">✓ Progress real-time</span>
                <span className="px-2.5 py-1 rounded-full bg-[#f2f8f7] border border-[#e4f0f1]">✓ Aman & tercatat</span>
              </div>
            </div>
            <div className="hidden lg:block shrink-0"><IllustrationRight /></div>
          </div>
          <div className="relative border-t border-[#e4f0f1] bg-[#f2f8f7]/60 px-6 py-3 flex flex-wrap justify-center gap-4 lg:gap-8">
            {[
              { n: "82%", l: "PROGRESS ORGANISASI" },
              { n: "7", l: "RENCANA AKTIF" },
              { n: "4 LEVEL", l: "HIERARKI FLEKSIBEL" },
              { n: "REAL-TIME", l: "MONITORING" },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold tracking-[0.04em] text-[#283338]">{s.n}</span>
                <span className="font-mono text-xs tracking-[0.06em] uppercase text-[#283338]/60">{s.l}</span>
                <span className="hidden lg:inline text-[#a2cbcd]">|</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur — simpel */}
      <section id="alur" className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="text-center max-w-[640px] mx-auto">
          <p className="eyebrow flex items-center justify-center gap-2">CARA KERJA</p>
          <h2 className="heading-serif text-[28px] md:text-[36px] mt-2 leading-tight">Tiga langkah, semua terhubung</h2>
          <p className="text-sm text-[#283338]/60 mt-2">Rencana dari pimpinan diturunkan ke tim, lalu dikerjakan dan dilaporkan kembali.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { step: "01", eyebrow: "DIREKTUR", title: "Buat rencana", desc: "Tentukan tujuan utama dan bagikan ke supervisor.", color: "#1c5d5f", items: ["Contoh: kualitas pelayanan", "Target jelas & terukur", "Bagikan ke tim"] },
            { step: "02", eyebrow: "SUPERVISOR", title: "Bagi ke staff", desc: "Pecah jadi tugas yang lebih kecil untuk setiap staff.", color: "#16325a", items: ["Tugas spesifik per orang", "Pantau progress harian", "Bantu jika terhambat"] },
            { step: "03", eyebrow: "STAFF", title: "Kerjakan & lapor", desc: "Selesaikan tugas, unggah bukti, dan tunggu verifikasi.", color: "#65b8a2", items: ["Isi capaian & unggah bukti", "Menunggu persetujuan", "Dapat nilai & feedback"] },
          ].map(card => (
            <div key={card.step} className="p-6 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.06em] uppercase px-2 py-1 rounded-full bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}><span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ background: card.color }} />{card.eyebrow}</span>
                <span className="heading-serif text-2xl text-[#283338]/10">{card.step}</span>
              </div>
              <h3 className="heading-serif text-[20px] mt-4">{card.title}</h3>
              <p className="text-sm text-[#283338]/70 mt-1 leading-6">{card.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {card.items.map(it => <li key={it} className="flex gap-2 text-sm"><span className="text-[#1c5d5f] font-bold">✓</span><span className="text-[#283338]/80">{it}</span></li>)}
              </ul>
              <div className="mt-4 p-3 rounded-xl bg-white border border-[#e4f0f1] flex items-center gap-2" style={{ borderRadius: 12 }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: card.color }}>→</div>
                <span className="font-mono text-xs tracking-wide text-[#283338]/60">Terhubung otomatis</span>
                <span className="ml-auto text-xs text-[#1c5d5f] font-medium">→</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[12px] border border-[#e4f0f1] bg-white p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs tracking-wide text-[#283338]/60">STRUKTUR ORGANISASI</div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-full bg-[#1c5d5f] text-white" style={{ borderRadius: 100 }}>Direktur</span><span className="text-[#a2cbcd]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-[#16325a] text-white" style={{ borderRadius: 100 }}>Supervisor</span><span className="text-[#a2cbcd]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-[#f2e8e2] border border-[#e4f0f1] text-[#283338]" style={{ borderRadius: 100 }}>Staff</span>
          </div>
        </div>
      </section>

      {/* Fitur — simple */}
      <section id="fitur" className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 md:p-7 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow flex items-center gap-2">PANTAU PROGRESS</div>
            <h3 className="heading-serif text-[22px] mt-2">Semua perkembangan terlihat</h3>
            <div className="mt-4 flex gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-white border border-[#e4f0f1]" style={{ borderRadius: 100 }}>Draft</span><span className="px-2.5 py-1 rounded-full bg-[#f2e8e2] border border-[#e4f0f1]" style={{ borderRadius: 100 }}>Diajukan</span><span className="px-2.5 py-1 rounded-full bg-white border border-[#a2cbcd]" style={{ borderRadius: 100 }}>Diperiksa</span><span className="px-2.5 py-1 rounded-full bg-[#1c5d5f] text-white" style={{ borderRadius: 100 }}>Selesai</span>
            </div>
            <p className="text-sm text-[#283338]/70 mt-3">Setiap laporan dilengkapi bukti dan status yang jelas, jadi pimpinan tahu apa yang perlu ditindaklanjuti.</p>
            <div className="mt-4 rounded-xl bg-white border border-[#e4f0f1] p-3 flex items-center gap-3" style={{ borderRadius: 12 }}>
              <div className="w-8 h-8 rounded-full bg-[#65b8a2] flex items-center justify-center text-white text-xs">✓</div>
              <div><div className="text-sm font-medium">110 berkas • 92%</div><div className="font-mono text-xs text-[#283338]/60">Menunggu verifikasi</div></div>
              <span className="ml-auto font-mono text-xs px-2 py-1 rounded-full bg-[#f2e8e2] border border-[#e4f0f1]" style={{ borderRadius: 100 }}>Menunggu</span>
            </div>
          </div>
          <div className="p-6 md:p-7 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow flex items-center gap-2">RIWAYAT LENGKAP</div>
            <h3 className="heading-serif text-[22px] mt-2">Semua aktivitas tercatat</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { v: "5", k: "Log baru" }, { v: "24j", k: "Tersimpan" }, { v: "—", k: "Aman" },
              ].map(x => <div key={x.k} className="rounded-xl bg-[#f2f8f7] border border-[#e4f0f1] py-3" style={{ borderRadius: 12 }}><div className="heading-serif text-lg leading-none">{x.v}</div><div className="font-mono text-[10px] uppercase tracking-wide text-[#283338]/60">{x.k}</div></div>)}
            </div>
            <p className="text-sm text-[#283338]/70 mt-3">Setiap aksi — buat, limpahkan, realisasi, verifikasi — otomatis masuk audit trail.</p>
            <div className="mt-4 flex gap-2">
              <span className="flex-1 py-2 rounded-full bg-[#1c5d5f] text-white text-xs font-medium text-center" style={{ borderRadius: 48 }}>Audit Trail</span>
              <span className="flex-1 py-2 rounded-full bg-[#f2f8f7] border border-[#e4f0f1] text-xs text-center" style={{ borderRadius: 48 }}>Riwayat lengkap</span>
            </div>
          </div>
        </div>
      </section>

      {/* Login — production */}
      <section id="login" className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div className="p-6 md:p-7 border bg-white" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow">MASUK AKUN</div>
            <h2 className="heading-serif text-[26px] mt-1">Masuk dengan email & password</h2>
            <p className="text-sm text-[#283338]/60 mt-1">Akun produksi tersimpan di SQLite. Demo: password <code className="bg-[#f2f8f7] px-1.5 py-0.5 rounded border border-[#e4f0f1] text-xs">password</code> untuk semua akun di bawah.</p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div>
                <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold text-[#283338]/70">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="direktur@dpupk.go.id" className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] focus:bg-white" style={{ borderRadius: 12 }} />
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.04em] uppercase font-semibold text-[#283338]/70">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#e4f0f1] bg-[#f2f8f7] text-sm focus:outline-none focus:border-[#a2cbcd] focus:bg-white" style={{ borderRadius: 12 }} />
              </div>
              {err && <div className="p-2.5 rounded-xl bg-[#f2e8e2] border border-[#d6aec1] text-xs text-[#283338]" style={{ borderRadius: 12 }}>{err}</div>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152] disabled:opacity-60 transition" style={{ borderRadius: 48 }}>{loading ? "Memproses..." : "Masuk →"}</button>
              <p className="font-mono text-[11px] text-[#283338]/50 text-center">Lupa password? Hubungi admin untuk reset.</p>
            </form>
          </div>
          <div className="p-6 border bg-[#e4f0f1]" style={{ borderRadius: 12, borderColor: "#e4f0f1" }}>
            <div className="eyebrow">KEAMANAN PRODUKSI</div>
            <h3 className="heading-serif text-[20px] mt-1">Siap dipakai, bukan demo</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> Middleware lindungi /dashboard, /rencana, dst.</li>
              <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> Validasi di semua API, audit trail otomatis</li>
              <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> SQLite persisted — `npm run db:seed` untuk data awal</li>
              <li className="flex gap-2"><span className="text-[#1c5d5f] font-bold">✓</span> Upload bukti ke <code className="bg-white px-1 py-0.5 rounded border border-[#e4f0f1] text-xs">/public/uploads</code></li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-white border border-[#e4f0f1] font-mono text-xs" style={{ borderRadius: 12 }}>
              <div className="font-semibold">Akun demo:</div>
              <div className="mt-1 grid grid-cols-1 gap-1 text-[#283338]/70">
                <span>direktur@dpupk.go.id / admin@dpupk.go.id</span>
                <span>siti.rahayu@dpupk.go.id (supervisor)</span>
                <span>rina.m@dpupk.go.id (staff) — pass: <b className="text-[#1c5d5f]">password</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Peran — simple */}
      <section id="peran" className="max-w-[1200px] mx-auto px-6 mt-10 pb-10">
        <div className="text-center max-w-[560px] mx-auto">
          <p className="eyebrow flex items-center justify-center gap-2">COBA CEPAT</p>
          <h2 className="heading-serif text-[30px] lg:text-[36px] mt-2 leading-tight">Atau klik peran untuk masuk instan</h2>
          <p className="text-sm text-[#283338]/60 mt-2">Otomatis login dengan password demo — untuk uji peran tanpa ketik.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {seedEmployees.map(e => (
            <button key={e.id} onClick={() => handleLogin(e)} className="text-left p-5 rounded-xl border border-[#e4f0f1] bg-[#e4f0f1] hover:bg-white hover:border-[#a2cbcd] transition group relative overflow-hidden" style={{ borderRadius: 12 }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] bg-white/40 pointer-events-none" />
              <div className="flex items-center gap-2.5 relative">
                <div className="w-9 h-9 rounded-full bg-[#16325a] text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ borderRadius: 9999 }}>{e.avatar}</div>
                <span className="text-[11px] font-mono tracking-[0.06em] uppercase px-2 py-1 rounded-full border text-[#0e4749] border-[#a2cbcd] bg-white">{e.role}</span>
              </div>
              <div className="mt-4 font-semibold text-[14px] leading-tight text-[#231e21] relative">{e.name}</div>
              <div className="text-xs text-[#283338]/60 mt-1 relative">{roleLabel[e.role]}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#1c5d5f] relative">Masuk sebagai {roleLabel[e.role]} <span>→</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#e4f0f1] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="heading-serif text-xl">Siap memulai?</div><div className="text-sm text-[#283338]/60">Pilih peran di atas atau langsung ke dashboard.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleLogin(seedEmployees[1])} className="px-6 py-2.5 rounded-full bg-white border border-[#0e4749] text-[#0e4749] text-sm font-medium" style={{ borderRadius: 48 }}>Sebagai Supervisor</button>
            <button onClick={() => handleLogin(seedEmployees[0])} className="px-6 py-2.5 rounded-full bg-[#1c5d5f] text-white text-sm font-medium hover:bg-[#156152]" style={{ borderRadius: 48 }}>Ke Dashboard →</button>
          </div>
        </div>
        <div className="text-center font-mono text-[11px] tracking-wide text-[#283338]/40 pb-6">© 2026 DPUPK Kabupaten</div>
      </section>
    </div>
  );
}
