-- CreateTable
CREATE TABLE "ClientMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "trainingExperience" TEXT,
    "weeklyTrainingDays" INTEGER,
    "preferredTrainingStyle" TEXT,
    "trainingSchedule" TEXT,
    "availableTime" INTEGER,
    "primaryGoal" TEXT,
    "secondaryGoals" TEXT[],
    "targetWeight" DOUBLE PRECISION,
    "targetBodyFat" DOUBLE PRECISION,
    "goalDeadline" TIMESTAMP(3),
    "motivation" TEXT,
    "injuries" TEXT[],
    "limitations" TEXT[],
    "medications" TEXT[],
    "allergies" TEXT[],
    "dietaryPreferences" TEXT[],
    "foodDislikes" TEXT[],
    "supplementsUsed" TEXT[],
    "sleepHours" DOUBLE PRECISION,
    "stressLevel" TEXT,
    "workSchedule" TEXT,
    "gymAccess" BOOLEAN NOT NULL DEFAULT false,
    "homeGym" BOOLEAN NOT NULL DEFAULT false,
    "equipmentAvailable" TEXT[],
    "gymBudget" DOUBLE PRECISION,
    "currentBench" DOUBLE PRECISION,
    "currentSquat" DOUBLE PRECISION,
    "currentDeadlift" DOUBLE PRECISION,
    "currentOHP" DOUBLE PRECISION,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "communicationStyle" TEXT,
    "coachingNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientMemory_userId_key" ON "ClientMemory"("userId");

-- AddForeignKey
ALTER TABLE "ClientMemory" ADD CONSTRAINT "ClientMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
