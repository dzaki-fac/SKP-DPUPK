/**
 * Verifikasi data kanonis (lib/perpus-2026.ts) terhadap Excel sumber.
 * - Jumlah baris & NIP harus sama persis dengan Excel
 * - Nama harus cocok (normalisasi spasi)
 * - Hierarki harus lolos validateOrgCreate (aturan lib/roles.ts)
 *
 * Cara pakai:  npx tsx scripts/import-perpus-2026.ts
 *               npm run data:verify
 */
import * as path from "node:path";
import XLSX from "xlsx";
import { PERPUS_2026_EMPLOYEES } from "../lib/perpus-2026";
import { validateOrgCreate, type OrgRow } from "../lib/roles";

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

async function main() {
  const file = path.join(process.cwd(), "NEW PERPUS - penataan pegawai 2026.xlsx");
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }).slice(1);

  const errors: string[] = [];

  // 1. Jumlah baris
  if (rows.length !== PERPUS_2026_EMPLOYEES.length) {
    errors.push(`Jumlah baris Excel (${rows.length}) != data kanonis (${PERPUS_2026_EMPLOYEES.length})`);
  }

  // 2. NIP + nama per baris (via excelRow)
  const byRow = new Map(PERPUS_2026_EMPLOYEES.map((e) => [e.excelRow, e]));
  rows.forEach((r, i) => {
    const excelRow = i + 2;
    const parts = String(r[1] ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    const nip = parts[parts.length - 1] ?? "";
    const nama = parts.slice(0, -1).join(" ");
    const canon = byRow.get(excelRow);
    if (!canon) {
      errors.push(`Baris ${excelRow}: tidak ada padanan kanonis (nama Excel: "${nama}")`);
      return;
    }
    if (canon.employeeNumber !== nip) {
      errors.push(`Baris ${excelRow}: NIP beda — Excel "${nip}" vs kanonis "${canon.employeeNumber}" (${canon.name})`);
    }
    if (norm(canon.name) !== norm(nama)) {
      errors.push(`Baris ${excelRow}: nama beda — Excel "${nama}" vs kanonis "${canon.name}"`);
    }
  });

  // 3. Unik: id, userId, employeeNumber, email
  for (const key of ["id", "userId", "employeeNumber", "email"] as const) {
    const seen = new Set<string>();
    for (const e of PERPUS_2026_EMPLOYEES) {
      if (seen.has(e[key])) errors.push(`Duplikat ${key}: "${e[key]}" (${e.name})`);
      seen.add(e[key]);
    }
  }

  // 4. Validasi hierarki bertahap (aturan lib/roles.ts)
  const acc: OrgRow[] = [];
  for (const e of PERPUS_2026_EMPLOYEES) {
    const next: OrgRow = { id: e.id, role: e.role, supervisorId: e.supervisorId };
    const v = validateOrgCreate(acc, next);
    if (!v.ok) errors.push(`Hierarki ${e.name} (${e.role}): ${v.error}`);
    acc.push(next);
  }

  // 5. Komposisi Opsi A
  const count = (r: string) => PERPUS_2026_EMPLOYEES.filter((e) => e.role === r).length;
  const expect: Record<string, number> = { pimpinan_1: 1, pimpinan_2: 1, pimpinan_3: 2, staf: 31 };
  for (const [r, n] of Object.entries(expect)) {
    if (count(r) !== n) errors.push(`Komposisi ${r}: ${count(r)} (harusnya ${n})`);
  }
  const bawahan = (sup: string) => PERPUS_2026_EMPLOYEES.filter((e) => e.supervisorId === sup).length;
  if (bawahan("e-nuryati") !== 8) errors.push(`Bawahan Nuryati: ${bawahan("e-nuryati")} (harusnya 8)`);
  if (bawahan("e-linda") !== 23) errors.push(`Bawahan Linda: ${bawahan("e-linda")} (harusnya 23)`);

  // Ringkasan tree
  const nameOf = (id: string) => PERPUS_2026_EMPLOYEES.find((e) => e.id === id)?.name.split(",")[0] ?? id;
  console.log("Struktur Opsi A:");
  console.log(`- ${nameOf("e-suwondo")} (pimpinan_1)`);
  console.log(`  └─ ${nameOf("e-sulasdi")} (pimpinan_2)`);
  for (const sup of ["e-nuryati", "e-linda"]) {
    const kids = PERPUS_2026_EMPLOYEES.filter((e) => e.supervisorId === sup);
    console.log(`     ├─ ${nameOf(sup)} (pimpinan_3) → ${kids.length} staf`);
  }

  if (errors.length) {
    console.error(`\nVERIFIKASI GAGAL (${errors.length}):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`\nVERIFIKASI OK — ${PERPUS_2026_EMPLOYEES.length} pegawai cocok dengan Excel, hierarki valid.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
