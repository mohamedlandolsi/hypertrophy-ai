const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load environment variables

async function testGeminiAPI() {
  try {
    console.log('🔍 Testing Gemini API integration...\n');

    // Check environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }
    console.log('✅ GEMINI_API_KEY found');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('🧪 Testing simple generation...');
    const startTime = Date.now();
    
    const result = await model.generateContent('Say hello in one word');
    const endTime = Date.now();
    
    const response = result.response.text();
    console.log(`✅ Gemini response: "${response}"`);
    console.log(`⏱️ Response time: ${endTime - startTime}ms`);
    
    // Test with longer prompt
    console.log('\n🧪 Testing fitness-related generation...');
    const fitnessStartTime = Date.now();
    
    const fitnessResult = await model.generateContent('Give me one simple bodyweight exercise for beginners.');
    const fitnessEndTime = Date.now();
    
    const fitnessResponse = fitnessResult.response.text();
    console.log(`✅ Fitness response: "${fitnessResponse}"`);
    console.log(`⏱️ Response time: ${fitnessEndTime - fitnessStartTime}ms`);

  } catch (error) {
    console.error('❌ Error testing Gemini API:', error);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      console.log('💡 The API key appears to be invalid');
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.log('💡 You may have hit API quota limits');
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      console.log('💡 This appears to be a network connectivity issue');
    }
  }
}

testGeminiAPI();
