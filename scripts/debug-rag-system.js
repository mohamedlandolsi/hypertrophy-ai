/**
 * Debug script to test RAG system step by step
 * This will help identify exactly where the issue lies
 */

const { PrismaClient } = require('@prisma/client');
const { getRelevantContext, performHybridSearch } = require('./src/lib/vector-search');
const { sendToGemini } = require('./src/lib/gemini');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  // Replace with a real user ID from your database
  userId: 'user_2q9ZGQMZkNkqLdpgwPpVYv5bXkH', // Update this with your actual user ID
  testQueries: [
    'What are the best exercises for muscle hypertrophy?',
    'How should I structure my training program?',
    'What is the optimal rest time between sets?',
    'How many sets per muscle group per week?'
  ]
};

async function debugRAGSystem() {
  console.log('🔍 Starting RAG System Debug Session...');
  console.log('===============================================\n');

  // Step 1: Check if user has knowledge base
  console.log('📚 Step 1: Checking User Knowledge Base...');
  const knowledgeItems = await prisma.knowledgeItem.findMany({
    where: {
      userId: TEST_CONFIG.userId,
      status: 'READY'
    },
    select: {
      id: true,
      title: true,
      type: true,
      _count: {
        select: {
          chunks: true
        }
      }
    }
  });

  console.log(`Found ${knowledgeItems.length} knowledge items:`);
  knowledgeItems.forEach((item, index) => {
    console.log(`   ${index + 1}. "${item.title}" (${item.type}) - ${item._count.chunks} chunks`);
  });

  if (knowledgeItems.length === 0) {
    console.log('❌ No knowledge items found! RAG cannot work without documents.');
    console.log('Please upload some fitness/training documents first.');
    return;
  }

  // Step 2: Check embeddings
  console.log('\n🔗 Step 2: Checking Embeddings...');
  const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
    where: {
      knowledgeItem: {
        userId: TEST_CONFIG.userId
      },
      embeddingData: {
        not: null
      }
    }
  });

  console.log(`Chunks with embeddings: ${chunksWithEmbeddings}`);

  if (chunksWithEmbeddings === 0) {
    console.log('❌ No embeddings found! Vector search cannot work without embeddings.');
    console.log('Please generate embeddings for your documents first.');
    return;
  }

  // Step 3: Test each query
  for (const [index, query] of TEST_CONFIG.testQueries.entries()) {
    console.log(`\n🔍 Step 3.${index + 1}: Testing Query: "${query}"`);
    console.log('─'.repeat(60));

    try {
      // Test hybrid search directly
      console.log('   📡 Testing Hybrid Search...');
      const hybridResults = await performHybridSearch(query, TEST_CONFIG.userId, {
        limit: 5,
        threshold: 0.4,
        rerank: true
      });

      console.log(`   ✅ Hybrid search found ${hybridResults.length} results`);
      hybridResults.forEach((result, i) => {
        console.log(`      ${i + 1}. ${result.knowledgeItemTitle} (${(result.similarity * 100).toFixed(1)}%)`);
        console.log(`         Preview: ${result.content.substring(0, 100)}...`);
      });

      // Test getRelevantContext
      console.log('\n   📚 Testing getRelevantContext...');
      const context = await getRelevantContext(
        TEST_CONFIG.userId,
        query,
        5,
        0.5,
        []
      );

      console.log(`   ✅ Retrieved context: ${context.length} characters`);
      if (context.length > 0) {
        console.log(`   📄 Context preview: ${context.substring(0, 200)}...`);
        
        // Count unique sources
        const sourceCount = (context.match(/===/g) || []).length;
        console.log(`   📖 Unique sources: ${sourceCount}`);
      } else {
        console.log('   ❌ No context retrieved!');
      }

      // Test full RAG pipeline
      console.log('\n   🤖 Testing Full RAG Pipeline with sendToGemini...');
      const conversation = [{ role: 'user', content: query }];
      const response = await sendToGemini(conversation, TEST_CONFIG.userId);

      console.log(`   ✅ AI Response length: ${response.length} characters`);
      console.log(`   💬 Response preview: ${response.substring(0, 300)}...`);

      // Check if response contains citations or source references
      const hasCitations = response.includes('According to') || 
                          response.includes('From the') || 
                          response.includes('Based on the') ||
                          response.includes('research shows') ||
                          response.includes('study found');

      console.log(`   📝 Contains citations: ${hasCitations ? '✅ YES' : '❌ NO'}`);

      // Check if response mentions no available content
      const mentionsNoContent = response.includes('No specific knowledge base content') ||
                               response.includes('currently available') ||
                               response.includes('general knowledge');

      console.log(`   📚 Uses knowledge base: ${mentionsNoContent ? '❌ NO (fallback)' : '✅ YES'}`);

    } catch (error) {
      console.error(`   ❌ Error testing query "${query}":`, error.message);
    }
  }

  // Step 4: Test with debug logging
  console.log('\n🔧 Step 4: Testing with Enhanced Debug Logging...');
  console.log('─'.repeat(60));

  const testQuery = TEST_CONFIG.testQueries[0];
  console.log(`Testing: "${testQuery}"`);

  try {
    // Enable debug logging by temporarily modifying the search function
    console.log('\n🔍 Detailed Context Retrieval Process:');
    
    const detailedContext = await getRelevantContext(
      TEST_CONFIG.userId,
      testQuery,
      7,
      0.5,
      []
    );

    if (detailedContext.length > 0) {
      console.log('\n📊 Context Analysis:');
      console.log(`   Total length: ${detailedContext.length} characters`);
      console.log(`   Word count: ${detailedContext.split(' ').length} words`);
      console.log(`   Line count: ${detailedContext.split('\n').length} lines`);
      
      // Show structure
      const sections = detailedContext.split('===').filter(s => s.trim());
      console.log(`   Document sections: ${sections.length}`);
      
      sections.forEach((section, i) => {
        const title = section.split('\n')[0].trim();
        const content = section.split('\n').slice(1).join('\n').trim();
        console.log(`      ${i + 1}. "${title}" (${content.length} chars)`);
      });
    } else {
      console.log('❌ No detailed context retrieved');
    }

  } catch (error) {
    console.error('❌ Error in detailed analysis:', error.message);
  }

  console.log('\n✅ RAG System Debug Complete!');
  console.log('===============================================');
}

// Helper function to check AI configuration
async function checkAIConfiguration() {
  console.log('\n⚙️ Checking AI Configuration...');
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found');
      return false;
    }

    console.log('✅ AI Configuration found:');
    console.log(`   Model: ${config.modelName}`);
    console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`   Use Client Memory: ${config.useClientMemory}`);
    console.log(`   Temperature: ${config.temperature}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking AI configuration:', error.message);
    return false;
  }
}

// Run the debug session
async function runDebugSession() {
  try {
    const configOk = await checkAIConfiguration();
    if (!configOk) {
      console.log('Please set up AI configuration first');
      return;
    }

    await debugRAGSystem();
  } catch (error) {
    console.error('❌ Debug session failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the debug session
runDebugSession();
