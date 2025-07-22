const { getRelevantContext } = require('./src/lib/vector-search');

async function testMuscleSpecificSearch() {
  try {
    console.log('🎯 TESTING MUSCLE-SPECIFIC SEARCH FIX');
    console.log('=====================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    const testQueries = [
      'What are the best chest exercises for muscle growth?',
      'How should I train my shoulders?',
      'What are the principles of effective muscle building?', // General query
      'Tell me about bicep training methods'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Query: "${query}"`);
      console.log('─'.repeat(60));
      
      const startTime = Date.now();
      
      const context = await getRelevantContext(userId, query, 8);
      
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📄 Context length: ${context.length} chars`);
      
      // Show first few lines to verify content
      const lines = context.split('\n').slice(0, 3);
      console.log('📝 Content preview:');
      lines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`   ${index + 1}. ${line.substring(0, 80)}...`);
        }
      });
    }
    
    console.log('\n✅ TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMuscleSpecificSearch();
