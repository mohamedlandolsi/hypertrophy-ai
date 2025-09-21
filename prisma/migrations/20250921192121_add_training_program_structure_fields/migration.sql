/*
  Warnings:

  - You are about to drop the column `category` on the `UserProgram` table. All the data in the column will be lost.
  - Added the required column `categoryType` to the `UserProgram` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProgramCategoryType" AS ENUM ('MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST');

-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN     "allowsCustomization" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "estimatedDuration" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "hasInteractiveBuilder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "programType" TEXT NOT NULL DEFAULT 'Upper/Lower',
ADD COLUMN     "sessionCount" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "UserProgram" DROP COLUMN "category",
ADD COLUMN     "categoryType" "ProgramCategoryType" NOT NULL;

-- DropEnum
DROP TYPE "ProgramCategory";

-- CreateTable
CREATE TABLE "ProgramCategories" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "categoryType" "ProgramCategoryType" NOT NULL,
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseTemplate" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "categoryType" "ProgramCategoryType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "volume" JSONB NOT NULL,
    "alternatives" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramCategories_trainingProgramId_idx" ON "ProgramCategories"("trainingProgramId");

-- CreateIndex
CREATE INDEX "ProgramCategories_categoryType_idx" ON "ProgramCategories"("categoryType");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_trainingProgramId_idx" ON "ExerciseTemplate"("trainingProgramId");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_muscleGroup_idx" ON "ExerciseTemplate"("muscleGroup");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_categoryType_idx" ON "ExerciseTemplate"("categoryType");

-- CreateIndex
CREATE INDEX "TrainingProgram_programType_idx" ON "TrainingProgram"("programType");

-- AddForeignKey
ALTER TABLE "ProgramCategories" ADD CONSTRAINT "ProgramCategories_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseTemplate" ADD CONSTRAINT "ExerciseTemplate_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
