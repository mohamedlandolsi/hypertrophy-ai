// test-gemini-function.js
// Test the specific Gemini function that's returning empty responses

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGeminiFunction() {
  console.log('🧪 TESTING GEMINI FUNCTION DIRECTLY');
  console.log('===================================\n');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`👤 Testing with user: ${testUser.id}`);

    // Test the sendToGeminiWithCitations function
    console.log('\n1. Testing sendToGeminiWithCitations...');
    
    // Create a simple conversation history
    const conversationHistory = [
      { role: 'user', content: 'Hello, can you help me with muscle building?' }
    ];

    // Import the function directly
    const path = require('path');
    const geminiPath = path.join(process.cwd(), 'src', 'lib', 'gemini.ts');
    
    // Since we can't require TypeScript directly, let's test with a manual API call
    console.log('   Making test API call to chat endpoint...');
    
    // Check if the dev server is running
    try {
      const testResponse = await fetch('http://localhost:3000/api/health');
      console.log('   ✅ Dev server is running');
    } catch (error) {
      console.log('   ❌ Dev server not running or health endpoint missing');
    }

    // Let's directly test the Gemini API call logic
    console.log('\n2. Testing Gemini API integration...');
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('   ❌ GEMINI_API_KEY not found');
      return;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test with the exact model and configuration used in the app
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (!aiConfig) {
      console.log('   ❌ AI configuration not found');
      return;
    }
    
    console.log(`   Using model: ${aiConfig.freeModelName}`);
    console.log(`   Temperature: ${aiConfig.temperature}`);
    console.log(`   Max tokens: ${aiConfig.maxTokens}`);
    
    const model = genAI.getGenerativeModel({ 
      model: aiConfig.freeModelName,
      systemInstruction: {
        role: "system",
        parts: [{ text: aiConfig.systemPrompt }]
      }
    });
    
    const generationConfig = {
      temperature: aiConfig.temperature,
      topP: aiConfig.topP,
      topK: aiConfig.topK,
      maxOutputTokens: aiConfig.maxTokens,
    };
    
    const chat = model.startChat({ 
      history: [], 
      generationConfig 
    });
    
    console.log('   Sending test message to Gemini...');
    const result = await chat.sendMessage('Hello, can you help me with muscle building?');
    const aiContent = result.response.text();
    
    console.log(`   ✅ Response received!`);
    console.log(`   Response length: ${aiContent.length} characters`);
    console.log(`   Response preview: "${aiContent.substring(0, 200)}..."`);
    
    if (aiContent.length === 0) {
      console.log('   ❌ EMPTY RESPONSE FROM GEMINI!');
      console.log('   This is the root cause of the issue.');
    }
    
    // Test with a different message
    console.log('\n3. Testing with different message...');
    const result2 = await chat.sendMessage('What is progressive overload?');
    const aiContent2 = result2.response.text();
    
    console.log(`   Response 2 length: ${aiContent2.length} characters`);
    console.log(`   Response 2 preview: "${aiContent2.substring(0, 200)}..."`);

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testGeminiFunction();
