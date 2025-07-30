/*
  Warnings:

  - You are about to drop the column `modelName` on the `AIConfiguration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AIConfiguration" DROP COLUMN "modelName",
ADD COLUMN     "freeModelName" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
ADD COLUMN     "proModelName" TEXT NOT NULL DEFAULT 'gemini-2.5-pro',
ALTER COLUMN "temperature" SET DEFAULT 0.4,
ALTER COLUMN "maxTokens" SET DEFAULT 2000,
ALTER COLUMN "topK" SET DEFAULT 30,
ALTER COLUMN "topP" SET DEFAULT 0.8,
ALTER COLUMN "ragHighRelevanceThreshold" SET DEFAULT 0.5,
ALTER COLUMN "ragMaxChunks" SET DEFAULT 17,
ALTER COLUMN "ragSimilarityThreshold" SET DEFAULT 0.1;

-- CreateIndex
CREATE INDEX "KnowledgeChunk_createdAt_idx" ON "KnowledgeChunk"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_createdAt_knowledgeItemId_idx" ON "KnowledgeChunk"("createdAt", "knowledgeItemId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_embeddingData_idx" ON "KnowledgeChunk"("embeddingData");

-- CreateIndex
CREATE INDEX "User_lastMessageReset_idx" ON "User"("lastMessageReset");

-- CreateIndex
CREATE INDEX "User_lastUploadReset_idx" ON "User"("lastUploadReset");

-- CreateIndex
CREATE INDEX "User_plan_idx" ON "User"("plan");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
