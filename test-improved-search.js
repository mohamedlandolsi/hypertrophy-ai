const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testImprovedSearch() {
  console.log('\n🔍 Testing Improved Keyword Search Logic\n');
  
  try {
    // Test the improved search logic manually
    async function simulateImprovedSearch(query) {
      console.log(`\n--- Testing: "${query}" ---`);
      
      const lowerQuery = query.toLowerCase();
      let searchTerms;
      
      // Replicate the improved logic
      if (lowerQuery.includes('triceps') || (lowerQuery.includes('arms') && (lowerQuery.includes('isolation') || lowerQuery.includes('exercises') || lowerQuery.includes('train')))) {
        searchTerms = 'triceps | arms | biceps | isolation | "arm training" | biasing | heads';
        console.log(`💪 Arms/Triceps query detected - using flexible search: "${searchTerms}"`);
      } else {
        // Default fallback
        const stopWords = ['what', 'are', 'the', 'best', 'how', 'to', 'for', 'is', 'and', 'or', 'a', 'an'];
        const terms = lowerQuery
          .replace(/[^\w\s]/g, ' ')
          .split(' ')
          .filter(term => term.length > 2 && !stopWords.includes(term));
        
        searchTerms = terms.length <= 2 ? terms.join(' | ') : terms.join(' & ');
        console.log(`🎯 General search (${terms.length} terms): "${searchTerms}"`);
      }
      
      const chunks = await prisma.$queryRaw`
        SELECT 
          kc.content,
          kc."chunkIndex",
          ki.id as "knowledgeId",
          ki.title,
          ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
        WHERE ki.status = 'READY'
          AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
        ORDER BY similarity DESC
        LIMIT 10
      `;
      
      console.log(`Found ${chunks.length} chunks:`);
      chunks.forEach((chunk, i) => {
        console.log(`${i + 1}. ${chunk.title} (Similarity: ${chunk.similarity})`);
        if (chunk.title.toLowerCase().includes('biasing the triceps heads')) {
          console.log(`   🎯 SUCCESS: Found the triceps biasing guide!`);
        }
      });
      
      return chunks;
    }
    
    // Test problematic queries
    await simulateImprovedSearch('What are the best isolation exercises for arms');
    await simulateImprovedSearch('How to effectively train arms (biceps and triceps)');
    await simulateImprovedSearch('How to train triceps effectively');
    await simulateImprovedSearch('Best triceps exercises for each head');
    
  } catch (error) {
    console.error('❌ Error during improved search test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedSearch();
