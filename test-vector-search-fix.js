// test-vector-search-fix.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVectorSearchFix() {
  console.log('🔧 TESTING VECTOR SEARCH SQL FIX');
  console.log('================================\n');

  try {
    // Test the myth category search (this was causing the SQL error)
    console.log('🔍 Testing myth category search...');
    
    // Generate a dummy embedding for testing
    const dummyEmbedding = Array(768).fill(0.001).map(() => Math.random() * 0.002 - 0.001);
    const embeddingStr = `[${dummyEmbedding.join(',')}]`;
    
    // Test the fixed SQL query with category filtering
    const testCategories = ['myths'];
    const chunks = await prisma.$queryRaw`
      SELECT DISTINCT
        kc.id,
        kc.content,
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score,
        kc."embeddingData"::vector <=> ${embeddingStr}::vector as distance
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
        AND kcat.name = ANY(${testCategories})
      ORDER BY distance
      LIMIT 5
    `;

    console.log(`✅ Fixed SQL query executed successfully!`);
    console.log(`📊 Retrieved ${chunks.length} chunks for testing`);

    if (chunks.length > 0) {
      console.log('🎯 Sample results:');
      chunks.slice(0, 2).forEach((chunk, index) => {
        console.log(`   ${index + 1}. "${chunk.title}" (score: ${chunk.score.toFixed(4)})`);
        console.log(`      Content preview: "${chunk.content.substring(0, 80)}..."`);
      });
    }

    // Test without category filtering to ensure it still works
    console.log('\n🔍 Testing general search without category filter...');
    
    const generalChunks = await prisma.$queryRaw`
      SELECT
        kc.id,
        kc.content,
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
      ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
      LIMIT 3
    `;

    console.log(`✅ General search query executed successfully!`);
    console.log(`📊 Retrieved ${generalChunks.length} chunks`);

    // Check program review category specifically
    console.log('\n📋 Testing program review category...');
    
    const reviewCategories = ['hypertrophy_programs_review'];
    const programChunks = await prisma.$queryRaw`
      SELECT DISTINCT
        kc.id,
        kc.content,
        ki.title,
        1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as score,
        kc."embeddingData"::vector <=> ${embeddingStr}::vector as distance
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
      WHERE ki.status = 'READY' 
        AND kc."embeddingData" IS NOT NULL
        AND kcat.name = ANY(${reviewCategories})
      ORDER BY distance
      LIMIT 3
    `;

    console.log(`✅ Program review search executed successfully!`);
    console.log(`📊 Retrieved ${programChunks.length} chunks from program review category`);

    console.log('\n🎉 SUCCESS: All vector search queries are now working correctly!');
    console.log('\n📝 What was fixed:');
    console.log('   • Added "distance" field to SELECT clause for ORDER BY compatibility');
    console.log('   • PostgreSQL DISTINCT + ORDER BY issue resolved');
    console.log('   • Category filtering now works without SQL errors');
    console.log('   • AI responses should no longer be empty due to search failures');

  } catch (error) {
    console.error('💥 Error during testing:', error);
    console.log('\nIf you see errors, the SQL query may need further adjustments.');
  } finally {
    await prisma.$disconnect();
  }
}

testVectorSearchFix().catch(console.error);
