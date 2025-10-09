const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkChunkEmbeddings() {
  try {
    console.log('🔍 Checking chunk embedding data...\n');

    // Get a sample chunk
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      include: {
        knowledgeItem: {
          select: { title: true, status: true }
        }
      }
    });

    if (sampleChunk) {
      console.log(`📄 Sample chunk from: ${sampleChunk.knowledgeItem.title}`);
      console.log(`   Status: ${sampleChunk.knowledgeItem.status}`);
      console.log(`   Content length: ${sampleChunk.content.length}`);
      console.log(`   Content preview: ${sampleChunk.content.substring(0, 100)}...`);
      console.log(`   Embedding data: ${sampleChunk.embeddingData ? 'EXISTS' : 'NULL'}`);
      
      if (sampleChunk.embeddingData) {
        console.log(`   Embedding type: ${typeof sampleChunk.embeddingData}`);
        if (typeof sampleChunk.embeddingData === 'string') {
          try {
            const parsed = JSON.parse(sampleChunk.embeddingData);
            console.log(`   Embedding array length: ${parsed.length}`);
          } catch (e) {
            console.log(`   Embedding parsing error: ${e.message}`);
          }
        }
      }
    }

    // Check if there's a pattern with null embeddings
    const nullEmbeddingCount = await prisma.knowledgeChunk.count({
      where: { embeddingData: null }
    });
    
    const totalCount = await prisma.knowledgeChunk.count();
    
    console.log(`\n📊 Embedding Status:`);
    console.log(`   Total chunks: ${totalCount}`);
    console.log(`   Chunks with NULL embeddings: ${nullEmbeddingCount}`);
    console.log(`   Chunks with embeddings: ${totalCount - nullEmbeddingCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChunkEmbeddings();
