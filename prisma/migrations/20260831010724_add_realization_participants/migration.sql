-- CreateTable
CREATE TABLE "realization_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "realization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "realization_participants_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "realization_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "realization_participants_realization_id_idx" ON "realization_participants"("realization_id");

-- CreateIndex
CREATE INDEX "realization_participants_employee_id_idx" ON "realization_participants"("employee_id");
