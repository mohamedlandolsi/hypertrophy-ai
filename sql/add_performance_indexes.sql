-- Performance Optimization Indexes Migration
-- Created: November 9, 2025
-- Purpose: Add strategic indexes to improve query performance

-- ============================================
-- TrainingProgram Indexes
-- ============================================

-- Optimize fetching active programs for a user
CREATE INDEX IF NOT EXISTS "TrainingProgram_userId_isActive_idx" 
ON "TrainingProgram"("userId", "isActive") 
WHERE "userId" IS NOT NULL;

-- Optimize sorting by creation date
CREATE INDEX IF NOT EXISTS "TrainingProgram_createdAt_idx" 
ON "TrainingProgram"("createdAt" DESC);

-- ============================================
-- TrainingSplit Indexes
-- ============================================

-- Composite for filtering active splits by difficulty
CREATE INDEX IF NOT EXISTS "TrainingSplit_isActive_difficulty_idx" 
ON "TrainingSplit"("isActive", "difficulty") 
WHERE "isActive" = true;

-- ============================================
-- TrainingSplitStructure Indexes
-- ============================================

-- Optimize queries filtering structures by split and days
CREATE INDEX IF NOT EXISTS "TrainingSplitStructure_splitId_daysPerWeek_idx" 
ON "TrainingSplitStructure"("splitId", "daysPerWeek");

-- ============================================
-- TrainingDayAssignment Indexes
-- ============================================

-- Composite for efficient day assignment queries
CREATE INDEX IF NOT EXISTS "TrainingDayAssignment_structureId_dayNumber_idx" 
ON "TrainingDayAssignment"("structureId", "dayNumber");

-- Optimize filtering by day of week
CREATE INDEX IF NOT EXISTS "TrainingDayAssignment_dayOfWeek_idx" 
ON "TrainingDayAssignment"("dayOfWeek") 
WHERE "dayOfWeek" IS NOT NULL;

-- ============================================
-- CustomTrainingProgram Indexes
-- ============================================

-- Optimize fetching user programs by status
CREATE INDEX IF NOT EXISTS "CustomTrainingProgram_userId_status_idx" 
ON "CustomTrainingProgram"("userId", "status");

-- Optimize sorting user programs by date
CREATE INDEX IF NOT EXISTS "CustomTrainingProgram_userId_createdAt_idx" 
ON "CustomTrainingProgram"("userId", "createdAt" DESC);

-- Optimize filtering all programs by status
CREATE INDEX IF NOT EXISTS "CustomTrainingProgram_status_idx" 
ON "CustomTrainingProgram"("status");

-- ============================================
-- Workout Indexes
-- ============================================

-- Optimize filtering workouts by type within a program
CREATE INDEX IF NOT EXISTS "Workout_programId_type_idx" 
ON "Workout"("programId", "type");

-- ============================================
-- Exercise Indexes
-- ============================================

-- Optimize filtering exercises by muscle and active status
CREATE INDEX IF NOT EXISTS "Exercise_primaryMuscle_isActive_idx" 
ON "Exercise"("primaryMuscle", "isActive") 
WHERE "primaryMuscle" IS NOT NULL;

-- Optimize filtering by category and status
CREATE INDEX IF NOT EXISTS "Exercise_category_isActive_idx" 
ON "Exercise"("category", "isActive");

-- Optimize fetching recommended active exercises
CREATE INDEX IF NOT EXISTS "Exercise_isActive_isRecommended_idx" 
ON "Exercise"("isActive", "isRecommended") 
WHERE "isRecommended" = true;

-- ============================================
-- ProgramTemplate Indexes
-- ============================================

-- Optimize fetching popular active templates
CREATE INDEX IF NOT EXISTS "ProgramTemplate_isActive_popularity_idx" 
ON "ProgramTemplate"("isActive", "popularity" DESC) 
WHERE "isActive" = true;

-- Optimize filtering active templates by difficulty
CREATE INDEX IF NOT EXISTS "ProgramTemplate_isActive_difficultyLevel_idx" 
ON "ProgramTemplate"("isActive", "difficultyLevel") 
WHERE "isActive" = true;

-- ============================================
-- User Indexes
-- ============================================

-- Optimize subscription-based queries
CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" 
ON "User"("subscriptionTier");

CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" 
ON "User"("subscriptionStatus");

CREATE INDEX IF NOT EXISTS "User_subscriptionTier_subscriptionStatus_idx" 
ON "User"("subscriptionTier", "subscriptionStatus");

-- ============================================
-- Query Performance Tips
-- ============================================

-- ANALYZE tables to update statistics for query planner
ANALYZE "TrainingProgram";
ANALYZE "TrainingSplit";
ANALYZE "TrainingSplitStructure";
ANALYZE "TrainingDayAssignment";
ANALYZE "CustomTrainingProgram";
ANALYZE "Workout";
ANALYZE "Exercise";
ANALYZE "ProgramTemplate";
ANALYZE "User";

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE "TrainingProgram";
VACUUM ANALYZE "CustomTrainingProgram";
VACUUM ANALYZE "Exercise";
