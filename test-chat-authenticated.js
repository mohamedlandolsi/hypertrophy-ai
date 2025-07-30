const https = require('http');

async function testChatAPIAuthenticated() {
  try {
    console.log('🧪 Testing Chat API with authenticated user (non-guest)...\n');

    const postData = JSON.stringify({
      message: "Hello, can you help me with training?",
      isGuest: false // Try authenticated mode
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

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('\n📝 Response:');
        try {
          const response = JSON.parse(data);
          if (response.error) {
            console.log('❌ Error from API:', response.error);
            console.log('❌ Full response:', response);
          } else {
            console.log('✅ Success! AI Response:', response.content?.substring(0, 100) + '...');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse response as JSON:');
          console.log(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatAPIAuthenticated();
