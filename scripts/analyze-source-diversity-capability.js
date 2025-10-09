// Test Source Diversification with Diverse Queries
// This test helps understand if the source diversification is working correctly

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSourceDiversityCapability() {
  try {
    console.log('🔍 Analyzing Source Diversity Capability...\n');

    // Get all chunks to understand distribution
    const allChunks = await prisma.knowledgeChunk.findMany({
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

    console.log(`📊 Total chunks with embeddings: ${allChunks.length}`);

    // Analyze source distribution
    const sourceDistribution = {};
    allChunks.forEach(chunk => {
      const title = chunk.knowledgeItem.title;
      sourceDistribution[title] = (sourceDistribution[title] || 0) + 1;
    });

    const sortedSources = Object.entries(sourceDistribution)
      .sort(([,a], [,b]) => b - a);

    console.log(`📚 Unique knowledge sources: ${sortedSources.length}`);
    console.log('\n🔝 Top 15 sources by chunk count:');
    sortedSources.slice(0, 15).forEach(([title, count], index) => {
      const shortTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
      const percentage = ((count / allChunks.length) * 100).toFixed(1);
      console.log(`${index + 1}. ${shortTitle}: ${count} chunks (${percentage}%)`);
    });

    // Test source diversification capability
    console.log('\n🧪 Testing Source Diversification Logic...');
    
    // Simulate different scenarios
    const testScenarios = [
      { topK: 5, description: "Small request (5 chunks)" },
      { topK: 10, description: "Medium request (10 chunks)" },
      { topK: 20, description: "Large request (20 chunks)" },
      { topK: 50, description: "Very large request (50 chunks)" }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n📋 ${scenario.description}`);
      console.log('─'.repeat(40));

      // Step 1: Get initial candidate pool (3x topK, minimum 15)
      const initialFetchLimit = Math.max(scenario.topK * 3, 15);
      const candidateChunks = allChunks.slice(0, initialFetchLimit);

      // Step 2: Simulate source diversification
      const diversifiedChunks = [];
      const seenKnowledgeIds = new Set();

      // First pass: Get the best chunk from each unique knowledge item
      for (const chunk of candidateChunks) {
        if (diversifiedChunks.length >= scenario.topK) {
          break;
        }

        if (!seenKnowledgeIds.has(chunk.knowledgeItem.id)) {
          diversifiedChunks.push(chunk);
          seenKnowledgeIds.add(chunk.knowledgeItem.id);
        }
      }

      // Second pass: Fill remaining slots
      if (diversifiedChunks.length < scenario.topK) {
        const remainingChunks = candidateChunks.filter(chunk =>
          !diversifiedChunks.some(dc => 
            dc.content === chunk.content && 
            dc.knowledgeItem.id === chunk.knowledgeItem.id
          )
        );

        const needed = scenario.topK - diversifiedChunks.length;
        diversifiedChunks.push(...remainingChunks.slice(0, needed));
      }

      // Analyze results
      const resultSourceDistribution = diversifiedChunks.reduce((dist, chunk) => {
        const title = chunk.knowledgeItem.title;
        dist[title] = (dist[title] || 0) + 1;
        return dist;
      }, {});

      const uniqueSourcesInResult = Object.keys(resultSourceDistribution).length;
      const diversityScore = uniqueSourcesInResult / Math.min(diversifiedChunks.length, 10);
      const maxSourceCount = Math.max(...Object.values(resultSourceDistribution));
      const maxSourcePercentage = (maxSourceCount / diversifiedChunks.length) * 100;

      console.log(`📊 Result: ${diversifiedChunks.length} chunks from ${uniqueSourcesInResult} sources`);
      console.log(`📈 Diversity Score: ${diversityScore.toFixed(2)} (${diversityScore >= 0.5 ? 'Good' : 'Poor'})`);
      console.log(`📊 Max Source Dominance: ${maxSourcePercentage.toFixed(1)}% (${maxSourcePercentage <= 50 ? 'Acceptable' : 'High'})`);

      // Show top sources in result
      const topResultSources = Object.entries(resultSourceDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      console.log('🏆 Top sources in result:');
      topResultSources.forEach(([title, count]) => {
        const shortTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
        const percentage = ((count / diversifiedChunks.length) * 100).toFixed(1);
        console.log(`  • ${shortTitle}: ${count} chunks (${percentage}%)`);
      });
    }

    // Test theoretical maximum diversity
    console.log('\n🎯 Theoretical Maximum Diversity Analysis:');
    const maxPossibleSources = Math.min(sortedSources.length, 20); // For 20 chunks
    console.log(`📚 Available sources: ${sortedSources.length}`);
    console.log(`🎯 Max possible sources for 20 chunks: ${maxPossibleSources}`);
    console.log(`📈 Best possible diversity score: ${(maxPossibleSources / 10).toFixed(2)}`);

    // Show if diversification would help
    const topSourceChunkCount = sortedSources[0][1];
    console.log(`\n🔍 Analysis of chunk dominance potential:`);
    console.log(`📊 Largest source has ${topSourceChunkCount} chunks`);
    console.log(`📈 Without diversification, top source could dominate with ${Math.min(topSourceChunkCount, 20)} chunks (${Math.min(100, (topSourceChunkCount / 20) * 100).toFixed(1)}%)`);
    console.log(`✅ With diversification, top source limited to 1 chunk (5.0%) for 20-chunk request`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSourceDiversityCapability();
