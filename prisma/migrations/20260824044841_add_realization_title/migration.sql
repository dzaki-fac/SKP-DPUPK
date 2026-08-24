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
    "position_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "role" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TEXT,
    CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_employees" ("avatar", "department_id", "email", "employee_number", "id", "is_active", "last_login_at", "name", "password", "position_id", "role", "supervisor_id", "user_id") SELECT "avatar", "department_id", "email", "employee_number", "id", "is_active", "last_login_at", "name", "password", "position_id", "role", "supervisor_id", "user_id" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE TABLE "new_performance_realizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Realisasi',
    "realization_value" TEXT NOT NULL,
    "realization_description" TEXT NOT NULL,
    "realization_date" TEXT NOT NULL,
    "achievement_percentage" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reject_reason" TEXT,
    CONSTRAINT "performance_realizations_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_performance_realizations" ("achievement_percentage", "id", "performance_plan_id", "realization_date", "realization_description", "realization_value", "reject_reason", "status") SELECT "achievement_percentage", "id", "performance_plan_id", "realization_date", "realization_description", "realization_value", "reject_reason", "status" FROM "performance_realizations";
DROP TABLE "performance_realizations";
ALTER TABLE "new_performance_realizations" RENAME TO "performance_realizations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
