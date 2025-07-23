const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embedding for text using Gemini's embedding model
 */
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'
    });

    const result = await model.embedContent(text);
    
    return {
      embedding: result.embedding.values,
      text: text
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function testTitlePrefixing() {
  console.log('🧪 Testing Title Prefixing on Small Sample...\n');

  try {
    // Get just 5 chunks from different knowledge items for testing
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
      take: 5,
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Testing with ${testChunks.length} chunks:`);
    testChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. "${chunk.knowledgeItem.title}" (Chunk ${chunk.chunkIndex})`);
    });

    console.log(`\n🔄 Processing test batch...`);

    let successCount = 0;
    let errorCount = 0;

    for (const chunk of testChunks) {
      try {
        console.log(`\n📄 Processing chunk from "${chunk.knowledgeItem.title}"`);
        console.log(`   Original content: ${chunk.content.substring(0, 100)}...`);
        
        // Create prefixed content
        const prefixedContent = `${chunk.knowledgeItem.title}\n\n${chunk.content}`;
        console.log(`   Prefixed content: ${prefixedContent.substring(0, 100)}...`);
        
        // Generate new embedding
        const embeddingResult = await generateEmbedding(prefixedContent);
        console.log(`   ✅ Generated embedding with ${embeddingResult.embedding.length} dimensions`);
        
        // Update the chunk
        await prisma.knowledgeChunk.update({
          where: { id: chunk.id },
          data: {
            embeddingData: JSON.stringify(embeddingResult.embedding)
          }
        });
        
        console.log(`   ✅ Updated chunk ${chunk.id} in database`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing chunk ${chunk.id}:`, error.message);
        errorCount++;
      }

      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${((successCount / testChunks.length) * 100).toFixed(1)}%`);

    // Verify the updates
    console.log(`\n🔍 Verifying updates...`);
    const updatedChunks = await prisma.knowledgeChunk.findMany({
      where: {
        id: { in: testChunks.map(c => c.id) }
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });

    updatedChunks.forEach((chunk, i) => {
      const hasEmbedding = chunk.embeddingData !== null;
      const embeddingLength = hasEmbedding ? JSON.parse(chunk.embeddingData).length : 0;
      console.log(`   ${i + 1}. ${hasEmbedding ? '✅' : '❌'} Embedding: ${embeddingLength} dims`);
    });

    if (successCount === testChunks.length) {
      console.log(`\n🎉 Test successful! Ready to process all chunks.`);
      console.log(`\nTo apply to all chunks, run: node apply-title-prefixing.js`);
    } else {
      console.log(`\n⚠️ Test had some failures. Review errors before proceeding.`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTitlePrefixing().catch(console.error);
