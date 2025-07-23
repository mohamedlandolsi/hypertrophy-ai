const { PrismaClient } = require('@prisma/client');
const { generateEmbedding } = require('./src/lib/vector-embeddings');
const { fetchRelevantKnowledge } = require('./src/lib/vector-search');

async function testNewRagSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing New RAG System...\n');
    
    // Test query
    const testQuery = "How to train chest effectively?";
    console.log(`📝 Test Query: "${testQuery}"`);
    
    // Step 1: Generate query embedding
    console.log('\n🔍 Step 1: Generating query embedding...');
    const embeddingResult = await generateEmbedding(testQuery);
    console.log(`✅ Generated embedding with ${embeddingResult.embedding.length} dimensions`);
    
    // Step 2: Fetch relevant knowledge
    console.log('\n🔍 Step 2: Fetching relevant knowledge...');
    const startTime = Date.now();
    const relevantChunks = await fetchRelevantKnowledge(embeddingResult.embedding, 5);
    const endTime = Date.now();
    
    console.log(`✅ Found ${relevantChunks.length} relevant chunks in ${endTime - startTime}ms`);
    
    // Step 3: Display results
    if (relevantChunks.length > 0) {
      console.log('\n📚 Retrieved Knowledge:');
      relevantChunks.forEach((chunk, index) => {
        console.log(`\n${index + 1}. ${chunk.title} (${(chunk.similarity * 100).toFixed(1)}% similarity)`);
        console.log(`   Content: ${chunk.content.substring(0, 150)}${chunk.content.length > 150 ? '...' : ''}`);
        console.log(`   Chunk Index: ${chunk.chunkIndex}`);
      });
      
      // Group by knowledge item
      const groupedByItem = relevantChunks.reduce((groups, chunk) => {
        if (!groups[chunk.knowledgeId]) {
          groups[chunk.knowledgeId] = [];
        }
        groups[chunk.knowledgeId].push(chunk);
        return groups;
      }, {});
      
      console.log(`\n📊 Knowledge Items Retrieved: ${Object.keys(groupedByItem).length}`);
      Object.entries(groupedByItem).forEach(([itemId, chunks]) => {
        const title = chunks[0].title;
        const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
        console.log(`   - ${title}: ${chunks.length} chunks, avg similarity ${(avgSimilarity * 100).toFixed(1)}%`);
      });
      
    } else {
      console.log('\n⚠️ No relevant chunks found');
    }
    
    console.log('\n✅ RAG System Test Complete!');
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNewRagSystem();
