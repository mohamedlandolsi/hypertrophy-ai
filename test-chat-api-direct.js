const fetch = require('node-fetch');
require('dotenv').config();

async function testChatAPI() {
  try {
    console.log('🔍 Testing Chat API directly...\n');

    const testPrompt = 'Give me a simple push exercise';
    console.log(`📝 Testing prompt: "${testPrompt}"`);

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
      },
      body: JSON.stringify({
        message: testPrompt,
      }),
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📄 Raw response:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Parsed response:');
        console.log('- Content length:', data.content?.length || 0);
        console.log('- Citations count:', data.citations?.length || 0);
        console.log('- Conversation ID:', data.conversationId);
        if (data.content) {
          console.log('- Content preview:', data.content.substring(0, 200) + '...');
        }
      } catch (parseError) {
        console.log('❌ Could not parse JSON response');
      }
    } else {
      console.log('❌ API request failed');
    }

  } catch (error) {
    console.error('❌ Error testing chat API:', error.message);
  }
}

testChatAPI();
