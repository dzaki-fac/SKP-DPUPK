-- AlterTable
ALTER TABLE "performance_realizations" ADD COLUMN "uploaded_by" TEXT;

-- CreateIndex
CREATE INDEX "performance_realizations_uploaded_by_idx" ON "performance_realizations"("uploaded_by");