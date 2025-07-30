const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionRAGWithLogging() {
  console.log('🔍 Testing Production RAG with Enhanced Logging...');
  
  try {
    const query = "What is a deload week?";
    console.log(`\n📝 Sending query: "${query}"`);
    
    // Make the API call and capture the raw response
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
      
      console.log('\n🎯 Raw API Response:');
      console.log('=====================================');
      console.log('Content:', result.content);
      console.log('Citations count:', result.citations?.length || 0);
      console.log('Citations:', JSON.stringify(result.citations, null, 2));
      console.log('=====================================');
      
      // Check the server logs from the terminal - this is what we need to look at
      console.log('\n📋 Next Steps:');
      console.log('1. Check the VS Code terminal where your Next.js server is running');
      console.log('2. Look for RAG-related log messages like:');
      console.log('   - "🔍 MULTI-QUERY RAG: Starting retrieval"');
      console.log('   - "🔍 Single-query retrieval returned X chunks"');
      console.log('   - "✅ Similarity search completed"');
      console.log('3. This will show us what the production RAG system is actually doing');
      
    } else {
      console.log(`❌ Request failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionRAGWithLogging();
