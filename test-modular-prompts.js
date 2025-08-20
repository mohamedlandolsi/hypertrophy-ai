// test-modular-prompts.js
// Test script to demonstrate the new modular system prompt functionality

const { getDynamicSystemPrompt, detectPromptIntent } = require('./src/lib/ai/core-prompts');

async function testModularPrompts() {
  console.log('🧪 Testing Modular System Prompt Components\n');
  
  // Test different types of queries
  const testCases = [
    {
      name: 'Workout Program Creation',
      query: 'Create a 4-day upper/lower split workout for muscle hypertrophy',
      userProfile: { name: 'John', experienceLevel: 'intermediate', primaryGoals: 'muscle growth' }
    },
    {
      name: 'Program Review',
      query: 'Can you review my current workout routine and give feedback?',
      userProfile: { name: 'Sarah', experienceLevel: 'beginner' }
    },
    {
      name: 'Nutrition Question',
      query: 'What supplements should I take for muscle building?',
      userProfile: { name: 'Mike', primaryGoals: 'hypertrophy' }
    },
    {
      name: 'General Q&A',
      query: 'How many sets should I do for biceps?',
      userProfile: { name: 'Alex', experienceLevel: 'advanced' }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Test Case: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    
    // Test intent detection
    const intent = detectPromptIntent(testCase.query, '');
    console.log('Detected Intent:', {
      isWorkoutProgram: intent.isWorkoutProgram,
      isProgramReview: intent.isProgramReview,
      isNutritionFocused: intent.isNutritionFocused,
      isGeneralQA: intent.isGeneralQA
    });
    
    try {
      // Generate dynamic system prompt
      const systemPrompt = await getDynamicSystemPrompt(
        testCase.userProfile,
        testCase.query,
        'Sample knowledge context about hypertrophy training...'
      );
      
      console.log(`✅ Generated System Prompt (${systemPrompt.length} characters)`);
      
      // Show first 200 characters as sample
      const preview = systemPrompt.substring(0, 200) + '...';
      console.log(`Preview: ${preview}`);
      
    } catch (error) {
      console.error(`❌ Error generating prompt: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }
}

// Run the test
testModularPrompts().catch(console.error);
