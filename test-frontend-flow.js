const https = require('http');

async function testFrontendFlow() {
  try {
    console.log('🧪 Testing Frontend Flow - simulating exact frontend request...\n');

    // Simulate the exact request the frontend makes
    const postData = JSON.stringify({
      message: "Hello, can you help me with training?",
      conversationId: "",
      isGuest: true,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 Simulating frontend request:');
    console.log('Body:', postData);
    console.log('Headers:', options.headers);

    const req = https.request(options, (res) => {
      console.log(`\n📨 Response Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n📝 Full Response:');
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            console.log('❌ API returned error:', response.error);
            console.log('❌ Full error response:', response);
          } else {
            console.log('✅ Success! Response keys:', Object.keys(response));
            console.log('✅ Content length:', response.content?.length || 0);
            console.log('✅ ConversationId:', response.conversationId);
            console.log('✅ AI Response (preview):', response.content?.substring(0, 100) + '...');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response as JSON:');
          console.log('Raw response:', data);
          console.log('Parse error:', parseError.message);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network error:', error);
    });

    req.on('timeout', () => {
      console.error('❌ Request timed out after 30 seconds');
    });

    req.setTimeout(30000); // 30 second timeout

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendFlow();
