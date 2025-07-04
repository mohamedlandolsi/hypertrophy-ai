/**
 * Simple debug script to check RAG system
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test configuration - Using a real user ID from the database
const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba', // User with 80 embedded chunks
  testQuery: 'What are the best exercises for muscle hypertrophy?'
};

async function basicRAGDebug() {
  console.log('🔍 Basic RAG System Debug');
  console.log('========================\n');

  try {
    // Step 1: Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { id: TEST_CONFIG.userId }
    });

    if (!user) {
      console.log(`❌ User ${TEST_CONFIG.userId} not found`);
      console.log('Please update TEST_CONFIG.userId with a valid user ID');
      return;
    }
    console.log(`✅ User found: ${user.id}`);

    // Step 2: Check knowledge base
    console.log('\n2️⃣ Checking knowledge base...');
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        userId: TEST_CONFIG.userId,
        status: 'READY'
      },
      select: {
        id: true,
        title: true,
        type: true,
        _count: {
          select: {
            chunks: true
          }
        }
      }
    });

    console.log(`Found ${knowledgeItems.length} knowledge items:`);
    if (knowledgeItems.length === 0) {
      console.log('❌ No knowledge items found!');
      console.log('This is likely why RAG is not working - no documents uploaded');
      return;
    }

    knowledgeItems.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" (${item.type}) - ${item._count.chunks} chunks`);
    });

    // Step 3: Check embeddings
    console.log('\n3️⃣ Checking embeddings...');
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        }
      }
    });

    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        },
        embeddingData: {
          not: null
        }
      }
    });

    console.log(`Total chunks: ${totalChunks}`);
    console.log(`Chunks with embeddings: ${chunksWithEmbeddings}`);

    if (chunksWithEmbeddings === 0) {
      console.log('❌ No embeddings found!');
      console.log('This is likely why RAG is not working - no embeddings generated');
      return;
    }

    const embeddingCoverage = (chunksWithEmbeddings / totalChunks * 100).toFixed(1);
    console.log(`✅ Embedding coverage: ${embeddingCoverage}%`);

    // Step 4: Check AI configuration
    console.log('\n4️⃣ Checking AI configuration...');
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!aiConfig) {
      console.log('❌ No AI configuration found');
      return;
    }

    console.log('✅ AI Configuration found:');
    console.log(`   Model: ${aiConfig.modelName}`);
    console.log(`   Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);

    if (!aiConfig.useKnowledgeBase) {
      console.log('❌ Knowledge base is DISABLED in AI configuration!');
      console.log('This is why RAG is not working - feature is turned off');
      return;
    }

    // Step 5: Test a simple vector search
    console.log('\n5️⃣ Testing simple vector search...');
    
    // Get a sample chunk to test similarity
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        knowledgeItem: {
          userId: TEST_CONFIG.userId
        },
        embeddingData: {
          not: null
        }
      },
      select: {
        id: true,
        content: true,
        embeddingData: true,
        knowledgeItem: {
          select: {
            title: true
          }
        }
      }
    });

    if (sampleChunk) {
      console.log('✅ Sample chunk found:');
      console.log(`   From: ${sampleChunk.knowledgeItem.title}`);
      console.log(`   Content preview: ${sampleChunk.content.substring(0, 100)}...`);
      console.log(`   Has embedding: ${sampleChunk.embeddingData ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ No sample chunk found');
    }

    // Step 6: Summary
    console.log('\n📊 RAG System Status Summary:');
    console.log('─'.repeat(40));
    
    const issues = [];
    if (knowledgeItems.length === 0) issues.push('No knowledge items');
    if (chunksWithEmbeddings === 0) issues.push('No embeddings');
    if (!aiConfig.useKnowledgeBase) issues.push('Knowledge base disabled');
    
    if (issues.length === 0) {
      console.log('✅ RAG system appears to be properly configured');
      console.log('   - Knowledge items: Present');
      console.log('   - Embeddings: Generated');
      console.log('   - AI config: Enabled');
      console.log('\nThe issue might be in the retrieval logic or prompt construction.');
    } else {
      console.log('❌ RAG system has issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

// Run the debug
async function runBasicDebug() {
  try {
    await basicRAGDebug();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runBasicDebug();
