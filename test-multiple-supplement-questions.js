const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMultipleSupplementQuestions() {
  console.log('🧪 Testing Multiple Supplement Questions...');
  
  const testQueries = [
    "Supplement recommendations?",
    "What supplements should I take for muscle growth?",
    "Is creatine worth taking?",
    "Best protein powder for beginners?",
    "Should I take pre-workout supplements?"
  ];
  
  try {
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n🔍 Test ${i + 1}: "${query}"`);
      
      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            isGuest: true,
            conversationId: null
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          console.log(`📝 Response preview: ${result.content.substring(0, 150)}...`);
          console.log(`📚 Citations: ${result.citations?.length || 0}`);
          
          // Check if the AI is being helpful
          const content = result.content.toLowerCase();
          const isHelpful = (content.includes('supplement') || 
                           content.includes('creatine') || 
                           content.includes('protein') ||
                           content.includes('recommend') ||
                           content.includes('suggest')) && 
                           !content.includes('cannot provide') &&
                           !content.includes('not available');
          
          if (isHelpful) {
            console.log('✅ HELPFUL: AI provided useful supplement guidance');
          } else {
            console.log('❌ NOT HELPFUL: AI refused or gave vague response');
          }
          
        } else {
          console.log(`❌ Request failed: ${response.status}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Error for "${query}": ${error.message}`);
      }
    }
    
    console.log('\n🎯 Summary: Supplement fallback testing complete');
    console.log('💡 If the server is not running, start it with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleSupplementQuestions();
