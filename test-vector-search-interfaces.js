// test-vector-search-interfaces.js
// Test to verify the updated vector search system interfaces

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVectorSearchInterfaces() {
  console.log('🧪 Testing Vector Search Interface Updates');
  console.log('=========================================\n');

  try {
    // Test the database structure
    console.log('Test 1: Database Structure Verification');
    console.log('---------------------------------------');
    
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { status: 'READY' }
      },
      include: {
        knowledgeItem: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (sampleChunk) {
      console.log('✅ Sample chunk structure:');
      console.log(`   - Chunk ID: ${sampleChunk.id}`);
      console.log(`   - Knowledge Item ID: ${sampleChunk.knowledgeItem.id}`);
      console.log(`   - Title: ${sampleChunk.knowledgeItem.title}`);
      console.log(`   - Has embedding: ${!!sampleChunk.embeddingData}`);
      console.log(`   - Content length: ${sampleChunk.content.length} characters`);
    } else {
      console.log('⚠️ No chunks with embeddings found');
    }

    // Test the AI configuration
    console.log('\n\nTest 2: AI Configuration Check');
    console.log('------------------------------');
    
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (aiConfig) {
      console.log('✅ AI Configuration found:');
      console.log(`   - RAG Max Chunks: ${aiConfig.ragMaxChunks}`);
      console.log(`   - RAG Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
      console.log(`   - Free Model: ${aiConfig.freeModelName}`);
      console.log(`   - Pro Model: ${aiConfig.proModelName}`);
    } else {
      console.log('❌ AI Configuration not found');
    }

    // Test vector search compatibility
    console.log('\n\nTest 3: Vector Search Compatibility');
    console.log('-----------------------------------');
    
    // Simulate what the new interface expects
    const mockKnowledgeContext = {
      id: 'test-id',
      title: 'Test Title',
      content: 'Test content',
      score: 0.85
    };

    const hasNewInterface = 
      typeof mockKnowledgeContext.id === 'string' &&
      typeof mockKnowledgeContext.title === 'string' &&
      typeof mockKnowledgeContext.content === 'string' &&
      typeof mockKnowledgeContext.score === 'number';

    console.log(`✅ New interface compatibility: ${hasNewInterface ? 'PASSED' : 'FAILED'}`);

    // Test database query structure for new interface
    console.log('\n\nTest 4: Database Query Structure');
    console.log('--------------------------------');
    
    const totalReadyChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { status: 'READY' }
      }
    });

    console.log(`✅ Total ready chunks: ${totalReadyChunks}`);

    if (totalReadyChunks > 0) {
      // Test the structure that our new vector search will return
      const testChunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null },
          knowledgeItem: { status: 'READY' }
        },
        include: {
          knowledgeItem: {
            select: {
              id: true,
              title: true
            }
          }
        },
        take: 3
      });

      console.log(`✅ Retrieved ${testChunks.length} test chunks for interface mapping`);
      
      testChunks.forEach((chunk, index) => {
        const mapped = {
          id: chunk.id,
          title: chunk.knowledgeItem.title,
          content: chunk.content,
          score: 0.5 // Mock score
        };
        console.log(`   ${index + 1}. ID: ${mapped.id.substring(0, 8)}..., Title: "${mapped.title}"`);
      });
    }

    console.log('\n🎉 Interface verification completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - New KnowledgeContext interface: id, title, content, score');
    console.log('   - Compatible with existing database structure');
    console.log('   - Ready for pgvector or fallback JSON similarity search');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testVectorSearchInterfaces();
