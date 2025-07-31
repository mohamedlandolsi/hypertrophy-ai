async function testSupplementFallback() {
  try {
    console.log('🧪 TESTING SUPPLEMENT/FALLBACK BEHAVIOR VIA API');
    console.log('===============================================');
    
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Test with a question that's unlikely to be in the knowledge base
    const testQuery = "What are the best supplements for muscle growth?";
    
    console.log(`🔍 Query: "${testQuery}"`);
    
    console.log('\n🤖 Sending to AI via API...');
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
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms`);
    
    console.log('\n📊 Raw API Response:');
    console.log('===================');
    console.log(JSON.stringify(data, null, 2));
    
    // Get the actual response text
    const aiResponse = data.assistantReply || data.response || data.content || data.message;
    
    if (!aiResponse) {
      console.log('❌ No response text found in API response');
      return;
    }
    
    console.log('\n📝 AI Response:');
    console.log('================');
    console.log(aiResponse);
    
    // Analyze the response
    console.log('\n🔍 Response Analysis:');
    console.log('====================');
    
    const responseText = aiResponse.toLowerCase();
    
    if (responseText.includes('cannot answer') || responseText.includes('unable to answer') || responseText.includes('sorry, but i cannot')) {
      console.log('❌ AI REFUSED to answer (problem still exists!)');
    } else if (responseText.includes('drawing from my general knowledge') || responseText.includes('general expertise')) {
      console.log('✅ AI used fallback to general knowledge (good!)');
    } else {
      console.log('🤔 AI provided answer without clear fallback indication');
    }
    
    const hasSupplementInfo = responseText.includes('protein') || responseText.includes('supplement') || responseText.includes('nutrition') || responseText.includes('muscle growth');
    if (hasSupplementInfo) {
      console.log('✅ Response contains relevant supplement information');
    } else {
      console.log('❌ Response lacks helpful supplement information');
    }
    
    const isHelpfulResponse = aiResponse.length > 100 && hasSupplementInfo;
    if (isHelpfulResponse) {
      console.log('✅ Overall: AI provided a helpful, detailed response');
    } else {
      console.log('❌ Overall: Response is too short or unhelpful');
    }
    
  } catch (error) {
    console.error('❌ Error testing supplement fallback:', error);
  }
}

testSupplementFallback();
