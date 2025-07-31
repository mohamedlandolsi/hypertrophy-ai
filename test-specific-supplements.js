async function testSpecificSupplementQuestions() {
  try {
    console.log('🧪 TESTING SPECIFIC SUPPLEMENT FALLBACK BEHAVIOR');
    console.log('================================================');
    
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Test with very specific supplement questions unlikely to be in general fitness guides
    const testQueries = [
      "What is the optimal dosage of Beta-Alanine for endurance?",
      "Should I take HMB or leucine for muscle preservation?",
      "What's the difference between citrulline and citrulline malate?",
      "How does rhodiola rosea affect exercise performance?",
      "What are the best nootropics for workout focus?"
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
      if (citations.length > 0) {
        console.log(`   Sources: ${citations.map(c => c.title.substring(0, 50)).join(', ')}`);
      }
      
      if (!aiResponse) {
        console.log('❌ No response received');
        continue;
      }
      
      console.log('\n📝 AI Response (first 300 chars):');
      console.log(aiResponse.substring(0, 300) + (aiResponse.length > 300 ? '...' : ''));
      
      // Analyze the response
      const responseText = aiResponse.toLowerCase();
      
      if (responseText.includes('cannot answer') || responseText.includes('unable to answer') || responseText.includes('sorry, but i cannot')) {
        console.log('❌ AI REFUSED to answer (problem still exists!)');
      } else if (responseText.includes('drawing from my general knowledge') || responseText.includes('general expertise')) {
        console.log('✅ AI explicitly used fallback to general knowledge');
      } else if (citations.length === 0 && (responseText.includes('supplement') || responseText.includes('dosage') || responseText.includes('performance'))) {
        console.log('✅ AI provided helpful supplement info without knowledge base');
      } else if (citations.length > 0) {
        console.log('✅ AI found relevant knowledge base content');
      } else {
        console.log('🤔 Unclear response pattern');
      }
      
      // Check if response is helpful
      const isHelpfulResponse = aiResponse.length > 100 && !responseText.includes('cannot answer');
      console.log(`🎯 Helpful Response: ${isHelpfulResponse ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing supplement fallback:', error);
  }
}

testSpecificSupplementQuestions();
