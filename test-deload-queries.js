/**
 * Test deload-specific queries to verify knowledge base retrieval
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeloadQueries() {
  console.log('🔍 Testing deload-related knowledge base queries...');
  
  try {
    // First, let's see what deload content we have
    const deloadChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'deload', mode: 'insensitive' } },
          { content: { contains: 'rest week', mode: 'insensitive' } },
          { content: { contains: 'recovery week', mode: 'insensitive' } }
        ],
        knowledgeItem: {
          status: 'READY'
        }
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 10
    });

    console.log(`📚 Found ${deloadChunks.length} chunks containing deload-related content:`);
    
    deloadChunks.forEach((chunk, index) => {
      console.log(`\n${index + 1}. From "${chunk.knowledgeItem.title}"`);
      console.log(`   Chunk ${chunk.chunkIndex}: ${chunk.content.substring(0, 200)}...`);
      console.log(`   Has embedding: ${chunk.embeddingData ? 'Yes' : 'No'}`);
    });

    // Check the specific deload article
    const deloadArticle = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'deload',
          mode: 'insensitive'
        }
      },
      include: {
        chunks: {
          take: 5,
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    if (deloadArticle) {
      console.log(`\n📋 Found deload article: "${deloadArticle.title}"`);
      console.log(`   Status: ${deloadArticle.status}`);
      console.log(`   Total chunks: ${deloadArticle.chunks.length}`);
      
      deloadArticle.chunks.forEach((chunk, index) => {
        console.log(`   Chunk ${chunk.chunkIndex}: ${chunk.content.substring(0, 150)}...`);
      });
    } else {
      console.log('\n❌ No deload article found');
    }

  } catch (error) {
    console.error('❌ Error testing deload queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeloadQueries();
