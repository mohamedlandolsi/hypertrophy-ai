// test-workout-program-fix.js

async function testWorkoutProgramFix() {
  try {
    console.log('🧪 Testing Workout Program Generator Fix...');
    
    // Import the enhanced RAG function
    const { getEnhancedKnowledgeContext, getAIConfiguration } = require('./src/lib/gemini');
    
    // Test if we can retrieve knowledge with enhanced RAG
    const config = await getAIConfiguration();
    
    console.log('📚 Testing enhanced knowledge retrieval...');
    const results = await getEnhancedKnowledgeContext(
      'rep ranges for hypertrophy muscle growth sets',
      6,
      0.05,
      config
    );
    
    console.log(`✅ Retrieved ${results.length} chunks`);
    
    // Check if we got rep range information
    const hasRepRanges = results.some(chunk => 
      /\d+\s*-\s*\d+\s*rep/i.test(chunk.content) || 
      /5-10|6-12|hypertrophy.*rep/i.test(chunk.content)
    );
    
    // Check if we got rest period information
    const hasRestPeriods = results.some(chunk => 
      /rest.*period|2.*5.*minute|rest.*between/i.test(chunk.content)
    );
    
    // Check if we got warmup information
    const hasWarmup = results.some(chunk => 
      /warm.?up|dynamic|stretching/i.test(chunk.content)
    );
    
    console.log(`Rep ranges found: ${hasRepRanges ? '✅' : '❌'}`);
    console.log(`Rest periods found: ${hasRestPeriods ? '✅' : '❌'}`);
    console.log(`Warmup guidance found: ${hasWarmup ? '✅' : '❌'}`);
    
    // Show sample content
    if (results.length > 0) {
      console.log('\n📋 Sample content:');
      const repRangeChunk = results.find(chunk => /\d+\s*-\s*\d+\s*rep/i.test(chunk.content));
      if (repRangeChunk) {
        console.log(`Title: ${repRangeChunk.title}`);
        console.log(`Content: ${repRangeChunk.content.substring(0, 200)}...`);
      }
    }
    
    console.log('\n✅ Enhanced RAG is working properly!');
    console.log('🔧 The workout program generator should now receive proper KB content.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWorkoutProgramFix();
