// Simple RAG API Test
// This creates a direct test of the knowledge retrieval system

const { PrismaClient } = require('@prisma/client');
const { fallbackJsonSimilaritySearch } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

// Simple embedding generation simulation
function generateSimpleEmbedding(text) {
  // This creates a simple "embedding" based on word occurrence
  // In a real scenario, this would be done by Gemini API
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(768).fill(0);
  
  // Create a simple hash-based embedding
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const position = Math.abs(hash) % 768;
    embedding[position] = (embedding[position] || 0) + 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}

async function testSourceDiversityDirectly() {
  try {
    console.log('🔍 Testing Source Diversification Directly...\n');

    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findFirst();
    
    if (!aiConfig) {
      console.log('❌ No AI configuration found');
      return;
    }

    console.log(`📊 AI Config: maxChunks=${aiConfig.ragMaxChunks}, threshold=${aiConfig.ragSimilarityThreshold}, highThreshold=${aiConfig.ragHighRelevanceThreshold}`);

    // Test with different fitness-related queries
    const testQueries = [
      "bicep training",
      "chest exercises",
      "training volume", 
      "muscle recovery",
      "workout split"
    ];

    for (const query of testQueries) {
      console.log(`\n📋 Testing query: "${query}"`);
      console.log('─'.repeat(50));

      try {
        // Generate a simple embedding for the query
        const queryEmbedding = generateSimpleEmbedding(query);
        
        // Use the fallback JSON similarity search directly
        const results = await fallbackJsonSimilaritySearch(
          queryEmbedding,
          aiConfig.ragMaxChunks,
          aiConfig.ragHighRelevanceThreshold
        );

        console.log(`📊 Retrieved ${results.length} chunks`);
        
        if (results.length === 0) {
          console.log('❌ No results found');
          continue;
        }

        // Analyze source diversity
        const sourceCount = {};
        results.forEach(chunk => {
          const title = chunk.title;
          sourceCount[title] = (sourceCount[title] || 0) + 1;
        });

        const uniqueSources = Object.keys(sourceCount).length;
        const maxSourceCount = Math.max(...Object.values(sourceCount));
        const diversityScore = uniqueSources / Math.min(results.length, 10);
        const maxSourcePercentage = (maxSourceCount / results.length) * 100;

        console.log(`📚 Unique sources: ${uniqueSources}`);
        console.log(`📈 Diversity Score: ${diversityScore.toFixed(2)} (${diversityScore >= 0.5 ? 'Good' : 'Poor'})`);
        console.log(`📊 Max Source Dominance: ${maxSourcePercentage.toFixed(1)}% (${maxSourcePercentage <= 50 ? 'Acceptable' : 'High'})`);

        // Show source breakdown
        const sortedSources = Object.entries(sourceCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);

        console.log('🏆 Top sources:');
        sortedSources.forEach(([title, count]) => {
          const shortTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
          const percentage = ((count / results.length) * 100).toFixed(1);
          console.log(`  • ${shortTitle}: ${count} chunks (${percentage}%)`);
        });

        // Show similarity scores
        const similarities = results.map(r => r.similarity).sort((a, b) => b - a);
        console.log(`🎯 Similarity range: ${similarities[0]?.toFixed(4)} - ${similarities[similarities.length - 1]?.toFixed(4)}`);

      } catch (queryError) {
        console.log(`❌ Query Error: ${queryError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSourceDiversityDirectly();
