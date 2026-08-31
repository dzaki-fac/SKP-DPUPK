-- CreateTable
CREATE TABLE "employee_supervisors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "employee_supervisors_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "employee_supervisors_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "employee_supervisors_employee_id_idx" ON "employee_supervisors"("employee_id");

-- CreateIndex
CREATE INDEX "employee_supervisors_supervisor_id_idx" ON "employee_supervisors"("supervisor_id");
