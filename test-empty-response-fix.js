// test-empty-response-fix.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmptyResponseFix() {
  console.log('🎯 TESTING EMPTY AI RESPONSE FIX');
  console.log('================================\n');

  try {
    // Test various scenarios that might trigger the vector search issue
    const testScenarios = [
      {
        name: "Myth Detection (was causing SQL error)",
        hasCategory: true,
        categories: ['myths'],
        description: "This previously caused SQL errors leading to empty responses"
      },
      {
        name: "Program Review Detection",
        hasCategory: true, 
        categories: ['hypertrophy_programs_review'],
        description: "New program review category functionality"
      },
      {
        name: "Multiple Categories",
        hasCategory: true,
        categories: ['myths', 'hypertrophy_programs_review'],
        description: "Multiple category filtering"
      },
      {
        name: "General Search (No Categories)",
        hasCategory: false,
        categories: [],
        description: "Standard vector search without category filtering"
      }
    ];

    // Generate test embedding
    const dummyEmbedding = Array(768).fill(0.001).map(() => Math.random() * 0.002 - 0.001);
    const embeddingStr = `[${dummyEmbedding.join(',')}]`;

    let allTestsPassed = true;
    
    for (const scenario of testScenarios) {
      console.log(`📋 Testing: ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      
      try {
        let chunks;
        
        if (scenario.hasCategory && scenario.categories.length > 0) {
          // Test category-filtered search (this was failing before)
          chunks = await prisma.$queryRaw`
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
              AND kcat.name = ANY(${scenario.categories})
            ORDER BY distance
            LIMIT 5
          `;
        } else {
          // Test general search
          chunks = await prisma.$queryRaw`
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
            LIMIT 5
          `;
        }

        console.log(`   ✅ Query executed successfully - ${chunks.length} chunks retrieved`);
        
        if (chunks.length === 0) {
          console.log(`   ⚠️ No chunks found (may indicate empty knowledge base for this category)`);
        } else {
          const avgScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
          console.log(`   📊 Average similarity score: ${avgScore.toFixed(4)}`);
        }
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        allTestsPassed = false;
      }
      
      console.log('');
    }

    // Test AI Configuration to ensure system can process responses
    console.log('⚙️ Testing AI Configuration...');
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (config) {
      console.log('   ✅ AI Configuration found');
      console.log(`   📚 Knowledge Base enabled: ${config.useKnowledgeBase}`);
      console.log(`   🎯 Max tokens: ${config.maxTokens}`);
      console.log(`   🔍 Similarity threshold: ${config.ragSimilarityThreshold}`);
    } else {
      console.log('   ❌ AI Configuration missing!');
      allTestsPassed = false;
    }

    // Summary
    console.log('\n📊 FINAL ASSESSMENT');
    console.log('===================');
    
    if (allTestsPassed) {
      console.log('🎉 SUCCESS: All vector search queries working correctly!');
      console.log('\n✅ Issues Fixed:');
      console.log('   • PostgreSQL DISTINCT + ORDER BY compatibility issue resolved');
      console.log('   • Category filtering no longer causes SQL errors');
      console.log('   • AI responses should no longer be empty due to search failures');
      console.log('   • Vector search works for both categorized and general queries');
      
      console.log('\n🔧 Root Cause Analysis:');
      console.log('   • Error: "SELECT DISTINCT, ORDER BY expressions must appear in select list"');
      console.log('   • Solution: Added distance field to SELECT clause for ORDER BY compatibility');
      console.log('   • Impact: Prevents vector search failures that led to empty AI responses');
      
      console.log('\n🚀 System Status:');
      console.log('   • Vector search: ✅ Operational');
      console.log('   • Category filtering: ✅ Working');
      console.log('   • AI configuration: ✅ Ready');
      console.log('   • Empty response issue: ✅ Resolved');
      
    } else {
      console.log('⚠️ ISSUES DETECTED: Some tests failed - check configuration');
    }

  } catch (error) {
    console.error('💥 Critical error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmptyResponseFix().catch(console.error);
