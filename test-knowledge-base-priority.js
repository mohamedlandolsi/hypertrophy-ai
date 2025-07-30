const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testKnowledgeBasePriority() {
  console.log('🧪 Testing Knowledge Base Priority with Multiple Queries...');
  
  const testQueries = [
    "What is a deload week?",
    "Do I need to program deload weeks?",
    "When should I take a deload?",
    "How often should I deload?",
    "What's the best way to structure a deload?"
  ];
  
  try {
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n🔍 Test ${i + 1}: "${query}"`);
      
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
        
        // Check for advanced perspective
        const content = result.content.toLowerCase();
        const hasAdvanced = content.includes('symptom') || 
                           content.includes('flawed') ||
                           content.includes('sustainable') ||
                           content.includes('never requires') ||
                           content.includes('well-designed') ||
                           content.includes('not necessary') ||
                           content.includes('unnecessary');
        
        const hasTraditional = content.includes('take a break') ||
                               content.includes('reduce volume') ||
                               content.includes('recovery week') ||
                               (content.includes('necessary') && !content.includes('not necessary'));
        
        if (hasAdvanced) {
          console.log(`✅ CORRECT: Using advanced knowledge base perspective`);
        } else if (hasTraditional) {
          console.log(`❌ WRONG: Still using traditional view`);
        } else {
          console.log(`❓ UNCLEAR: Response doesn't clearly indicate perspective`);
        }
        
      } else {
        console.log(`❌ Request failed: ${response.status}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎯 Summary: Knowledge base priority testing complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testKnowledgeBasePriority();
