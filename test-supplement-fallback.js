const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupplementFallback() {
  console.log('🧪 Testing Supplement Question with New Fallback Logic...');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Supplement recommendations?",
        isGuest: true,
        conversationId: null
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('\n🎯 AI Response:');
      console.log('=====================================');
      console.log(result.content);
      console.log('=====================================');
      console.log(`📚 Citations: ${result.citations?.length || 0}`);
      
      // Check if the AI is now providing helpful supplement advice
      const content = result.content.toLowerCase();
      const isHelpful = content.includes('supplement') || 
                       content.includes('creatine') || 
                       content.includes('protein') ||
                       content.includes('recommend') ||
                       content.includes('suggest');
      
      const isRefusing = content.includes('cannot provide') || 
                        content.includes('not available') ||
                        content.includes('do not have') ||
                        content.includes('cannot recommend');
      
      if (isHelpful && !isRefusing) {
        console.log('\n✅ SUCCESS: AI is now providing helpful supplement guidance!');
      } else if (isRefusing) {
        console.log('\n❌ STILL REFUSING: AI is still saying it cannot provide supplement advice');
      } else {
        console.log('\n❓ UNCLEAR: Response is unclear about supplement guidance');
      }
      
    } else {
      console.log(`❌ Request failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running with: npm run dev');
  } finally {
    await prisma.$disconnect();
  }
}

testSupplementFallback();
