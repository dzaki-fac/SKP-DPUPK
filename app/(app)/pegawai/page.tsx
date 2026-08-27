"use client";
import EmployeeManager from "@/components/org/EmployeeManager";

export default function PegawaiPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">AKUN & ORGANISASI</p>
        <h2 className="heading-serif text-[28px]">Kelola pegawai</h2>
        <p className="text-sm text-[#283338]/60 mt-1">
          Tambah, ubah jabatan/atasan, reset password, dan non-aktifkan akun pegawai (khusus administrator).
        </p>
      </div>
      <EmployeeManager />
    </div>
  );
}