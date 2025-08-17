// test-program-generation.js

async function testProgramGeneration() {
  try {
    console.log('🏋️ Testing Program Generation with Fixes...');
    
    // Simulate a workout program request
    const { generateChatResponse } = require('./src/lib/gemini');
    
    const result = await generateChatResponse(
      'test-user-123',
      [],
      'Create a complete upper/lower split program with specific sets, reps, rest periods, and warmup'
    );
    
    console.log(`✅ Response length: ${result.content.length} characters`);
    
    // Check for key elements
    const hasRepRanges = /\b\d+\s*-?\s*\d+\s*rep/i.test(result.content);
    const hasRestPeriods = /\d+\s*-?\s*\d+\s*minute|rest.*\d+/i.test(result.content);
    const hasWarmup = /warm.?up|dynamic/i.test(result.content);
    const hasSpecificSets = /\b\d+\s*sets?\b/i.test(result.content);
    const hasRIR = /rir|reps?\s*in\s*reserve|0-2|failure/i.test(result.content);
    
    console.log(`Rep ranges: ${hasRepRanges ? '✅' : '❌'}`);
    console.log(`Rest periods: ${hasRestPeriods ? '✅' : '❌'}`);
    console.log(`Warmup guidance: ${hasWarmup ? '✅' : '❌'}`);
    console.log(`Specific sets: ${hasSpecificSets ? '✅' : '❌'}`);
    console.log(`RIR guidance: ${hasRIR ? '✅' : '❌'}`);
    
    // Show preview
    console.log('\n📋 Response preview:');
    console.log(result.content.substring(0, 500) + '...');
    
    if (hasRepRanges && hasRestPeriods && hasSpecificSets) {
      console.log('\n🎉 SUCCESS! AI is now providing complete programming information!');
    } else {
      console.log('\n⚠️ Still missing some programming details');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProgramGeneration();
