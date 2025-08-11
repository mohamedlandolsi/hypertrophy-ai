const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testImprovedKeywordLogic() {
  try {
    console.log('🧪 Testing Improved Keyword Search Logic...\n');
    
    // Test the new enhanced search for "upper/lower program"
    const enhancedSearchTerms = '(upper | body) & (lower | body) & (workout | routine | structure | program)';
    
    console.log(`🔍 Enhanced search query: ${enhancedSearchTerms}`);
    
    const enhancedResults = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${enhancedSearchTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${enhancedSearchTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`📝 Enhanced search found ${enhancedResults.length} results:`);
    enhancedResults.forEach((result, i) => {
      console.log(`\n${i + 1}. "${result.title}" (similarity: ${result.similarity})`);
      console.log(`   Preview: ${result.content.substring(0, 150)}...`);
    });
    
    // Test specific lower body search
    console.log('\n' + '='.repeat(60));
    const lowerBodySearchTerms = '(lower | leg | legs) & (workout | routine | structure | exercise)';
    console.log(`🦵 Lower body search: ${lowerBodySearchTerms}`);
    
    const lowerResults = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${lowerBodySearchTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${lowerBodySearchTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`📝 Lower body search found ${lowerResults.length} results:`);
    lowerResults.forEach((result, i) => {
      console.log(`\n${i + 1}. "${result.title}" (similarity: ${result.similarity})`);
      console.log(`   Preview: ${result.content.substring(0, 150)}...`);
    });
    
    // Check if the specific guide we want appears
    const hasLowerBodyGuide = [...enhancedResults, ...lowerResults].some(r => 
      r.title.toLowerCase().includes('lower body workout')
    );
    
    if (hasLowerBodyGuide) {
      console.log('\n✅ SUCCESS: Lower Body Workout guide found in results!');
    } else {
      console.log('\n❌ ISSUE: Lower Body Workout guide still missing');
      
      // Let's see what happens with a simple search
      console.log('\n🔍 Testing simple "lower" search...');
      const simpleResults = await prisma.$queryRaw`
        SELECT 
          kc.content,
          ki.title
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
        WHERE ki.title ILIKE '%lower%'
        LIMIT 5
      `;
      
      console.log(`Simple search found ${simpleResults.length} results:`);
      simpleResults.forEach(result => {
        console.log(`- "${result.title}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing keyword logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImprovedKeywordLogic();
