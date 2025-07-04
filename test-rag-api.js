/**
 * Test RAG system via API call
 */

const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba',
  testQuery: 'What are the best exercises for muscle hypertrophy?'
};

async function testRAGViaAPI() {
  console.log('🧪 Testing RAG System via API');
  console.log('=============================\n');

  try {
    const response = await fetch('http://localhost:3000/api/test-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_CONFIG.testQuery,
        userId: TEST_CONFIG.userId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response received');
      console.log(`   Message: "${data.message}"`);
      console.log(`   User ID: ${data.userId}`);
      console.log(`   Response length: ${data.responseLength} characters`);
      console.log(`   Response preview: ${data.response.substring(0, 300)}...`);
      
      // Check for knowledge base usage indicators
      const hasKnowledgeIndicators = data.response.includes('According to') ||
                                   data.response.includes('Based on') ||
                                   data.response.includes('research shows') ||
                                   data.response.includes('study found') ||
                                   data.response.includes('document') ||
                                   data.response.includes('reference');
      
      console.log(`   Contains knowledge indicators: ${hasKnowledgeIndicators ? '✅ Yes' : '❌ No'}`);
      
      const hasGenericResponse = data.response.includes('general knowledge') ||
                               data.response.includes('no specific knowledge base content') ||
                               data.response.includes('upload relevant research papers');
      
      console.log(`   Uses generic response: ${hasGenericResponse ? '❌ Yes' : '✅ No'}`);
      
      // Check if response seems grounded in the knowledge base
      const hasSpecificTerms = data.response.includes('RIR') ||
                              data.response.includes('0-2 RIR') ||
                              data.response.includes('4-10 sets') ||
                              data.response.includes('48-72 hours') ||
                              data.response.includes('failure');
      
      console.log(`   Contains specific knowledge terms: ${hasSpecificTerms ? '✅ Yes' : '❌ No'}`);
      
    } else {
      console.log(`❌ API Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error testing RAG via API:', error.message);
  }
}

// Run the test
testRAGViaAPI();
