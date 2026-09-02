-- AlterTable: make employeeId nullable and add customName
-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate table
-- For simplicity, just add column and make employeeId nullable via new table
-- Create new table with desired schema, copy data, drop old, rename

-- This is a simplified approach for SQLite: add custom_name column, and make employee_id nullable by recreating

PRAGMA foreign_keys=off;

CREATE TABLE "new_realization_participants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "realization_id" TEXT NOT NULL,
  "employee_id" TEXT,
  "custom_name" TEXT,
  "role" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
  CONSTRAINT "realization_participants_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "realization_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_realization_participants" ("id", "realization_id", "employee_id", "role", "created_at")
  SELECT "id", "realization_id", "employee_id", "role", "created_at" FROM "realization_participants";

DROP TABLE "realization_participants";

ALTER TABLE "new_realization_participants" RENAME TO "realization_participants";

CREATE INDEX "realization_participants_realization_id_idx" ON "realization_participants"("realization_id");
CREATE INDEX "realization_participants_employee_id_idx" ON "realization_participants"("employee_id");

PRAGMA foreign_keys=on;
