// Test Source Diversification in Vector Search
// Run from project root: node test-source-diversity-final.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Copy of the cosineSimilarity function from vector-search.ts
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Simplified version of fallbackJsonSimilaritySearch for testing
async function testSourceDiversification(queryEmbedding, topK, highRelevanceThreshold) {
  try {
    // Fetch all chunks with JSON embeddings
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
      }
    });

    // Calculate cosine similarity
    const similarities = chunks.map(chunk => {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        return {
          content: chunk.content,
          knowledgeId: chunk.knowledgeItem.id,
          title: chunk.knowledgeItem.title,
          similarity,
          chunkIndex: chunk.chunkIndex
        };
      } catch (parseError) {
        console.error('Error parsing embedding data:', parseError);
        return null;
      }
    }).filter(Boolean);

    // Sort by similarity descending
    const sortedSimilarities = similarities.sort((a, b) => b.similarity - a.similarity);

    // Step 1: Fetch a larger pool for source diversification (3x topK, minimum 15)
    const initialFetchLimit = Math.max(topK * 3, 15);
    let candidateChunks = sortedSimilarities.slice(0, initialFetchLimit);

    // Step 2: Apply high relevance threshold filtering if provided
    if (highRelevanceThreshold !== undefined) {
      candidateChunks = candidateChunks.filter(
        chunk => chunk.similarity >= highRelevanceThreshold
      );
      
      console.log(`🔍 High relevance filtering: ${sortedSimilarities.length} total → ${candidateChunks.length} above threshold ${highRelevanceThreshold}`);
    }

    // Step 3: Implement source diversification to prevent chunk dominance
    const diversifiedChunks = [];
    const seenKnowledgeIds = new Set();

    // First pass: Get the best chunk from each unique knowledge item
    for (const chunk of candidateChunks) {
      if (diversifiedChunks.length >= topK) {
        break; // Stop once we have enough chunks
      }

      if (!seenKnowledgeIds.has(chunk.knowledgeId)) {
        diversifiedChunks.push(chunk);
        seenKnowledgeIds.add(chunk.knowledgeId);
      }
    }

    // Second pass: If we still have room, fill with highest similarity chunks
    // regardless of source (but avoid duplicates)
    if (diversifiedChunks.length < topK) {
      const remainingChunks = candidateChunks.filter(chunk =>
        !diversifiedChunks.some(dc => 
          dc.content === chunk.content && 
          dc.knowledgeId === chunk.knowledgeId
        )
      );

      const needed = topK - diversifiedChunks.length;
      diversifiedChunks.push(...remainingChunks.slice(0, needed));
    }

    console.log(`🔍 Source diversification: ${diversifiedChunks.length} chunks from ${seenKnowledgeIds.size} unique sources`);
    
    // Log source distribution for debugging
    const sourceDistribution = diversifiedChunks.reduce((dist, chunk) => {
      dist[chunk.title] = (dist[chunk.title] || 0) + 1;
      return dist;
    }, {});
    
    console.log(`📊 Source distribution:`, sourceDistribution);

    return {
      chunks: diversifiedChunks,
      totalCandidates: candidateChunks.length,
      uniqueSources: seenKnowledgeIds.size,
      sourceDistribution
    };

  } catch (error) {
    console.error('❌ Test error:', error);
    return null;
  }
}

async function runSourceDiversityTest() {
  try {
    console.log('🔍 Testing Source Diversification in Vector Search...\n');

    // Get a sample embedding from the database to use as query
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        embeddingData: { not: null }
      }
    });

    if (!sampleChunk) {
      console.log('❌ No chunks with embeddings found');
      return;
    }

    const queryEmbedding = JSON.parse(sampleChunk.embeddingData);
    console.log(`📊 Using sample embedding as query (${queryEmbedding.length} dimensions)`);

    // Test with different configurations
    const testConfigs = [
      { topK: 5, threshold: 0.65, name: "5 chunks, 0.65 threshold" },
      { topK: 10, threshold: 0.65, name: "10 chunks, 0.65 threshold" },
      { topK: 15, threshold: 0.60, name: "15 chunks, 0.60 threshold" },
      { topK: 20, threshold: 0.55, name: "20 chunks, 0.55 threshold" },
      { topK: 10, threshold: undefined, name: "10 chunks, no threshold" }
    ];

    for (const config of testConfigs) {
      console.log(`\n📋 Testing: ${config.name}`);
      console.log('─'.repeat(50));
      
      const result = await testSourceDiversification(
        queryEmbedding, 
        config.topK, 
        config.threshold
      );

      if (!result) {
        console.log('❌ Test failed');
        continue;
      }

      console.log(`📊 Retrieved ${result.chunks.length} chunks from ${result.uniqueSources} sources`);
      console.log(`📚 Total candidates considered: ${result.totalCandidates}`);
      
      if (result.chunks.length === 0) {
        console.log('❌ No results found');
        continue;
      }

      // Show source breakdown
      const sortedSources = Object.entries(result.sourceDistribution)
        .sort(([,a], [,b]) => b - a);

      sortedSources.forEach(([source, count]) => {
        const percentage = ((count / result.chunks.length) * 100).toFixed(1);
        const shortTitle = source.length > 60 ? source.substring(0, 60) + '...' : source;
        console.log(`  • ${shortTitle}: ${count} chunks (${percentage}%)`);
      });

      // Calculate diversity metrics
      const diversityScore = result.uniqueSources / Math.min(result.chunks.length, 10);
      const maxSourcePercentage = Math.max(...Object.values(result.sourceDistribution)) / result.chunks.length;
      
      console.log(`📈 Diversity Score: ${diversityScore.toFixed(2)} (${diversityScore >= 0.5 ? 'Good' : 'Poor'} diversity)`);
      console.log(`📊 Max Source Dominance: ${(maxSourcePercentage * 100).toFixed(1)}% (${maxSourcePercentage <= 0.5 ? 'Acceptable' : 'High'} dominance)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSourceDiversityTest();
