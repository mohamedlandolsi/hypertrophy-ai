const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test the cosine similarity function directly
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

async function testTwoStepRetrieval() {
  console.log('🧪 Testing Two-Step Retrieval Logic...\n');

  try {
    // Get a sample of chunks with embeddings
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
      take: 50 // Limit for testing
    });

    console.log(`📊 Found ${chunks.length} chunks to test with`);

    if (chunks.length === 0) {
      console.log('❌ No chunks with embeddings found');
      return;
    }

    // Create a mock query embedding (use the first chunk's embedding as query)
    const mockQueryEmbedding = JSON.parse(chunks[0].embeddingData);
    console.log(`🔍 Using mock query with ${mockQueryEmbedding.length} dimensions`);

    // Calculate similarities
    const similarities = chunks.map(chunk => {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingData);
        const similarity = cosineSimilarity(mockQueryEmbedding, chunkEmbedding);
        
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

    // Test two-step retrieval parameters
    const topK = 8;
    const highRelevanceThreshold = 0.65;
    const broadTopK = Math.max(topK * 3, 15);

    console.log(`\n🔍 Two-Step Retrieval Test:`);
    console.log(`- Target topK: ${topK}`);
    console.log(`- High relevance threshold: ${highRelevanceThreshold}`);
    console.log(`- Broad retrieval: ${broadTopK} chunks`);

    // Step 1: Fetch broader results
    const broadResults = sortedSimilarities.slice(0, broadTopK);
    console.log(`\n📊 Step 1 - Broad Retrieval:`);
    console.log(`- Retrieved: ${broadResults.length} chunks`);
    console.log(`- Similarity range: ${(broadResults[broadResults.length-1].similarity * 100).toFixed(1)}% - ${(broadResults[0].similarity * 100).toFixed(1)}%`);

    // Step 2: Filter by high relevance threshold
    const highRelevanceResults = broadResults.filter(
      chunk => chunk.similarity >= highRelevanceThreshold
    );
    
    console.log(`\n📊 Step 2 - High Relevance Filtering:`);
    console.log(`- High relevance chunks: ${highRelevanceResults.length}`);
    console.log(`- Filtered out: ${broadResults.length - highRelevanceResults.length} chunks`);

    // Final results
    const finalResults = highRelevanceResults.slice(0, topK);
    console.log(`\n📊 Final Results:`);
    console.log(`- Returned: ${finalResults.length} chunks`);

    if (finalResults.length > 0) {
      console.log(`\n🔍 Top results:`);
      finalResults.forEach((chunk, i) => {
        console.log(`${i + 1}. ${chunk.title} - ${(chunk.similarity * 100).toFixed(1)}%`);
      });

      // Group by knowledge item
      const groupedChunks = finalResults.reduce((groups, chunk) => {
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
        console.log(`- ${title}: ${chunks.length} chunks, avg: ${(avgSimilarity * 100).toFixed(1)}%`);
      });
    }

    console.log('\n✅ Two-step retrieval test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTwoStepRetrieval().catch(console.error);
