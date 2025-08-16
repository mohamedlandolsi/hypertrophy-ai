const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRestPeriodRAGEnhancement() {
  console.log('=== Testing Enhanced RAG for Rest Periods ===\n');
  
  try {
    // Test queries that should return correct rest period information
    const restPeriodQueries = [
      "How long should I rest between sets?",
      "What are the optimal rest periods for muscle growth?",
      "How many minutes should I rest between exercises?",
      "Rest time recommendations for hypertrophy"
    ];
    
    for (const query of restPeriodQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      
      // Test the specialized search function
      console.log('   🔍 Testing specialized rest period search...');
      
      const restPeriodResults = await prisma.$queryRaw`
        SELECT 
          kc.id,
          kc.content,
          kc."chunkIndex",
          ki.id as "knowledgeId",
          ki.title,
          0.95 as score
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
        JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
        WHERE ki.status = 'READY' 
          AND ki.title ILIKE '%rest period%'
          AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
        ORDER BY kc."chunkIndex"
        LIMIT 5
      `;
      
      console.log(`   ✅ Specialized search returned ${restPeriodResults.length} results:`);
      
      restPeriodResults.forEach((result, index) => {
        console.log(`      ${index + 1}. [Rest Period Guide] ${result.title}`);
        
        // Extract key rest period information
        const content = result.content.toLowerCase();
        const restMatches = content.match(/(\d+(?:-\d+)?)\s*(?:to\s*)?(\d+)?\s*(minute|min)/gi);
        
        if (restMatches) {
          console.log(`         📊 Found rest periods: ${restMatches.join(', ')}`);
        }
        
        // Check for specific patterns
        if (content.includes('2-5 minute') || content.includes('2 to 5 minute')) {
          console.log(`         ✅ Contains correct "2-5 minutes" recommendation`);
        }
        
        if (content.includes('60-90 second') || content.includes('2-3 minute')) {
          console.log(`         ❌ Contains potentially hallucinated rest periods`);
        }
        
        console.log(`         Preview: ${result.content.substring(0, 150)}...`);
        console.log('');
      });
      
      // Test general search for comparison
      console.log('   🔍 Testing general vector search for comparison...');
      
      const embeddingStr = '[' + Array(768).fill(0.1).join(',') + ']'; // Mock embedding
      
      const generalResults = await prisma.$queryRaw`
        SELECT 
          kc.content,
          ki.title,
          kcat.name as category_name
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
        JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
        WHERE ki.status = 'READY' 
          AND kc."embeddingData" IS NOT NULL
          AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
        ORDER BY (kc."embeddingData"::vector <=> ${embeddingStr}::vector)
        LIMIT 3
      `;
      
      console.log(`   📊 General search returned ${generalResults.length} results:`);
      generalResults.forEach((result, index) => {
        console.log(`      ${index + 1}. [${result.category_name}] ${result.title}`);
      });
    }
    
    // Test the complete knowledge base content for rest periods
    console.log('\n=== Complete Rest Period Knowledge Base Analysis ===');
    
    const allRestContent = await prisma.$queryRaw`
      SELECT 
        ki.title,
        kc.content,
        kcat.name as category_name,
        kc."chunkIndex"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
      JOIN "KnowledgeItemCategory" kic ON ki.id = kic."knowledgeItemId"
      JOIN "KnowledgeCategory" kcat ON kic."knowledgeCategoryId" = kcat.id
      WHERE ki.status = 'READY' 
        AND ki.title ILIKE '%rest period%'
        AND kcat.name IN ('hypertrophy_programs', 'hypertrophy_principles')
      ORDER BY kcat.name, ki.title, kc."chunkIndex"
    `;
    
    console.log(`\nFound ${allRestContent.length} chunks specifically about rest periods:`);
    
    const restPeriodSummary = [];
    
    allRestContent.forEach((chunk, index) => {
      console.log(`\n${index + 1}. [${chunk.category_name}] ${chunk.title} (chunk ${chunk.chunkIndex})`);
      
      // Extract all rest period mentions
      const content = chunk.content;
      const restMatches = content.match(/(\d+(?:-\d+)?)\s*(?:to\s*)?(\d+)?\s*(minute|min|second|sec)/gi);
      
      if (restMatches) {
        restMatches.forEach(match => {
          restPeriodSummary.push(match);
          console.log(`   📊 Found: "${match}"`);
        });
      }
      
      // Show key sentences about rest
      const sentences = content.split('.');
      const restSentences = sentences.filter(s => 
        /rest|minute|second/i.test(s) && s.length > 20
      ).slice(0, 2);
      
      restSentences.forEach(sentence => {
        console.log(`   💡 Key info: ${sentence.trim()}.`);
      });
    });
    
    // Summary of all rest period recommendations found
    console.log('\n=== Summary of All Rest Period Recommendations ===');
    const uniqueRestPeriods = [...new Set(restPeriodSummary)];
    console.log('All rest period patterns found in the knowledge base:');
    uniqueRestPeriods.forEach(pattern => {
      const count = restPeriodSummary.filter(p => p === pattern).length;
      console.log(`  ✓ "${pattern}" - mentioned ${count} time(s)`);
    });
    
    console.log('\n=== Verification Results ===');
    const hasCorrectPattern = uniqueRestPeriods.some(p => 
      p.includes('2-5') || p.includes('2 to 5')
    );
    const hasIncorrectPattern = uniqueRestPeriods.some(p => 
      p.includes('2-3') || p.includes('60-90')
    );
    
    console.log(`✅ Correct "2-5 minutes" pattern found: ${hasCorrectPattern}`);
    console.log(`❌ Incorrect "2-3 min" or "60-90 sec" patterns found: ${hasIncorrectPattern}`);
    
    if (hasCorrectPattern && !hasIncorrectPattern) {
      console.log('\n🎯 CONCLUSION: Knowledge base contains only correct rest period info');
      console.log('   The enhanced RAG system should now prevent rest period hallucination');
      console.log('   AI should only recommend 2-5 minutes based on KB content');
    } else {
      console.log('\n⚠️  CONCLUSION: Need to investigate further');
    }
    
  } catch (error) {
    console.error('Error testing rest period RAG enhancement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRestPeriodRAGEnhancement();
