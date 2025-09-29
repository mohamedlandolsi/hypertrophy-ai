-- CreateTable
CREATE TABLE "ProgramStructure" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "structureType" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 4,
    "trainingDays" INTEGER NOT NULL DEFAULT 3,
    "restDays" INTEGER NOT NULL DEFAULT 1,
    "weeklySchedule" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramStructure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramStructure_trainingProgramId_idx" ON "ProgramStructure"("trainingProgramId");

-- CreateIndex
CREATE INDEX "ProgramStructure_trainingProgramId_order_idx" ON "ProgramStructure"("trainingProgramId", "order");

-- CreateIndex
CREATE INDEX "ProgramStructure_isDefault_idx" ON "ProgramStructure"("isDefault");

-- AddForeignKey
ALTER TABLE "ProgramStructure" ADD CONSTRAINT "ProgramStructure_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data
INSERT INTO "ProgramStructure" (
    "id",
    "trainingProgramId",
    "name",
    "structureType",
    "sessionCount",
    "trainingDays",
    "restDays",
    "weeklySchedule",
    "order",
    "isDefault",
    "createdAt",
    "updatedAt"
)
SELECT 
    'ps_' || "id" || '_' || extract(epoch from NOW())::text,
    "id",
    jsonb_build_object(
        'en', CASE WHEN "structureType" = 'weekly' THEN 'Weekly Structure' ELSE 'Cyclic Structure' END,
        'ar', CASE WHEN "structureType" = 'weekly' THEN 'هيكل أسبوعي' ELSE 'هيكل دوري' END,
        'fr', CASE WHEN "structureType" = 'weekly' THEN 'Structure Hebdomadaire' ELSE 'Structure Cyclique' END
    ),
    COALESCE("structureType", 'weekly'),
    COALESCE("sessionCount", 4),
    COALESCE("trainingDays", 3),
    COALESCE("restDays", 1),
    "weeklySchedule",
    0,
    true,
    "createdAt",
    "updatedAt"
FROM "TrainingProgram"
WHERE "structureType" IS NOT NULL;

-- DropIndex
DROP INDEX "TrainingProgram_structureType_idx";

-- AlterTable
ALTER TABLE "TrainingProgram" DROP COLUMN "restDays",
DROP COLUMN "sessionCount",
DROP COLUMN "structureType",
DROP COLUMN "trainingDays",
DROP COLUMN "weeklySchedule";