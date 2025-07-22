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

async function testDirectVectorSearch() {
  try {
    console.log('🧪 TESTING DIRECT VECTOR SEARCH');
    console.log('================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const query = 'What are the best chest exercises for muscle growth?';
    
    console.log(`🔍 Query: "${query}"`);
    console.time('⏱️  Vector search timing');
    
    // 1. Generate query embedding
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;
    
    // 2. Get RAG configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { 
        ragSimilarityThreshold: true, 
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true
      }
    });
    
    console.log(`⚙️  Config: ${(config.ragSimilarityThreshold * 100).toFixed(1)}% threshold, ${config.ragMaxChunks} max chunks`);
    
    // 3. Get ALL chunks for the user
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { userId: userId },
        embeddingData: { not: null }
      },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    console.log(`📚 Processing ${chunks.length} chunks...`);
    
    // 4. Calculate similarities and apply threshold
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
            content: chunk.content
          });
        }
      } catch (error) {
        // Skip invalid chunks
      }
    }
    
    console.timeEnd('⏱️  Vector search timing');
    
    // 5. Sort and take top results
    const topResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.ragMaxChunks);
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   Total matching chunks: ${results.length}`);
    console.log(`   Returning top: ${topResults.length}`);
    
    if (topResults.length > 0) {
      console.log('\n🏆 TOP MATCHES:');
      topResults.forEach((result, index) => {
        const percentage = (result.similarity * 100).toFixed(2);
        console.log(`   ${index + 1}. ${result.title} (${percentage}%)`);
        console.log(`      Chunk ${result.chunkIndex}: "${result.content.substring(0, 120)}..."`);
        
        if (result.title.toLowerCase().includes('chest')) {
          console.log('      ✅ CHEST-SPECIFIC CONTENT!');
        }
      });
      
      // Check for chest content in results
      const chestResults = topResults.filter(r => r.title.toLowerCase().includes('chest'));
      const foundationalResults = topResults.filter(r => r.title.toLowerCase().includes('foundational'));
      
      console.log(`\n📚 Content breakdown:`);
      console.log(`   Chest-specific: ${chestResults.length}`);
      console.log(`   Foundational: ${foundationalResults.length}`);
      console.log(`   Other: ${topResults.length - chestResults.length - foundationalResults.length}`);
      
      if (chestResults.length > 0) {
        console.log('\n✅ SUCCESS: Chest-specific content found in top results!');
      } else {
        console.log('\n❌ ISSUE: No chest-specific content in top results despite good similarity scores');
        
        // Find the best chest match that didn't make it
        const allChestResults = results.filter(r => r.title.toLowerCase().includes('chest'));
        if (allChestResults.length > 0) {
          const bestChest = allChestResults.sort((a, b) => b.similarity - a.similarity)[0];
          const percentage = (bestChest.similarity * 100).toFixed(2);
          console.log(`   Best chest match was: ${percentage}% - "${bestChest.title}"`);
        }
      }
    } else {
      console.log('\n❌ NO RESULTS: No chunks passed the similarity threshold');
      
      // Show what the best matches would have been
      console.log('\n🔍 Top 5 matches regardless of threshold:');
      const allResults = [];
      for (const chunk of chunks.slice(0, 100)) { // Test first 100 for performance
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          allResults.push({
            similarity,
            title: chunk.knowledgeItem.title,
            chunkIndex: chunk.chunkIndex
          });
        } catch (error) {
          // Skip invalid chunks
        }
      }
      
      allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .forEach((result, index) => {
          const percentage = (result.similarity * 100).toFixed(2);
          console.log(`   ${index + 1}. ${percentage}% - ${result.title}`);
        });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectVectorSearch();
