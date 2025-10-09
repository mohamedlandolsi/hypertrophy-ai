const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugKnowledgeRetrieval() {
  try {
    console.log('🔍 Debugging Knowledge Base Retrieval...\n');

    // 1. Check if we have knowledge chunks
    const totalChunks = await prisma.knowledgeChunk.count();
    console.log(`📚 Total knowledge chunks: ${totalChunks}`);

    if (totalChunks === 0) {
      console.log('❌ No knowledge chunks found! This could cause timeouts.');
      return;
    }

    // 2. Check if chunks have embeddings
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });

    console.log(`🧠 Chunks with embeddings: ${chunksWithEmbeddings}/${totalChunks}`);

    if (chunksWithEmbeddings === 0) {
      console.log('❌ No chunks have embeddings! Vector search will fail.');
      return;
    }

    // 3. Test a simple vector search query
    console.log('\n🔍 Testing vector search performance...');
    const testQuery = 'chest workout';
    
    const startTime = Date.now();
    
    // Simulate the vector search query (without actual embedding)
    const searchResults = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'chest', mode: 'insensitive' } },
          { content: { contains: 'workout', mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        content: true,
        knowledgeItemId: true,
        chunkIndex: true
      }
    });

    const endTime = Date.now();
    const searchTime = endTime - startTime;

    console.log(`⏱️ Search completed in ${searchTime}ms`);
    console.log(`📝 Found ${searchResults.length} relevant chunks`);

    if (searchTime > 5000) {
      console.log('⚠️  Search is slow (>5s) - this could cause timeouts');
    }

    // 4. Check for any problematic chunks
    const largeChunks = await prisma.knowledgeChunk.findMany({
      select: {
        id: true,
        content: true,
        source: true
      },
      orderBy: {
        content: 'desc'
      },
      take: 3
    });

    console.log('\n📏 Checking chunk sizes...');
    largeChunks.forEach((chunk, index) => {
      const size = chunk.content?.length || 0;
      console.log(`Chunk ${index + 1}: ${size} characters from ${chunk.source}`);
      if (size > 10000) {
        console.log('⚠️  Very large chunk detected - might slow processing');
      }
    });

    // 5. Test database connection speed
    console.log('\n🔌 Testing database connection speed...');
    const connectionStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - connectionStart;
    console.log(`💾 Database connection: ${connectionTime}ms`);

    if (connectionTime > 1000) {
      console.log('⚠️  Slow database connection detected');
    }

    console.log('\n✅ Knowledge base debug complete');

  } catch (error) {
    console.error('❌ Error debugging knowledge retrieval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugKnowledgeRetrieval();
