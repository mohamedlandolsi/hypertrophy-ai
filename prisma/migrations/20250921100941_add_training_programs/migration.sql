-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('COMPOUND', 'ISOLATION', 'UNILATERAL');

-- CreateEnum
CREATE TYPE "TrainingMuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'ADDUCTORS', 'CALVES', 'TRAPS', 'LATS', 'RHOMBOIDS', 'REAR_DELTS', 'MIDDLE_DELTS', 'FRONT_DELTS');

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "price" INTEGER NOT NULL,
    "lemonSqueezyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramGuide" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL,
    "requiredMuscleGroups" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingExercise" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "primaryMuscleGroup" TEXT NOT NULL,
    "secondaryMuscleGroups" TEXT[],
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgram_lemonSqueezyId_key" ON "TrainingProgram"("lemonSqueezyId");

-- CreateIndex
CREATE INDEX "TrainingProgram_isActive_idx" ON "TrainingProgram"("isActive");

-- CreateIndex
CREATE INDEX "TrainingProgram_lemonSqueezyId_idx" ON "TrainingProgram"("lemonSqueezyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramGuide_trainingProgramId_key" ON "ProgramGuide"("trainingProgramId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_trainingProgramId_idx" ON "WorkoutTemplate"("trainingProgramId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_trainingProgramId_order_idx" ON "WorkoutTemplate"("trainingProgramId", "order");

-- CreateIndex
CREATE INDEX "TrainingExercise_primaryMuscleGroup_idx" ON "TrainingExercise"("primaryMuscleGroup");

-- CreateIndex
CREATE INDEX "TrainingExercise_type_idx" ON "TrainingExercise"("type");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_idx" ON "UserPurchase"("userId");

-- CreateIndex
CREATE INDEX "UserPurchase_trainingProgramId_idx" ON "UserPurchase"("trainingProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_trainingProgramId_key" ON "UserPurchase"("userId", "trainingProgramId");

-- CreateIndex
CREATE INDEX "UserProgram_userId_idx" ON "UserProgram"("userId");

-- CreateIndex
CREATE INDEX "UserProgram_trainingProgramId_idx" ON "UserProgram"("trainingProgramId");

-- CreateIndex
CREATE INDEX "UserProgram_userId_trainingProgramId_idx" ON "UserProgram"("userId", "trainingProgramId");

-- AddForeignKey
ALTER TABLE "ProgramGuide" ADD CONSTRAINT "ProgramGuide_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
