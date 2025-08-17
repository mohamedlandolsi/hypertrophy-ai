const { generateWorkoutProgram } = require('./src/lib/ai/workout-program-generator');
const { getAIConfiguration } = require('./src/lib/gemini');

async function testCategoryBasedWorkoutGeneration() {
  try {
    console.log('🧪 TESTING CATEGORY-BASED WORKOUT PROGRAM GENERATION');
    console.log('====================================================');
    
    // Mock configuration
    const config = {
      ragSimilarityThreshold: 0.05,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxTokens: 8192
    };
    
    // Mock user profile
    const userProfile = {
      goal: 'muscle building',
      experience: 'intermediate',
      frequency: '4 days per week'
    };
    
    // Test query for workout program generation
    const testQuery = "Create a 4-day upper/lower workout program for muscle building";
    
    console.log(`🎯 Test Query: "${testQuery}"`);
    console.log('');
    
    console.log('📋 Expected Category-Based Searches:');
    console.log('  - hypertrophy_programs (full category content)');
    console.log('  - hypertrophy_principles (core training principles)');
    console.log('  - myths (misconception prevention)');
    console.log('  - Plus any muscle-specific categories if mentioned');
    console.log('');
    
    // Call the enhanced function
    console.log('🚀 Generating workout program with category-based RAG...');
    
    const result = await generateWorkoutProgram(
      testQuery,
      config,
      userProfile,
      [],
      'pro'
    );
    
    console.log('✅ Generation completed successfully!');
    console.log(`📊 Response length: ${result.content.length} characters`);
    console.log(`📚 Citations count: ${result.citations.length}`);
    console.log('');
    
    console.log('🔍 First 500 characters of response:');
    console.log(result.content.substring(0, 500) + '...');
    console.log('');
    
    console.log('📑 Citations:');
    result.citations.forEach((citation, index) => {
      console.log(`  ${index + 1}. ${citation}`);
    });
    
    console.log('');
    console.log('🎉 CATEGORY-BASED WORKOUT GENERATION TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testCategoryBasedWorkoutGeneration();
