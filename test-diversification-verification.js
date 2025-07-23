const { PrismaClient } = require('@prisma/client');
const { fallbackJsonSimilaritySearch } = require('./src/lib/vector-search');
const { generateEmbedding } = require('./src/lib/gemini');

const prisma = new PrismaClient();

async function testSourceDiversification() {
  try {
    console.log('🔍 Testing Source Diversification in Vector Search...\n');

    // Test query: "bicep training"
    const query = "bicep training";
    console.log(`Query: "${query}"`);
    
    // Generate embedding for query
    console.log('📊 Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      console.log('❌ Failed to generate embedding');
      return;
    }

    console.log('✅ Query embedding generated successfully');

    // Test with different configurations
    const testConfigs = [
      { limit: 5, similarityThreshold: 0.65, name: "5 chunks, 0.65 threshold" },
      { limit: 10, similarityThreshold: 0.65, name: "10 chunks, 0.65 threshold" },
      { limit: 15, similarityThreshold: 0.60, name: "15 chunks, 0.60 threshold" },
      { limit: 20, similarityThreshold: 0.55, name: "20 chunks, 0.55 threshold" }
    ];

    for (const config of testConfigs) {
      console.log(`\n📋 Testing: ${config.name}`);
      console.log('─'.repeat(50));
      
      const results = await fallbackJsonSimilaritySearch(
        queryEmbedding, 
        config.limit, 
        config.similarityThreshold
      );

      console.log(`📊 Retrieved ${results.length} chunks`);
      
      if (results.length === 0) {
        console.log('❌ No results found');
        continue;
      }

      // Analyze source diversity
      const sourceCount = {};
      const sourceChunks = {};
      
      results.forEach((chunk, index) => {
        const title = chunk.knowledgeItem?.title || 'Unknown';
        const shortTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
        
        if (!sourceCount[shortTitle]) {
          sourceCount[shortTitle] = 0;
          sourceChunks[shortTitle] = [];
        }
        sourceCount[shortTitle]++;
        sourceChunks[shortTitle].push({
          index: index + 1,
          chunkIndex: chunk.chunkIndex,
          similarity: chunk.similarity?.toFixed(4) || 'N/A'
        });
      });

      console.log(`📚 Sources represented: ${Object.keys(sourceCount).length}`);
      
      // Show source breakdown
      Object.entries(sourceCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([source, count]) => {
          const percentage = ((count / results.length) * 100).toFixed(1);
          console.log(`  • ${source}: ${count} chunks (${percentage}%)`);
          
          // Show first few chunks from this source
          const chunks = sourceChunks[source].slice(0, 3);
          chunks.forEach(chunk => {
            console.log(`    - Chunk ${chunk.chunkIndex} (pos ${chunk.index}, sim: ${chunk.similarity})`);
          });
          if (sourceChunks[source].length > 3) {
            console.log(`    - ... and ${sourceChunks[source].length - 3} more`);
          }
        });

      // Calculate diversity score
      const diversityScore = Object.keys(sourceCount).length / Math.min(results.length, 10);
      console.log(`📈 Diversity Score: ${diversityScore.toFixed(2)} (${diversityScore >= 0.5 ? 'Good' : 'Poor'} diversity)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSourceDiversification();
