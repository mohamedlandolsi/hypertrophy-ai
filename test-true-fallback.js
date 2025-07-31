async function testTrueEmptyKnowledgeBase() {
  try {
    console.log('🧪 TESTING TRUE FALLBACK BEHAVIOR (EMPTY KNOWLEDGE BASE)');
    console.log('=========================================================');
    
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Test with questions that are definitely NOT in a fitness knowledge base
    const testQueries = [
      "What is the capital of France?",
      "How do you cook pasta?",
      "What's the weather like today?",
      "Tell me about quantum physics"
    ];
    
    for (const testQuery of testQueries) {
      console.log(`\n🔍 Query: "${testQuery}"`);
      console.log('─'.repeat(60));
      
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testQuery,
          conversationId: null
        })
      });
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Response received in ${duration}ms`);
      
      const aiResponse = data.content || data.assistantMessage?.content;
      const citations = data.citations || [];
      
      console.log(`📚 Citations: ${citations.length}`);
      
      if (!aiResponse) {
        console.log('❌ No response received');
        continue;
      }
      
      console.log('\n📝 AI Response (first 200 chars):');
      console.log(aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : ''));
      
      // Analyze the response
      const responseText = aiResponse.toLowerCase();
      
      if (responseText.includes('cannot answer') || responseText.includes('unable to answer') || responseText.includes('sorry, but i cannot')) {
        console.log('❌ AI REFUSED to answer (old behavior)');
      } else if (responseText.includes('drawing from my general knowledge') || responseText.includes('general expertise')) {
        console.log('✅ AI used fallback to general knowledge');
      } else if (citations.length === 0) {
        console.log('✅ AI answered without knowledge base (good!)');
      } else {
        console.log('🤔 Unexpected: AI found knowledge base content for this query');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing fallback:', error);
  }
}

testTrueEmptyKnowledgeBase();
