-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItemCategory" (
    "id" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "knowledgeCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_name_key" ON "KnowledgeCategory"("name");

-- CreateIndex
CREATE INDEX "KnowledgeItemCategory_knowledgeItemId_idx" ON "KnowledgeItemCategory"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "KnowledgeItemCategory_knowledgeCategoryId_idx" ON "KnowledgeItemCategory"("knowledgeCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeItemCategory_knowledgeItemId_knowledgeCategoryId_key" ON "KnowledgeItemCategory"("knowledgeItemId", "knowledgeCategoryId");

-- AddForeignKey
ALTER TABLE "KnowledgeItemCategory" ADD CONSTRAINT "KnowledgeItemCategory_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItemCategory" ADD CONSTRAINT "KnowledgeItemCategory_knowledgeCategoryId_fkey" FOREIGN KEY ("knowledgeCategoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
