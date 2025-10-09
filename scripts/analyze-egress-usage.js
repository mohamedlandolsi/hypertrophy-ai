/**
 * Optimize database queries to reduce egress usage
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeEgressUsage() {
  console.log('🔍 Analyzing database usage patterns...');
  
  try {
    // Check embedding sizes
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      take: 5,
      where: {
        embeddingData: { not: null }
      },
      select: {
        id: true,
        embeddingData: true,
        content: true
      }
    });

    let totalEmbeddingSize = 0;
    sampleChunks.forEach(chunk => {
      const embeddingSize = chunk.embeddingData ? chunk.embeddingData.length : 0;
      totalEmbeddingSize += embeddingSize;
      console.log(`Chunk ${chunk.id}: ${(embeddingSize / 1024).toFixed(2)} KB embedding`);
    });

    const avgEmbeddingSize = totalEmbeddingSize / sampleChunks.length;
    console.log(`\n📊 Average embedding size: ${(avgEmbeddingSize / 1024).toFixed(2)} KB`);

    // Estimate total embedding data
    const totalChunks = await prisma.knowledgeChunk.count({
      where: { embeddingData: { not: null } }
    });

    const estimatedTotalSize = (avgEmbeddingSize * totalChunks) / (1024 * 1024);
    console.log(`📈 Estimated total embedding data: ${estimatedTotalSize.toFixed(2)} MB for ${totalChunks} chunks`);

    // Check message sizes
    const recentMessages = await prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true
      }
    });

    console.log('\n💬 Recent message sizes:');
    recentMessages.forEach(msg => {
      const size = msg.content.length;
      console.log(`Message ${msg.id}: ${(size / 1024).toFixed(2)} KB`);
    });

    console.log('\n🎯 Recommendations to reduce egress:');
    console.log('1. Enable database connection pooling');
    console.log('2. Implement response caching');
    console.log('3. Optimize RAG chunk retrieval');
    console.log('4. Consider compressing embeddings');

  } catch (error) {
    console.error('❌ Error analyzing usage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeEgressUsage();
