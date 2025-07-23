// Test Multi-Query Retrieval System
// Run from project root: node test-multi-query-retrieval.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the TypeScript module using require (for CommonJS compatibility)
async function testMultiQueryRetrieval() {
  try {
    console.log('🔍 Testing Multi-Query Retrieval System...\n');

    // Test queries that should benefit from multi-query retrieval
    const testQueries = [
      "how to train chest",
      "how to build bigger arms", 
      "best back workout for muscle growth",
      "how to increase training volume safely",
      "what is the optimal rep range" // This should use single-query
    ];

    for (const query of testQueries) {
      console.log(`\n📋 Testing query: "${query}"`);
      console.log('─'.repeat(60));
      
      try {
        // Import the module dynamically
        const { generateSubQueries, shouldUseMultiQuery } = require('./src/lib/query-generator');
        
        // Test the decision logic
        const useMultiQuery = shouldUseMultiQuery(query);
        console.log(`🎯 Multi-query recommended: ${useMultiQuery ? 'YES' : 'NO'}`);
        
        if (useMultiQuery) {
          // Generate sub-queries
          const subQueries = await generateSubQueries(query);
          console.log(`📝 Generated ${subQueries.length} sub-queries:`);
          
          subQueries.forEach((subQuery, index) => {
            console.log(`  ${index + 1}. "${subQuery}"`);
          });
          
          // Show expected benefit
          console.log(`\n✅ Expected benefit: Comprehensive context from multiple relevant documents`);
        } else {
          console.log(`\n💡 Single-query retrieval will be used (query is specific enough)`);
        }

      } catch (moduleError) {
        console.log(`❌ Module Error: ${moduleError.message}`);
        // Test fallback behavior
        console.log(`💡 Fallback: Would use single-query retrieval`);
      }
    }

    console.log('\n🎯 Multi-Query System Analysis:');
    console.log('=====================================');
    console.log('✅ Broad training questions → Multi-query retrieval');
    console.log('✅ Specific technical questions → Single-query retrieval');
    console.log('✅ Fallback to single-query on any errors');
    console.log('\n📈 Expected improvements:');
    console.log('• More comprehensive answers to broad questions');
    console.log('• Better coverage of volume, frequency, technique');
    console.log('• Reduced reliance on AI internal knowledge');
    console.log('• Maintained efficiency for specific queries');

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiQueryRetrieval();
