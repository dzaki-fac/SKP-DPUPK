CREATE TABLE "plan_targets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "plan_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
  CONSTRAINT "plan_targets_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "plan_targets_plan_id_idx" ON "plan_targets"("plan_id");
