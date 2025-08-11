const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRAGRetrieval() {
  console.log('\n🔍 Testing RAG Retrieval for Triceps Queries\n');
  
  try {
    // Simulate the keyword search logic from vector-search.ts
    async function simulateKeywordSearch(query, limit = 10) {
      console.log(`\n--- Simulating keyword search for: "${query}" ---`);
      
      // Extract individual words from the query
      const words = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      console.log(`Keywords extracted: [${words.join(', ')}]`);
      
      // Build the search conditions
      const searchConditions = [];
      
      for (const word of words) {
        searchConditions.push(
          { content: { contains: word, mode: 'insensitive' } }
        );
      }
      
      // Add some muscle group specific terms
      if (query.toLowerCase().includes('triceps') || query.toLowerCase().includes('arms')) {
        searchConditions.push(
          { content: { contains: 'triceps', mode: 'insensitive' } },
          { content: { contains: 'biasing', mode: 'insensitive' } }
        );
      }
      
      console.log(`Search conditions: ${searchConditions.length} conditions`);
      
      const results = await prisma.knowledgeChunk.findMany({
        where: {
          OR: searchConditions
        },
        include: {
          knowledgeItem: {
            select: {
              title: true,
              type: true
            }
          }
        },
        take: limit
      });
      
      console.log(`Found ${results.length} chunks`);
      
      // Check if triceps biasing guide is in results
      const biasGuideFound = results.some(chunk => 
        chunk.knowledgeItem.title.toLowerCase().includes('biasing the triceps heads')
      );
      
      console.log(`🎯 "Biasing the Triceps Heads" guide found: ${biasGuideFound ? '✅ YES' : '❌ NO'}`);
      
      results.forEach((chunk, i) => {
        console.log(`${i + 1}. ${chunk.knowledgeItem.title}`);
        if (chunk.knowledgeItem.title.toLowerCase().includes('biasing')) {
          console.log(`   🎯 THIS IS THE TRICEPS BIASING GUIDE!`);
        }
      });
      
      return results;
    }
    
    // Test queries that should retrieve the triceps guide
    const testQueries = [
      'What are the best isolation exercises for arms',
      'How to effectively train arms (biceps and triceps)',
      'How to train triceps effectively',
      'Triceps training for complete development',
      'Best triceps exercises for each head'
    ];
    
    for (const query of testQueries) {
      await simulateKeywordSearch(query, 10);
      console.log('─'.repeat(60));
    }
    
  } catch (error) {
    console.error('❌ Error during RAG retrieval test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRAGRetrieval();
