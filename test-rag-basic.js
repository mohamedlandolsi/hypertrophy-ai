/**
 * Simple RAG test script to verify knowledge base is working
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBasicKnowledgeRetrieval() {
  console.log('🔍 Testing basic knowledge base retrieval...\n');
  
  try {
    // Get some sample chunks
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: {
          not: null
        }
      },
      take: 5,
      include: {
        knowledgeItem: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    console.log(`📊 Found ${chunks.length} chunks with embeddings:`);
    chunks.forEach((chunk, index) => {
      console.log(`${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
      console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
      console.log(`   Has embedding: ${chunk.embeddingData ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Count total chunks with embeddings
    const totalWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: {
          not: null
        }
      }
    });

    const totalChunks = await prisma.knowledgeChunk.count();

    console.log(`✅ Total chunks: ${totalChunks}`);
    console.log(`✅ Chunks with embeddings: ${totalWithEmbeddings}`);
    console.log(`✅ Coverage: ${((totalWithEmbeddings / totalChunks) * 100).toFixed(1)}%`);

    if (totalWithEmbeddings === totalChunks) {
      console.log('\n🎉 All chunks have embeddings! Knowledge base is ready.');
    } else {
      console.log('\n⚠️ Some chunks are missing embeddings.');
    }

  } catch (error) {
    console.error('❌ Error testing knowledge base:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBasicKnowledgeRetrieval();
