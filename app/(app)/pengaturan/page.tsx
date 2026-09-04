"use client";
import { useState } from "react";
import Link from "next/link";
import { useSKP } from "@/lib/store";
import { ROLE_SHORT } from "@/lib/roles";

export default function PengaturanPage() {
  const { currentUser, setCurrentUser, employees, notify } = useSKP();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [lastSyncedId, setLastSyncedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Sinkronisasi sekali saat currentUser tersedia (adjust-state-during-render,
  // bukan di dalam effect agar tidak cascading render).
  if (currentUser && currentUser.id !== lastSyncedId) {
    setLastSyncedId(currentUser.id);
    setName(currentUser.name);
    setEmail(currentUser.email);
    setAvatar(currentUser.avatar ?? "");
  }

  if (!currentUser) return null;

  const supervisor = employees.find((e) => e.id === currentUser.supervisorId);
  const dirty =
    name.trim() !== currentUser.name ||
    email.trim() !== currentUser.email ||
    avatar.trim() !== (currentUser.avatar ?? "");

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim().length < 3) { notify("Nama minimal 3 karakter"); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { notify("Email tidak valid"); return; }
    if (avatar.trim().length > 8) { notify("Inisial avatar maksimal 8 karakter"); return; }
    if (!dirty) { notify("Tidak ada perubahan"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), avatar: avatar.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { notify(j.error || "Gagal menyimpan"); return; }
      if (j.user) setCurrentUser(j.user);
      notify("Informasi akun diperbarui");
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) { notify("Password saat ini wajib diisi"); return; }
    if (newPassword.length < 6) { notify("Password baru minimal 6 karakter"); return; }
    if (newPassword !== confirmPassword) { notify("Konfirmasi password tidak cocok"); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { notify(j.error || "Gagal mengganti password"); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      notify("Password berhasil diganti");
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : "Gagal mengganti password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">PENGATURAN • AKUN SAYA</p>
          <h2 className="heading-sm mt-1">Pengaturan Akun</h2>
          <p className="mt-1 text-[14px] text-[#78716c] max-w-[620px]">
            Kelola informasi akun Anda — nama, email, inisial avatar, dan password.
          </p>
        </div>
        <Link href="/dashboard" className="btn-ghost text-[13px]">← Kembali ke Dashboard</Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Ringkasan profil */}
        <div className="seline-card lg:col-span-2 h-fit">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-[#0c0a09] text-white flex items-center justify-center text-[16px] font-medium shrink-0" style={{ borderRadius: 9999 }}>
              {(avatar.trim() || currentUser.avatar || "?").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-medium text-[#0c0a09] truncate">{name.trim() || currentUser.name}</div>
              <div className="text-[12px] text-[#78716c] truncate">{email.trim() || currentUser.email}</div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#3ba6f1] text-white text-[10px] font-semibold tracking-[0.04em] uppercase" style={{ borderRadius: 9999 }}>
                {ROLE_SHORT[currentUser.role]}
              </span>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-[13px] border-t border-[#e8e6e5] pt-4">
            <div className="flex justify-between gap-3">
              <dt className="text-[#a8a29e]">NIP / Nomor Pegawai</dt>
              <dd className="font-medium text-[#0c0a09] text-right break-all">{currentUser.employeeNumber}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#a8a29e]">Jabatan</dt>
              <dd className="font-medium text-[#0c0a09] text-right">{ROLE_SHORT[currentUser.role]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#a8a29e]">Atasan langsung</dt>
              <dd className="font-medium text-[#0c0a09] text-right">{supervisor ? supervisor.name.split(",")[0] : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#a8a29e]">Status</dt>
              <dd className="font-medium text-[#0c0a09] text-right">{currentUser.isActive ? "Aktif" : "Non-aktif"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-[#a8a29e]">
            NIP, jabatan, dan atasan dikelola oleh admin/pimpinan — hubungi admin bila ada yang perlu diubah.
          </p>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Informasi akun */}
          <div className="seline-card">
            <div className="eyebrow">INFORMASI AKUN</div>
            <div className="subheading mt-1">Data profil</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Nama lengkap</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className="seline-input w-full" />
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@instansi.go.id" type="email" className="seline-input w-full" />
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Inisial avatar (maks 8)</span>
                <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="AB" maxLength={8} className="seline-input w-full" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveProfile} disabled={saving || !dirty} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </div>

          {/* Keamanan */}
          <div className="seline-card">
            <div className="eyebrow">KEAMANAN</div>
            <div className="subheading mt-1">Ganti password</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Password saat ini</span>
                <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" className="seline-input w-full" />
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Password baru (min 6)</span>
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="new-password" className="seline-input w-full" />
              </label>
              <label className="block">
                <span className="block text-[12px] font-medium text-[#78716c] mb-1.5">Konfirmasi password baru</span>
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="new-password" className="seline-input w-full" />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSavePassword} disabled={savingPassword} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {savingPassword ? "Menyimpan..." : "Ganti password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
