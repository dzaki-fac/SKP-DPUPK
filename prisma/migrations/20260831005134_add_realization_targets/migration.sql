-- CreateTable
CREATE TABLE "realization_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "realization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "realization_targets_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_performance_realizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Realisasi',
    "realization_value" TEXT NOT NULL DEFAULT '1',
    "realization_description" TEXT NOT NULL DEFAULT '',
    "realization_date" TEXT NOT NULL,
    "realization_time" TEXT NOT NULL DEFAULT '09:00',
    "uploaded_by" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "performance_realizations_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_realizations_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_performance_realizations" ("created_at", "id", "performance_plan_id", "realization_date", "realization_description", "realization_time", "realization_value", "title", "uploaded_by") SELECT "created_at", "id", "performance_plan_id", "realization_date", "realization_description", coalesce("realization_time", '09:00') AS "realization_time", "realization_value", "title", "uploaded_by" FROM "performance_realizations";
DROP TABLE "performance_realizations";
ALTER TABLE "new_performance_realizations" RENAME TO "performance_realizations";
CREATE INDEX "performance_realizations_uploaded_by_idx" ON "performance_realizations"("uploaded_by");
CREATE INDEX "performance_realizations_performance_plan_id_idx" ON "performance_realizations"("performance_plan_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "realization_targets_realization_id_idx" ON "realization_targets"("realization_id");
