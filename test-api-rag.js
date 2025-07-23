const http = require('http');

function makePostRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
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
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testRagApi() {
  console.log('🧪 Testing New RAG System via API...\n');
  
  try {
    // Test with guest user (no authentication needed)
    const testMessage = {
      message: "How should I train my chest muscles effectively?",
      isGuest: true
    };
    
    console.log(`📝 Sending test message: "${testMessage.message}"`);
    console.log('👤 Mode: Guest (no authentication)');
    
    const startTime = Date.now();
    const response = await makePostRequest(testMessage);
    const endTime = Date.now();
    
    console.log(`\n⏱️ Response time: ${endTime - startTime}ms`);
    console.log(`📊 Status code: ${response.status}`);
    
    if (response.status === 200) {
      console.log('\n✅ API Response received!');
      console.log('🤖 Assistant Reply:');
      console.log(response.data.assistantReply || 'No reply field');
    } else {
      console.log('\n❌ API Error:');
      console.log(response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

testRagApi();
