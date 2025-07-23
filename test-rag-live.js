// Test RAG System with Real Queries
// This tests the actual source diversification in practice

async function testRealRagQueries() {
  try {
    console.log('🔍 Testing RAG System with Real Queries...\n');

    const baseUrl = 'http://localhost:3000';
    
    // Test queries that should pull from different sources
    const testQueries = [
      {
        query: "How to train biceps effectively?",
        expected: "Should pull from bicep training guides"
      },
      {
        query: "What are the best chest exercises?", 
        expected: "Should pull from chest training guides"
      },
      {
        query: "How much volume do I need for muscle growth?",
        expected: "Should pull from volume and training principles"
      },
      {
        query: "How often should I train each muscle group?",
        expected: "Should pull from frequency and split programming guides"
      },
      {
        query: "What's the difference between free weights and machines?",
        expected: "Should pull from equipment comparison guides"
      }
    ];

    for (const test of testQueries) {
      console.log(`\n📋 Query: "${test.query}"`);
      console.log(`💭 Expected: ${test.expected}`);
      console.log('─'.repeat(60));

      try {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: test.query,
            isGuest: true // Test as guest to avoid auth
          })
        });

        if (!response.ok) {
          console.log(`❌ API Error: ${response.status} ${response.statusText}`);
          continue;
        }

        // Read the streaming response
        const reader = response.body.getReader();
        let fullResponse = '';
        let sources = new Set();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content') {
                  fullResponse += data.content;
                } else if (data.type === 'sources' && data.sources) {
                  data.sources.forEach(source => sources.add(source.title));
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }

        console.log(`📊 Response length: ${fullResponse.length} characters`);
        console.log(`📚 Sources used: ${sources.size}`);
        
        if (sources.size > 0) {
          console.log('🔗 Article sources:');
          Array.from(sources).forEach((source, index) => {
            const shortTitle = source.length > 70 ? source.substring(0, 70) + '...' : source;
            console.log(`  ${index + 1}. ${shortTitle}`);
          });
        } else {
          console.log('❌ No sources found in response');
        }

        // Basic quality check
        const hasContent = fullResponse.length > 100;
        const hasSources = sources.size > 0;
        const hasMultipleSources = sources.size > 1;
        
        console.log(`\n✅ Quality Check:`);
        console.log(`  Content: ${hasContent ? '✅' : '❌'} (${fullResponse.length} chars)`);
        console.log(`  Sources: ${hasSources ? '✅' : '❌'} (${sources.size} sources)`);
        console.log(`  Diversity: ${hasMultipleSources ? '✅' : '❌'} (${sources.size > 1 ? 'Multiple sources' : 'Single source'})`);

      } catch (fetchError) {
        console.log(`❌ Request Error: ${fetchError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runTest() {
  const isServerRunning = await checkServerStatus();
  
  if (!isServerRunning) {
    console.log('❌ Server is not running on localhost:3000');
    console.log('💡 Please start the development server with: npm run dev');
    return;
  }
  
  console.log('✅ Server is running, starting tests...');
  await testRealRagQueries();
}

runTest();
