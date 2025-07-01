-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "AIConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful fitness and hypertrophy AI assistant. You help users with workout planning, nutrition advice, and achieving their fitness goals.',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 8192,
    "topK" INTEGER NOT NULL DEFAULT 40,
    "topP" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "useClientMemory" BOOLEAN NOT NULL DEFAULT true,
    "enableWebSearch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConfiguration_pkey" PRIMARY KEY ("id")
);
