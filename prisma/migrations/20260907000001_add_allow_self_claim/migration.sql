-- Add allow_self_claim flag for Pengambilan Mandiri (Rencana Pilihan)
ALTER TABLE "performance_plans" ADD COLUMN "allow_self_claim" BOOLEAN NOT NULL DEFAULT 0;
