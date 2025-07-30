const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeCitations() {
  console.log('🔍 Analyzing Citations from Deload Queries...');
  
  try {
    const query = "What is a deload week?";
    console.log(`\n📝 Query: "${query}"`);
    
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
      
      console.log('\n🎯 Full AI Response:');
      console.log('=====================================');
      console.log(result.content);
      console.log('=====================================');
      
      console.log(`\n📚 Citations (${result.citations?.length || 0}):`);
      if (result.citations && result.citations.length > 0) {
        result.citations.forEach((citation, index) => {
          console.log(`\n${index + 1}. ${citation.title}`);
          console.log(`   ID: ${citation.knowledgeId}`);
        });
        
        // Check if the deload article is being cited
        const hasDeloadArticle = result.citations.some(c => 
          c.title.toLowerCase().includes('deload') || 
          c.title.toLowerCase().includes('well-designed program')
        );
        
        console.log(`\n🎯 Contains deload article citation: ${hasDeloadArticle}`);
        
      } else {
        console.log('   No citations found');
      }
      
    } else {
      console.log(`❌ Request failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCitations();
