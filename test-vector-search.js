/**
 * Test the actual vector search and chat functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba',
  testQueries: [
    'What are the best exercises for muscle hypertrophy?',
    'How many sets per muscle group per week?',
    'What is progressive overload?',
    'How should I structure my training program?'
  ]
};

async function testVectorSearchManually() {
  console.log('🔍 Testing Vector Search Manually');
  console.log('================================\n');

  try {
    // Import the vector search functions
    const vectorSearchModule = await import('./src/lib/vector-search.js');
    const { performVectorSearch, getRelevantContext } = vectorSearchModule;

    for (const [index, query] of TEST_CONFIG.testQueries.entries()) {
      console.log(`\n${index + 1}️⃣ Testing Query: "${query}"`);
      console.log('─'.repeat(50));

      try {
        // Test performVectorSearch directly
        console.log('📡 Testing performVectorSearch...');
        const searchResults = await performVectorSearch(query, {
          limit: 5,
          threshold: 0.4,
          userId: TEST_CONFIG.userId
        });

        console.log(`   Found ${searchResults.length} results`);
        
        if (searchResults.length > 0) {
          searchResults.forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.knowledgeItemTitle}`);
            console.log(`      Similarity: ${(result.similarity * 100).toFixed(1)}%`);
            console.log(`      Preview: ${result.content.substring(0, 100)}...`);
          });
        } else {
          console.log('   ❌ No results found');
        }

        // Test getRelevantContext
        console.log('\n📚 Testing getRelevantContext...');
        const context = await getRelevantContext(
          TEST_CONFIG.userId,
          query,
          5,
          0.4,
          []
        );

        console.log(`   Context length: ${context.length} characters`);
        
        if (context.length > 0) {
          console.log(`   Context preview: ${context.substring(0, 200)}...`);
          
          // Check for document structure
          const hasSections = context.includes('===');
          console.log(`   Has document sections: ${hasSections ? 'Yes' : 'No'}`);
          
          if (hasSections) {
            const sectionCount = (context.match(/===/g) || []).length;
            console.log(`   Number of sections: ${sectionCount}`);
          }
        } else {
          console.log('   ❌ No context retrieved');
        }

      } catch (error) {
        console.error(`   ❌ Error testing query: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error importing vector search module:', error.message);
    console.log('This might be because the module uses ES6 imports');
  }
}

// Alternative: Test using API calls
async function testViaAPI() {
  console.log('\n🌐 Testing Via API Calls');
  console.log('========================\n');

  try {
    const fetch = (await import('node-fetch')).default;

    for (const [index, query] of TEST_CONFIG.testQueries.entries()) {
      console.log(`\n${index + 1}️⃣ Testing Query via API: "${query}"`);
      console.log('─'.repeat(50));

      try {
        // Test the chat API
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            conversationId: null
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API Response received`);
          console.log(`   Response length: ${data.assistantReply.length} characters`);
          console.log(`   Response preview: ${data.assistantReply.substring(0, 300)}...`);
          
          // Check for citations or knowledge base usage
          const hasKnowledgeIndicators = data.assistantReply.includes('According to') ||
                                       data.assistantReply.includes('Based on') ||
                                       data.assistantReply.includes('research shows') ||
                                       data.assistantReply.includes('study found') ||
                                       data.assistantReply.includes('document') ||
                                       data.assistantReply.includes('reference');
          
          console.log(`   Contains knowledge indicators: ${hasKnowledgeIndicators ? '✅ Yes' : '❌ No'}`);
          
          const hasGenericResponse = data.assistantReply.includes('general knowledge') ||
                                   data.assistantReply.includes('no specific knowledge base content') ||
                                   data.assistantReply.includes('upload relevant research papers');
          
          console.log(`   Uses generic response: ${hasGenericResponse ? '❌ Yes' : '✅ No'}`);
          
        } else {
          console.log(`   ❌ API Error: ${response.status} - ${response.statusText}`);
        }

      } catch (error) {
        console.error(`   ❌ Error testing API: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing via API:', error.message);
  }
}

// Run the tests
async function runVectorSearchTests() {
  try {
    await testVectorSearchManually();
    await testViaAPI();
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runVectorSearchTests();
