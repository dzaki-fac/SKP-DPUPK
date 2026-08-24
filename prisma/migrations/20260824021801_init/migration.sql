-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "role" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skp_periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "performance_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT,
    "skp_period_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "performance_plans_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "performance_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_skp_period_id_fkey" FOREIGN KEY ("skp_period_id") REFERENCES "skp_periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "performance_plans_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_realizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "realization_value" TEXT NOT NULL,
    "realization_description" TEXT NOT NULL,
    "realization_date" TEXT NOT NULL,
    "achievement_percentage" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reject_reason" TEXT,
    CONSTRAINT "performance_realizations_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "realization_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "performance_attachments_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_attachments_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "performance_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performance_plan_id" TEXT NOT NULL,
    "assessor_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "predicate" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "assessed_at" TEXT NOT NULL,
    CONSTRAINT "performance_assessments_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_assessments_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
