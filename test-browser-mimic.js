const https = require('http');

// Test that exactly mimics browser behavior
async function testBrowserMimicFlow() {
  console.log('🌐 Testing complete browser mimic flow...\n');

  return new Promise((resolve, reject) => {
    // Test 1: Immediate request (like browser)
    console.log('🚀 Test 1: Immediate request (like browser)');
    
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
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📨 Status: ${res.statusCode}`);
      console.log(`📨 Status Message: ${res.statusMessage}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('✅ Response received:');
          console.log(`   Content length: ${response.content?.length || 0}`);
          console.log(`   ConversationId: ${response.conversationId || 'null'}`);
          console.log(`   Citations: ${response.citations?.length || 0}`);
          
          if (response.content?.includes('Sorry, there was a system delay')) {
            console.log('❌ FOUND SYSTEM DELAY MESSAGE!');
            console.log('❌ This suggests the error is happening in the Gemini processing');
            console.log('❌ Full response content:', response.content);
          } else {
            console.log('✅ No system delay message found');
            console.log('✅ Response looks normal:', response.content?.substring(0, 100) + '...');
          }
          
          resolve({ success: true, response });
        } catch (parseError) {
          console.log('❌ Failed to parse JSON response:');
          console.log('Raw response:', data);
          console.log('Parse error:', parseError.message);
          resolve({ success: false, error: parseError.message, rawData: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.error('❌ Request timed out');
      resolve({ success: false, error: 'timeout' });
    });

    req.setTimeout(30000); // 30 second timeout (same as browser default)

    req.write(postData);
    req.end();
  });
}

// Run the test
testBrowserMimicFlow().then(result => {
  if (result.success) {
    console.log('\n🎉 Test completed successfully!');
  } else {
    console.log('\n💥 Test failed:', result.error);
    if (result.rawData) {
      console.log('Raw data:', result.rawData.substring(0, 500));
    }
  }
}).catch(error => {
  console.error('💥 Test crashed:', error);
});
