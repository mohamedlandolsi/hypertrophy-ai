/*
  Warnings:

  - You are about to drop the column `difficulty` on the `TrainingProgram` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDuration` on the `TrainingProgram` table. All the data in the column will be lost.
  - You are about to drop the column `programType` on the `TrainingProgram` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TrainingProgram_programType_idx";

-- AlterTable
ALTER TABLE "TrainingProgram" DROP COLUMN "difficulty",
DROP COLUMN "estimatedDuration",
DROP COLUMN "programType",
ADD COLUMN     "restDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "structureType" TEXT NOT NULL DEFAULT 'weekly',
ADD COLUMN     "trainingDays" INTEGER NOT NULL DEFAULT 3;

-- CreateIndex
CREATE INDEX "TrainingProgram_structureType_idx" ON "TrainingProgram"("structureType");
