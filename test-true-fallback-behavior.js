async function testTrueFallbackBehavior() {
  try {
    console.log('🧪 TESTING TRUE FALLBACK WITH NO KNOWLEDGE BASE');
    console.log('===============================================');
    
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Test with completely non-fitness questions to trigger true fallback
    const testQueries = [
      "What are the best supplements for muscle growth?",
      "Tell me about creatine monohydrate dosage",
      "Should I take protein powder?",
      "What vitamins help with recovery?"
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
          conversationId: null,
          isGuest: true  // Test as guest to avoid any user-specific logic
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
      
      if (responseText.includes('cannot provide') || responseText.includes('cannot answer') || responseText.includes('no information')) {
        console.log('❌ AI REFUSED to provide helpful answer');
      } else if (responseText.includes('mandatory override') || responseText.includes('general expertise')) {
        console.log('✅ AI used fallback with override');
      } else if (citations.length === 0 && (responseText.includes('supplement') || responseText.includes('protein') || responseText.includes('nutrition'))) {
        console.log('✅ AI provided helpful answer without knowledge base');
      } else {
        console.log('🤔 Mixed or unclear response pattern');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing fallback:', error);
  }
}

testTrueFallbackBehavior();
