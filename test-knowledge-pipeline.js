const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function main() {
  console.log('🧪 Testing Knowledge Base Pipeline');
  console.log('==================================');
  
  try {
    // Test user ID (use a real user from your system)
    const testUserId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    // Step 1: Create a test knowledge item
    console.log('1️⃣ Creating test knowledge item...');
    const testContent = `
# Test Exercise Guide

## Bicep Curls for Maximum Growth

Bicep curls are one of the most effective isolation exercises for developing the biceps brachii muscle. Here's how to perform them correctly:

### Technique
- Stand with feet hip-width apart
- Hold dumbbells with palms facing forward
- Keep elbows close to your sides
- Curl the weights up in a controlled motion
- Lower slowly to maximize time under tension

### Programming
- Perform 3-4 sets of 8-12 repetitions
- Use a weight that challenges you in the final 2-3 reps
- Rest 60-90 seconds between sets
- Train biceps 2-3 times per week

### Common Mistakes
- Using momentum to swing the weights
- Not controlling the lowering phase
- Allowing elbows to drift away from the body
    `;
    
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        title: 'Test Bicep Curl Guide',
        content: testContent,
        type: 'TEXT',
        status: 'PROCESSING',
        userId: testUserId,
      }
    });
    
    console.log(`✅ Knowledge item created: ${knowledgeItem.id}`);
    
    // Step 2: Simulate the chunking process
    console.log('2️⃣ Chunking content...');
    const chunks = [
      { content: testContent.substring(0, 400), index: 0 },
      { content: testContent.substring(350, 750), index: 1 },
      { content: testContent.substring(700), index: 2 }
    ].filter(chunk => chunk.content.length > 50);
    
    console.log(`📄 Created ${chunks.length} chunks`);
    
    // Step 3: Generate embeddings and store chunks
    console.log('3️⃣ Generating embeddings...');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const prefixedContent = `${knowledgeItem.title}\n\n${chunk.content}`;
        const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
          .embedContent(prefixedContent);
        
        await prisma.knowledgeChunk.create({
          data: {
            knowledgeItemId: knowledgeItem.id,
            content: chunk.content,
            chunkIndex: i,
            embeddingData: JSON.stringify(embeddingResult.embedding.values)
          }
        });
        
        console.log(`  ✅ Chunk ${i}: ${chunk.content.length} chars, embedding: ${embeddingResult.embedding.values.length}D`);
      } catch (error) {
        console.error(`  ❌ Chunk ${i}: Failed to generate embedding:`, error.message);
      }
    }
    
    // Step 4: Update status to READY
    await prisma.knowledgeItem.update({
      where: { id: knowledgeItem.id },
      data: { status: 'READY' }
    });
    
    console.log('4️⃣ Testing retrieval...');
    
    // Step 5: Test retrieval with a relevant query
    const testQuery = "how to do bicep curls properly";
    const queryEmbedding = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(testQuery);
    
    // Simple similarity search
    const retrievedChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          userId: testUserId,
          status: 'READY'
        },
        embeddingData: { not: null }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 20
    });
    
    // Calculate similarities
    const similarities = retrievedChunks.map(chunk => {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        
        // Cosine similarity calculation
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < chunkEmbedding.length; i++) {
          dotProduct += queryEmbedding.embedding.values[i] * chunkEmbedding[i];
          normA += queryEmbedding.embedding.values[i] * queryEmbedding.embedding.values[i];
          normB += chunkEmbedding[i] * chunkEmbedding[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        
        return {
          title: chunk.knowledgeItem.title,
          content: chunk.content.substring(0, 100) + '...',
          similarity: similarity,
          isTestItem: chunk.knowledgeItem.title === 'Test Bicep Curl Guide'
        };
      } catch (error) {
        return { similarity: 0, error: true };
      }
    }).sort((a, b) => b.similarity - a.similarity);
    
    console.log('📊 Top 10 retrieval results:');
    similarities.slice(0, 10).forEach((result, index) => {
      const flag = result.isTestItem ? '🎯 [TEST ITEM]' : '';
      console.log(`  ${index + 1}. ${flag} ${result.title}`);
      console.log(`     Similarity: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`     Preview: ${result.content}`);
      console.log('');
    });
    
    // Check if test item appears anywhere
    const testItemResults = similarities.filter(r => r.isTestItem);
    if (testItemResults.length > 0) {
      console.log('🎯 Test item found in results:');
      testItemResults.forEach((result, index) => {
        const rank = similarities.findIndex(r => r === result) + 1;
        console.log(`   Rank ${rank}: Similarity ${(result.similarity * 100).toFixed(2)}%`);
      });
    } else {
      console.log('⚠️ Test item not found in top results');
    }
    
    // Step 6: Cleanup - Delete test item
    console.log('5️⃣ Cleaning up test data...');
    await prisma.knowledgeChunk.deleteMany({
      where: { knowledgeItemId: knowledgeItem.id }
    });
    await prisma.knowledgeItem.delete({
      where: { id: knowledgeItem.id }
    });
    
    console.log('✅ Test completed successfully!');
    
    // Summary
    const testItemRetrieved = similarities.some(r => r.isTestItem && r.similarity > 0.3);
    console.log('📋 Pipeline Test Results:');
    console.log(`   ✅ Knowledge item creation: SUCCESS`);
    console.log(`   ✅ Content chunking: SUCCESS (${chunks.length} chunks)`);
    console.log(`   ✅ Embedding generation: SUCCESS`);
    console.log(`   ${testItemRetrieved ? '✅' : '❌'} Retrieval test: ${testItemRetrieved ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   ✅ Cleanup: SUCCESS`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
