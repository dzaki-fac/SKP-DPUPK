-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skp_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,

    CONSTRAINT "skp_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_plans" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "skp_period_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "target" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',
    "planned_date" TEXT,
    "planned_time" TEXT,
    "allow_self_claim" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "performance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_targets" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',

    CONSTRAINT "plan_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_realizations" (
    "id" TEXT NOT NULL,
    "performance_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Realisasi',
    "realization_value" TEXT NOT NULL DEFAULT '1',
    "realization_description" TEXT NOT NULL DEFAULT '',
    "realization_date" TEXT NOT NULL,
    "realization_time" TEXT NOT NULL DEFAULT '09:00',
    "uploaded_by" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',

    CONSTRAINT "performance_realizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realization_targets" (
    "id" TEXT NOT NULL,
    "realization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',

    CONSTRAINT "realization_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realization_participants" (
    "id" TEXT NOT NULL,
    "realization_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "custom_name" TEXT,
    "role" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',

    CONSTRAINT "realization_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_attachments" (
    "id" TEXT NOT NULL,
    "performance_plan_id" TEXT NOT NULL,
    "realization_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '2026-01-01',

    CONSTRAINT "performance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TEXT NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_supervisor_id_idx" ON "employees"("supervisor_id");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "performance_plans_parent_id_idx" ON "performance_plans"("parent_id");

-- CreateIndex
CREATE INDEX "performance_plans_assigned_to_idx" ON "performance_plans"("assigned_to");

-- CreateIndex
CREATE INDEX "performance_plans_skp_period_id_idx" ON "performance_plans"("skp_period_id");

-- CreateIndex
CREATE INDEX "plan_targets_plan_id_idx" ON "plan_targets"("plan_id");

-- CreateIndex
CREATE INDEX "performance_realizations_uploaded_by_idx" ON "performance_realizations"("uploaded_by");

-- CreateIndex
CREATE INDEX "performance_realizations_performance_plan_id_idx" ON "performance_realizations"("performance_plan_id");

-- CreateIndex
CREATE INDEX "realization_targets_realization_id_idx" ON "realization_targets"("realization_id");

-- CreateIndex
CREATE INDEX "realization_participants_realization_id_idx" ON "realization_participants"("realization_id");

-- CreateIndex
CREATE INDEX "realization_participants_employee_id_idx" ON "realization_participants"("employee_id");

-- CreateIndex
CREATE INDEX "performance_attachments_performance_plan_id_idx" ON "performance_attachments"("performance_plan_id");

-- CreateIndex
CREATE INDEX "performance_attachments_realization_id_idx" ON "performance_attachments"("realization_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_plans" ADD CONSTRAINT "performance_plans_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "performance_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_plans" ADD CONSTRAINT "performance_plans_skp_period_id_fkey" FOREIGN KEY ("skp_period_id") REFERENCES "skp_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_plans" ADD CONSTRAINT "performance_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_plans" ADD CONSTRAINT "performance_plans_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_targets" ADD CONSTRAINT "plan_targets_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "performance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_realizations" ADD CONSTRAINT "performance_realizations_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_realizations" ADD CONSTRAINT "performance_realizations_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realization_targets" ADD CONSTRAINT "realization_targets_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realization_participants" ADD CONSTRAINT "realization_participants_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realization_participants" ADD CONSTRAINT "realization_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_attachments" ADD CONSTRAINT "performance_attachments_performance_plan_id_fkey" FOREIGN KEY ("performance_plan_id") REFERENCES "performance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_attachments" ADD CONSTRAINT "performance_attachments_realization_id_fkey" FOREIGN KEY ("realization_id") REFERENCES "performance_realizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_attachments" ADD CONSTRAINT "performance_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
