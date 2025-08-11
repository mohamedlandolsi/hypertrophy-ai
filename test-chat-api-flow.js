const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testChatAPIFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing complete chat API flow...');
    
    // 1. Check AI Configuration loading
    console.log('\n1️⃣ Testing AI Configuration loading...');
    const { getAIConfiguration } = require('./src/lib/gemini');
    
    try {
      const freeConfig = await getAIConfiguration('FREE');
      console.log('✅ FREE config loaded:');
      console.log('  - Model:', freeConfig.modelName);
      console.log('  - System prompt length:', freeConfig.systemPrompt.length);
      console.log('  - Temperature:', freeConfig.temperature);
      console.log('  - Max chunks:', freeConfig.ragMaxChunks);
    } catch (error) {
      console.log('❌ FREE config failed:', error.message);
    }
    
    try {
      const proConfig = await getAIConfiguration('PRO');
      console.log('✅ PRO config loaded:');
      console.log('  - Model:', proConfig.modelName);
      console.log('  - System prompt length:', proConfig.systemPrompt.length);
      console.log('  - Temperature:', proConfig.temperature);
      console.log('  - Max chunks:', proConfig.ragMaxChunks);
    } catch (error) {
      console.log('❌ PRO config failed:', error.message);
    }
    
    // 2. Test a simple user lookup
    console.log('\n2️⃣ Finding a test user...');
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true
      }
    });
    
    if (!testUser) {
      console.log('❌ No admin user found. Creating a test...');
      return;
    }
    
    console.log('✅ Found test user:', testUser.email, 'Plan:', testUser.plan);
    
    // 3. Test user plan and message checking
    console.log('\n3️⃣ Testing subscription checks...');
    const { getUserPlan, canUserSendMessage } = require('./src/lib/subscription');
    
    try {
      const planInfo = await getUserPlan(testUser.id);
      console.log('✅ User plan info:', planInfo);
      
      const canSend = await canUserSendMessage(testUser.id);
      console.log('✅ Can send message:', canSend);
    } catch (error) {
      console.log('❌ Subscription check failed:', error.message);
    }
    
    // 4. Test Gemini API call directly
    console.log('\n4️⃣ Testing direct Gemini API call...');
    const { sendToGeminiWithCitations } = require('./src/lib/gemini');
    
    try {
      const testMessage = [{ role: 'user', parts: [{ text: 'Hello, please respond with just "API working"' }] }];
      const result = await sendToGeminiWithCitations(testMessage, testUser.id, [], [], testUser.plan);
      
      console.log('✅ Gemini API response:');
      console.log('  - Content length:', result.content.length);
      console.log('  - Content preview:', result.content.substring(0, 100));
      console.log('  - Citations count:', result.citations?.length || 0);
      
      if (result.content.includes('system delay')) {
        console.log('❌ FOUND SYSTEM DELAY MESSAGE IN RESPONSE!');
      } else {
        console.log('✅ No system delay message found');
      }
    } catch (error) {
      console.log('❌ Gemini API call failed:', error.message);
      console.log('Error details:', error.stack);
    }
    
    console.log('\n🎯 Analysis complete. If there are errors above, they indicate the root cause.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatAPIFlow();
