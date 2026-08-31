-- Fix: lean_schema_sync accidentally dropped uploaded_by column added in 20260827000000
-- Re-add column and index (idempotent with IF NOT EXISTS handling via manual patch, but for fresh DB this is needed)
ALTER TABLE "performance_realizations" ADD COLUMN "uploaded_by" TEXT;
CREATE INDEX "performance_realizations_uploaded_by_idx" ON "performance_realizations"("uploaded_by");
