-- CreateEnum
CREATE TYPE "CoachChatStatus" AS ENUM ('ACTIVE', 'CLOSED', 'PENDING');

-- CreateTable
CREATE TABLE "CoachChat" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "CoachChatStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "CoachChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "coachChatId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CoachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachChat_userId_idx" ON "CoachChat"("userId");

-- CreateIndex
CREATE INDEX "CoachChat_coachId_idx" ON "CoachChat"("coachId");

-- CreateIndex
CREATE INDEX "CoachChat_status_idx" ON "CoachChat"("status");

-- CreateIndex
CREATE INDEX "CoachChat_createdAt_idx" ON "CoachChat"("createdAt");

-- CreateIndex
CREATE INDEX "CoachMessage_coachChatId_idx" ON "CoachMessage"("coachChatId");

-- CreateIndex
CREATE INDEX "CoachMessage_senderId_idx" ON "CoachMessage"("senderId");

-- CreateIndex
CREATE INDEX "CoachMessage_createdAt_idx" ON "CoachMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "CoachChat" ADD CONSTRAINT "CoachChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachChat" ADD CONSTRAINT "CoachChat_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_coachChatId_fkey" FOREIGN KEY ("coachChatId") REFERENCES "CoachChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
