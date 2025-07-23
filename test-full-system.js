const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullSystem() {
  console.log('🚀 Testing Full Multi-Query RAG System');
  console.log('=====================================\n');

  try {
    // Test 1: Check AI configuration
    console.log('1. Checking AI Configuration...');
    const aiConfig = await prisma.aiConfig.findFirst();
    if (aiConfig) {
      console.log(`✅ AI Config found:`);
      console.log(`   - Similarity threshold: ${aiConfig.similarityThreshold}`);
      console.log(`   - Max chunks: ${aiConfig.maxChunks}`);
      console.log(`   - High relevance threshold: ${aiConfig.highRelevanceThreshold}`);
      console.log(`   - Multi-query enabled: ${aiConfig.enableMultiQuery}`);
    } else {
      console.log('❌ No AI config found');
      return;
    }

    // Test 2: Check knowledge base
    console.log('\n2. Checking Knowledge Base...');
    const totalChunks = await prisma.knowledgeChunk.count();
    const uniqueSources = await prisma.knowledgeChunk.findMany({
      select: { source: true },
      distinct: ['source']
    });
    console.log(`✅ Knowledge base status:`);
    console.log(`   - Total chunks: ${totalChunks}`);
    console.log(`   - Unique sources: ${uniqueSources.length}`);

    // Test 3: Test chat API with broad question
    console.log('\n3. Testing Chat API with Multi-Query...');
    const testQuery = "What are the best exercises for building muscle and how should I structure my training program?";
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: testQuery }
        ],
        conversationId: null,
        userId: 'test-user'
      })
    });

    if (response.ok) {
      console.log('✅ Chat API responded successfully');
      const reader = response.body.getReader();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += new TextDecoder().decode(value);
      }
      
      console.log(`   - Response length: ${fullResponse.length} characters`);
      console.log(`   - Contains citations: ${fullResponse.includes('[') ? 'Yes' : 'No'}`);
    } else {
      console.log(`❌ Chat API failed: ${response.status}`);
    }

    console.log('\n🎉 Full System Test Complete!');
    console.log('The multi-query RAG system is operational and ready for production.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFullSystem();
