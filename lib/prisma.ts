import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Next.js memuat env (termasuk di Vercel) secara otomatis —
// sengaja TANPA import "dotenv/config" di sini agar tidak ada
// dependensi implisit saat build. Entry CLI (tsx) yang butuh .env
// memuat dotenv di filenya masing-masing (mis. prisma/seed.ts).

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diset. Isi di file .env lokal atau di Vercel Project > Settings > Environment Variables " +
        "(pakai Session/Transaction Pooler Supabase, bukan host db.* langsung yang IPv6-only)."
    );
  }
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    // Serverless (Vercel): tiap instance fungsi cukup 1 koneksi.
    // Pooling beneran dipegang Supavisor/Supabase di sisi server.
    // Default pg (max 10/instance) menghabiskan jatah Supabase
    // ("max clients reached", pool_size session mode cuma 15).
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Selalu cache di globalThis — termasuk production — agar
// serverless (Vercel) tidak membuat pool baru di tiap invocasi.
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
