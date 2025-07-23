const { PrismaClient } = require('@prisma/client');
const { generateEmbedding } = require('./src/lib/vector-embeddings');
const { fetchRelevantKnowledge } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

async function testVectorSearchDirectly() {
  console.log('🧪 Testing Vector Search Directly...\n');

  try {
    const testQuery = "chest exercises";
    console.log(`🔍 Query: "${testQuery}"`);

    // Step 1: Generate query embedding
    console.log('🔄 Generating query embedding...');
    const queryEmbeddingResult = await generateEmbedding(testQuery);
    console.log('✅ Query embedding generated');

    // Step 2: Test vector search with two-step retrieval
    console.log('🔍 Testing fetchRelevantKnowledge...');
    const maxChunks = 8;
    const highRelevanceThreshold = 0.65;
    
    const relevantChunks = await fetchRelevantKnowledge(
      queryEmbeddingResult.embedding,
      maxChunks,
      highRelevanceThreshold
    );

    console.log(`\n📊 Results:`);
    console.log(`- Found ${relevantChunks.length} relevant chunks`);

    if (relevantChunks.length > 0) {
      console.log(`\n🔍 Top chunks:`);
      relevantChunks.forEach((chunk, i) => {
        console.log(`\n--- Chunk ${i + 1} ---`);
        console.log(`Title: ${chunk.title}`);
        console.log(`Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
        console.log(`Content preview: ${chunk.content.substring(0, 100)}...`);
      });

      // Test grouping by knowledge item
      const groupedChunks = relevantChunks.reduce((groups, chunk) => {
        if (!groups[chunk.knowledgeId]) {
          groups[chunk.knowledgeId] = {
            title: chunk.title,
            chunks: []
          };
        }
        groups[chunk.knowledgeId].chunks.push(chunk);
        return groups;
      }, {});

      console.log(`\n📚 Grouped by knowledge items:`);
      Object.entries(groupedChunks).forEach(([knowledgeId, { title, chunks }]) => {
        const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
        console.log(`- ${title}: ${chunks.length} chunks, avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
      });
    }

    console.log('\n✅ Vector search test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVectorSearchDirectly().catch(console.error);
