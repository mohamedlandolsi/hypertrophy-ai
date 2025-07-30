const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Exact copy of the production cosine similarity function
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Exact copy of the production optimizedJsonSimilaritySearch function
async function exactProductionSearch(queryEmbedding, topK, highRelevanceThreshold) {
  try {
    console.log(`🚀 Starting EXACT production similarity search for top ${topK} chunks`);
    const searchStart = Date.now();
    
    // Process chunks in smaller batches for better performance
    const batchSize = 50; // Process 50 chunks at a time
    let allSimilarities = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📦 Processing batch at offset ${offset}`);
      
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          embeddingData: { not: null },
          knowledgeItem: {
            status: 'READY'
          }
        },
        include: {
          knowledgeItem: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: batchSize,
        skip: offset
      });
      
      if (chunks.length === 0) {
        hasMore = false;
        continue;
      }
      
      console.log(`   Found ${chunks.length} chunks in this batch`);
      
      // Calculate similarities for this batch
      const batchSimilarities = chunks.map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embeddingData);
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          return { chunk, similarity };
        } catch (error) {
          console.error(`❌ Error parsing embedding for chunk ${chunk.id}:`, error);
          return { chunk, similarity: 0 };
        }
      });
      
      allSimilarities.push(...batchSimilarities);
      offset += batchSize;
      
      // Stop early if we have enough high-quality results
      if (allSimilarities.length >= topK * 3) {
        console.log(`🎯 Early stopping: processed ${allSimilarities.length} chunks`);
        break;
      }
    }
    
    // Apply relevance threshold filter
    const thresholdToUse = highRelevanceThreshold || 0.3;
    console.log(`🎯 Applying threshold: ${thresholdToUse}`);
    
    const filteredSimilarities = allSimilarities.filter(item => item.similarity >= thresholdToUse);
    console.log(`📊 ${filteredSimilarities.length} chunks passed threshold out of ${allSimilarities.length} total`);
    
    // Sort by similarity and take top K
    const sortedResults = filteredSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    // Transform to expected format
    const results = sortedResults.map(item => ({
      content: item.chunk.content,
      knowledgeId: item.chunk.knowledgeItem.id,
      title: item.chunk.knowledgeItem.title,
      similarity: item.similarity,
      chunkIndex: item.chunk.chunkIndex
    }));
    
    const searchTime = Date.now() - searchStart;
    console.log(`✅ Production similarity search completed in ${searchTime}ms - found ${results.length} relevant chunks`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error in production similarity search:', error);
    throw error;
  }
}

async function testExactProductionLogic() {
  console.log('🧪 Testing Exact Production RAG Logic...');
  
  try {
    // Get AI configuration (exactly as production does)
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log('\n📋 Using production configuration:');
    console.log('- ragMaxChunks:', config.ragMaxChunks);
    console.log('- ragHighRelevanceThreshold:', config.ragHighRelevanceThreshold);
    
    // Test query
    const query = "What is a deload week?";
    console.log(`\n🔍 Testing query: "${query}"`);
    
    // Generate embedding (exactly as production does)
    const embeddingResult = await genAI.getGenerativeModel({ model: "text-embedding-004" })
      .embedContent(query);
    const queryEmbedding = embeddingResult.embedding.values;
    
    console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`);
    
    // Run exact production search
    const results = await exactProductionSearch(
      queryEmbedding,
      config.ragMaxChunks,
      config.ragHighRelevanceThreshold
    );
    
    console.log(`\n🎯 Production Results (${results.length} chunks):`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.similarity.toFixed(3)} - ${result.title}`);
      if (result.title.toLowerCase().includes('deload')) {
        console.log(`   ✅ DELOAD ARTICLE FOUND!`);
      }
    });
    
    // Show what knowledge context would be built
    if (results.length > 0) {
      const contextText = results.map(r => r.content).join('\n\n');
      console.log(`\n📋 Knowledge Context Preview:`);
      console.log(contextText.substring(0, 500) + '...');
    } else {
      console.log('\n❌ NO RESULTS - This explains why the AI gives generic responses!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testExactProductionLogic();
