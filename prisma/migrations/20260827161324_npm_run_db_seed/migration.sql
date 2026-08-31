/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `performance_assessments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `department_id` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `position_id` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `indicator` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `performance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `achievement_percentage` on the `performance_realizations` table. All the data in the column will be lost.
  - You are about to drop the column `reject_reason` on the `performance_realizations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `performance_realizations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `skp_periods` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Department_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Department";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Position";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "performance_assessments";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '$2b$10$49djtnPFASpNsPac7EGsNuFQIXbZy.ypISMj13WQ/o1SIUCYjXID2',
    "supervisor_id" TEXT,
    "role" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_employees" ("avatar", "email", "employee_number", "id", "is_active", "last_login_at", "name", "password", "role", "supervisor_id", "user_id") SELECT "avatar", "email", "employee_number", "id", "is_active", "last_login_at", "name", "password", "role", "supervisor_id", "user_id" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE INDEX "employees_supervisor_id_idx" ON "employees"("supervisor_id");
CREATE INDEX "employees_role_idx" ON "employees"("role");
CREATE TABLE "new_performance_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "realization_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "performance_attachments_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_attachments_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "performance_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_performance_attachments" ("date", "file_name", "file_path", "file_size", "id", "performance_plan_id", "realization_id", "uploaded_by") SELECT "date", "file_name", "file_path", "file_size", "id", "performance_plan_id", "realization_id", "uploaded_by" FROM "performance_attachments";
DROP TABLE "performance_attachments";
ALTER TABLE "new_performance_attachments" RENAME TO "performance_attachments";
CREATE INDEX "performance_attachments_performance_plan_id_idx" ON "performance_attachments"("performance_plan_id");
CREATE INDEX "performance_attachments_realization_id_idx" ON "performance_attachments"("realization_id");
CREATE TABLE "new_performance_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT,
    "skp_period_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "target" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "performance_plans_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "performance_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_skp_period_id_fkey" FOREIGN KEY ("skp_period_id") REFERENCES "skp_periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_performance_plans" ("assigned_to", "created_by", "description", "id", "parent_id", "progress", "skp_period_id", "target", "title") SELECT "assigned_to", "created_by", "description", "id", "parent_id", "progress", "skp_period_id", "target", "title" FROM "performance_plans";
DROP TABLE "performance_plans";
ALTER TABLE "new_performance_plans" RENAME TO "performance_plans";
CREATE INDEX "performance_plans_parent_id_idx" ON "performance_plans"("parent_id");
CREATE INDEX "performance_plans_assigned_to_idx" ON "performance_plans"("assigned_to");
CREATE INDEX "performance_plans_skp_period_id_idx" ON "performance_plans"("skp_period_id");
CREATE TABLE "new_performance_realizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Realisasi',
    "realization_value" TEXT NOT NULL DEFAULT '1',
    "realization_description" TEXT NOT NULL DEFAULT '',
    "realization_date" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    CONSTRAINT "performance_realizations_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_performance_realizations" ("id", "performance_plan_id", "realization_date", "realization_description", "realization_value", "title") SELECT "id", "performance_plan_id", "realization_date", "realization_description", "realization_value", "title" FROM "performance_realizations";
DROP TABLE "performance_realizations";
ALTER TABLE "new_performance_realizations" RENAME TO "performance_realizations";
CREATE INDEX "performance_realizations_performance_plan_id_idx" ON "performance_realizations"("performance_plan_id");
CREATE TABLE "new_skp_periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL
);
INSERT INTO "new_skp_periods" ("end_date", "id", "name", "start_date", "year") SELECT "end_date", "id", "name", "start_date", "year" FROM "skp_periods";
DROP TABLE "skp_periods";
ALTER TABLE "new_skp_periods" RENAME TO "skp_periods";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");
