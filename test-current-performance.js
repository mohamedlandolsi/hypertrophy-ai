const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

async function testCurrentPerformance() {
  try {
    console.log('🧪 TESTING CURRENT SYSTEM PERFORMANCE');
    console.log('====================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const query = 'What are the best chest exercises for muscle growth?';
    
    console.log(`🔍 Query: "${query}"`);
    console.time('⏱️  Total retrieval time');
    
    // 1. Generate query embedding
    console.time('📊 Embedding generation');
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;
    console.timeEnd('📊 Embedding generation');
    
    // 2. Get current RAG config
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { ragSimilarityThreshold: true, ragMaxChunks: true }
    });
    
    console.log(`⚙️  Current threshold: ${(config.ragSimilarityThreshold * 100).toFixed(1)}%`);
    
    // 3. Test vector search with current settings
    console.time('🔍 Database query');
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { userId: userId },
        embeddingData: { not: null }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 100 // Get more candidates for testing
    });
    console.timeEnd('🔍 Database query');
    
    // 4. Calculate similarities and apply threshold
    console.time('🧮 Similarity calculation');
    const results = [];
    for (const chunk of chunks) {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        if (similarity >= config.ragSimilarityThreshold) {
          results.push({
            similarity,
            title: chunk.knowledgeItem.title,
            chunkIndex: chunk.chunkIndex,
            preview: chunk.content.substring(0, 100) + '...'
          });
        }
      } catch (error) {
        // Skip chunks with invalid embedding data
      }
    }
    console.timeEnd('🧮 Similarity calculation');
    console.timeEnd('⏱️  Total retrieval time');
    
    // 5. Show results
    console.log(`\n📊 RESULTS:`);
    console.log(`   Chunks processed: ${chunks.length}`);
    console.log(`   Chunks above threshold: ${results.length}`);
    console.log(`   Max chunks to return: ${config.ragMaxChunks}`);
    
    if (results.length > 0) {
      console.log('\n🏆 TOP RESULTS:');
      const sortedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, config.ragMaxChunks);
      
      sortedResults.forEach((result, index) => {
        const percentage = (result.similarity * 100).toFixed(2);
        console.log(`   ${index + 1}. ${result.title} (${percentage}%)`);
        console.log(`      Chunk ${result.chunkIndex}: "${result.preview}"`);
      });
      
      // Check diversity
      const uniqueTitles = new Set(sortedResults.map(r => r.title));
      console.log(`\n📚 Knowledge diversity: ${uniqueTitles.size} unique sources`);
      
      // Specifically check for chest training content
      const chestSpecific = sortedResults.filter(r => 
        r.title.toLowerCase().includes('chest')
      );
      
      if (chestSpecific.length > 0) {
        console.log(`✅ SUCCESS: Found ${chestSpecific.length} chest-specific chunks!`);
      } else {
        console.log(`❌ ISSUE: No chest-specific content in top results`);
      }
    } else {
      console.log('❌ NO RESULTS: Vector search failed - threshold too high?');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentPerformance();
