/**
 * Simple script to examine the content in the knowledge base
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba'
};

async function examineKnowledgeContent() {
  console.log('🔍 Examining Knowledge Base Content');
  console.log('==================================\n');

  try {
    // Get some sample chunks to see what content looks like
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        },
        embeddingData: {
          not: null
        }
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 5
    });

    console.log(`📚 Sample chunks from knowledge base (${sampleChunks.length} total):\n`);

    sampleChunks.forEach((chunk, index) => {
      console.log(`${index + 1}. From: "${chunk.knowledgeItem.title}"`);
      console.log(`   Chunk ${chunk.chunkIndex}:`);
      console.log(`   "${chunk.content}"`);
      console.log(`   Length: ${chunk.content.length} characters`);
      console.log(`   Has embedding: ${chunk.embeddingData ? 'Yes' : 'No'}`);
      console.log('─'.repeat(60) + '\n');
    });

    // Now let's manually test similarity with common fitness terms
    console.log('🎯 Testing Content Relevance for Common Queries:');
    console.log('================================================\n');

    const testTerms = ['hypertrophy', 'muscle', 'exercise', 'training', 'sets', 'reps', 'progressive overload'];
    
    for (const term of testTerms) {
      const matchingChunks = await prisma.knowledgeChunk.count({
        where: {
          knowledgeItem: {
            userId: TEST_CONFIG.userId
          },
          content: {
            contains: term,
            mode: 'insensitive'
          }
        }
      });

      console.log(`"${term}": ${matchingChunks} chunks contain this term`);
    }

  } catch (error) {
    console.error('❌ Error examining content:', error.message);
  }
}

// Test simple similarity calculation
async function testSimpleSearch() {
  console.log('\n🔬 Testing Simple Search Logic');
  console.log('==============================\n');

  try {
    const query = 'muscle hypertrophy exercises';
    console.log(`Testing query: "${query}"`);

    // Get chunks that contain key terms
    const relevantChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        },
        OR: [
          { content: { contains: 'muscle', mode: 'insensitive' } },
          { content: { contains: 'hypertrophy', mode: 'insensitive' } },
          { content: { contains: 'exercise', mode: 'insensitive' } },
          { content: { contains: 'training', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 3
    });

    console.log(`Found ${relevantChunks.length} potentially relevant chunks:`);
    
    relevantChunks.forEach((chunk, index) => {
      console.log(`\n${index + 1}. From: "${chunk.knowledgeItem.title}"`);
      console.log(`   Preview: ${chunk.content.substring(0, 200)}...`);
    });

  } catch (error) {
    console.error('❌ Error in simple search test:', error.message);
  }
}

// Run the examination
async function runExamination() {
  try {
    await examineKnowledgeContent();
    await testSimpleSearch();
  } catch (error) {
    console.error('❌ Examination failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runExamination();
