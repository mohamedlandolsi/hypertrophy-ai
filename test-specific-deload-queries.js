const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpecificDeloadQueries() {
  console.log('🧪 Testing Specific Deload Queries...');
  
  try {
    // Test more specific queries that should definitely trigger the advanced perspective
    const specificQueries = [
      "Are deload weeks really necessary?",
      "Do I need to program deload weeks?",  
      "Is taking a deload week a sign of bad programming?",
      "Can I avoid deload weeks with better programming?",
      "Why do people say you don't need deload weeks?"
    ];
    
    for (const query of specificQueries) {
      console.log(`\n🔍 Testing: "${query}"`);
      
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
        
        console.log(`📝 Response: ${result.content.substring(0, 200)}...`);
        console.log(`📚 Citations: ${result.citations?.length || 0}`);
        
        // Check for advanced perspective markers
        const content = result.content.toLowerCase();
        const hasAdvancedMarkers = content.includes('symptom') || 
                                  content.includes('flawed') ||
                                  content.includes('sustainable') ||
                                  content.includes('never requires') ||
                                  content.includes('well-designed') ||
                                  content.includes('unnecessary');
        
        const hasTraditionalMarkers = content.includes('necessary') ||
                                     content.includes('recovery') ||
                                     content.includes('combat fatigue') ||
                                     content.includes('planned reduction');
        
        console.log(`🎯 Advanced perspective: ${hasAdvancedMarkers ? '✅' : '❌'}`);
        console.log(`🎯 Traditional view: ${hasTraditionalMarkers ? '⚠️' : '✅'}`);
        
        if (hasAdvancedMarkers) {
          console.log('✅ SUCCESS: AI is using the specialized knowledge base content!');
        } else if (hasTraditionalMarkers) {
          console.log('⚠️  WARNING: AI is giving traditional view despite specialized content in KB');
        }
      } else {
        console.log(`❌ API request failed: ${response.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificDeloadQueries();
