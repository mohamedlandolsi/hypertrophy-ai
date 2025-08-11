const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiModels() {
  console.log('🧪 Testing Gemini API with different models...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is missing!');
    return;
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test models that might be available
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-pro',
    'gemini-flash'
  ];
  
  console.log('Available GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
  
  for (const modelName of modelsToTest) {
    console.log(`\n🔍 Testing model: ${modelName}`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Say 'Hello World' in one word");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: ${text.trim()}`);
    } catch (error) {
      console.log(`❌ ${modelName}: ${error.message}`);
    }
  }
  
  // Test the specific models configured in the system
  console.log('\n🎯 Testing configured models specifically:');
  console.log('Testing gemini-2.5-flash (FREE model)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent("Test message");
    console.log('✅ gemini-2.5-flash works');
  } catch (error) {
    console.log('❌ gemini-2.5-flash failed:', error.message);
  }
  
  console.log('Testing gemini-2.5-pro (PRO model)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent("Test message");
    console.log('✅ gemini-2.5-pro works');
  } catch (error) {
    console.log('❌ gemini-2.5-pro failed:', error.message);
  }
}

testGeminiModels().catch(console.error);
