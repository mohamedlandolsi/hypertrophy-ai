const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database status...');
    
    // Check knowledge chunks count
    const chunkCount = await prisma.knowledgeChunk.count();
    console.log(`📊 Knowledge chunks: ${chunkCount}`);
    
    // Check knowledge items count  
    const itemCount = await prisma.knowledgeItem.count();
    console.log(`📚 Knowledge items: ${itemCount}`);
    
    if (chunkCount > 0) {
      // Check a sample chunk
      const sampleChunk = await prisma.knowledgeChunk.findFirst({
        where: {
          embeddingData: { not: null }
        },
        include: {
          knowledgeItem: {
            select: { title: true, status: true }
          }
        }
      });
      
      if (sampleChunk) {
        console.log(`📋 Sample chunk from: ${sampleChunk.knowledgeItem.title}`);
        console.log(`📏 Embedding data length: ${sampleChunk.embeddingData?.length || 0} chars`);
        console.log(`📊 Status: ${sampleChunk.knowledgeItem.status}`);
        
        // Try to parse embedding
        try {
          const embedding = JSON.parse(sampleChunk.embeddingData || '[]');
          console.log(`🔢 Embedding vector length: ${embedding.length}`);
        } catch (parseError) {
          console.log('❌ Embedding data is not valid JSON');
        }
      } else {
        console.log('⚠️ No chunks with embedding data found');
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
