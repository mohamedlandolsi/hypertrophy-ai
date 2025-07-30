const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullGuestUserFlow() {
  console.log('🧪 Testing Full Guest User Flow for Deload Question...');
  
  try {
    // Simulate the exact API call for a guest user
    const baseUrl = 'http://localhost:3000'; // Assuming local development
    
    const testMessage = "What is a deload week?";
    
    console.log(`📨 Sending API request: "${testMessage}"`);
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        isGuest: true,
        conversationId: null
      })
    });
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n🎯 API Response:');
    console.log('=====================================');
    console.log('Content:', result.content);
    console.log('Citations:', result.citations?.length || 0);
    console.log('=====================================');
    
    // Analyze the response
    const content = result.content || '';
    const mentionsDeload = content.toLowerCase().includes('deload');
    const mentionsNotInKB = content.toLowerCase().includes('not in') || content.toLowerCase().includes("doesn't exist") || content.toLowerCase().includes("don't have");
    const seemsToUseContext = content.length > 100;
    
    console.log('\n📊 Response Analysis:');
    console.log('- Mentions deload:', mentionsDeload);
    console.log('- Claims not in knowledge base:', mentionsNotInKB);
    console.log('- Substantial response:', seemsToUseContext);
    console.log('- Response length:', content.length, 'characters');
    
    if (mentionsNotInKB) {
      console.log('\n⚠️  WARNING: AI is claiming deload info is not in knowledge base!');
      console.log('This suggests the RAG system is not working correctly in production.');
    } else if (mentionsDeload && seemsToUseContext) {
      console.log('\n✅ SUCCESS: AI is using deload information correctly!');
    } else {
      console.log('\n❓ UNCLEAR: Response doesn\'t clearly indicate if KB is being used.');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
    
    // If the API server isn't running, let's just test the function directly
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log('\n📱 API server not running, testing function directly...');
      
      // Import and test the function directly
      const { sendToGeminiWithCitations } = require('./src/lib/gemini.ts');
      
      const conversationForGemini = [{ role: 'user', content: testMessage }];
      
      const aiResult = await sendToGeminiWithCitations(
        conversationForGemini, 
        undefined, // guest user
        null, // no image
        null, // no image mime type
        'FREE' // free plan
      );
      
      console.log('\n🎯 Direct Function Response:');
      console.log('=====================================');
      console.log('Content:', aiResult.content);
      console.log('Citations:', aiResult.citations?.length || 0);
      console.log('=====================================');
      
      // Analyze the response
      const content = aiResult.content || '';
      const mentionsDeload = content.toLowerCase().includes('deload');
      const mentionsNotInKB = content.toLowerCase().includes('not in') || content.toLowerCase().includes("doesn't exist") || content.toLowerCase().includes("don't have");
      const seemsToUseContext = content.length > 100;
      
      console.log('\n📊 Response Analysis:');
      console.log('- Mentions deload:', mentionsDeload);
      console.log('- Claims not in knowledge base:', mentionsNotInKB);
      console.log('- Substantial response:', seemsToUseContext);
      console.log('- Response length:', content.length, 'characters');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testFullGuestUserFlow();
