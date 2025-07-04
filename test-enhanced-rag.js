/**
 * Test script for the enhanced RAG system
 * 
 * This script tests the new hybrid search, re-ranking, query transformation,
 * and enhanced context generation features.
 */

import { 
  performHybridSearch, 
  performKeywordSearch, 
  performVectorSearch, 
  transformQuery, 
  getRelevantContext, 
  performAdvancedRetrieval 
} from './src/lib/vector-search.js';
import { getEnhancedContext } from './src/lib/gemini.js';
import { prisma } from './src/lib/prisma.js';

// Test configuration
const TEST_CONFIG = {
  // Replace with a real user ID from your database
  userId: 'test-user-id',
  
  // Test queries of varying complexity
  testQueries: [
    'What is the best rep range for muscle hypertrophy?',
    'How should I adjust my training if I want to gain strength?',
    'What are the key principles of progressive overload?',
    'Can you explain the difference between hypertrophy and strength training?',
    'What supplements should I take for muscle growth?'
  ],
  
  // Conversation history for context
  conversationHistory: [
    { role: 'user', content: 'I am a beginner lifter looking to build muscle' },
    { role: 'assistant', content: 'Great! Building muscle requires consistent training, proper nutrition, and progressive overload. What specific questions do you have?' }
  ]
};

async function testBasicVectorSearch() {
  console.log('\n🧪 Testing Basic Vector Search...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      const results = await performVectorSearch(query, {
        limit: 3,
        threshold: 0.5,
        userId: TEST_CONFIG.userId
      });
      
      console.log(`✅ Found ${results.length} results`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.knowledgeItemTitle} (${(result.similarity * 100).toFixed(1)}%)`);
      });
      
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
    }
  }
}

async function testKeywordSearch() {
  console.log('\n🧪 Testing Keyword Search...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      const results = await performKeywordSearch(query, TEST_CONFIG.userId, {
        limit: 3,
        threshold: 0.1
      });
      
      console.log(`✅ Found ${results.length} keyword results`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.knowledgeItemTitle} (${(result.similarity * 100).toFixed(1)}%)`);
      });
      
    } catch (error) {
      console.error(`❌ Error testing keyword search for "${query}":`, error.message);
    }
  }
}

async function testHybridSearch() {
  console.log('\n🧪 Testing Hybrid Search...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      const results = await performHybridSearch(query, TEST_CONFIG.userId, {
        limit: 5,
        threshold: 0.4,
        rerank: true
      });
      
      console.log(`✅ Found ${results.length} hybrid results`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.knowledgeItemTitle} (${(result.similarity * 100).toFixed(1)}%)`);
      });
      
    } catch (error) {
      console.error(`❌ Error testing hybrid search for "${query}":`, error.message);
    }
  }
}

async function testQueryTransformation() {
  console.log('\n🧪 Testing Query Transformation...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Original Query: "${query}"`);
      
      const transformedQuery = await transformQuery(query, TEST_CONFIG.conversationHistory);
      
      console.log(`✅ Transformed Query: "${transformedQuery}"`);
      
      if (transformedQuery !== query) {
        console.log(`   🔄 Query was enhanced for better retrieval`);
      } else {
        console.log(`   ➡️ Query remained unchanged`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing query transformation for "${query}":`, error.message);
    }
  }
}

async function testAdvancedRetrieval() {
  console.log('\n🧪 Testing Advanced Retrieval...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      const results = await performAdvancedRetrieval(TEST_CONFIG.userId, query, {
        maxChunks: 6,
        diversityThreshold: 0.8,
        conversationHistory: TEST_CONFIG.conversationHistory,
        includeSimilarContent: true
      });
      
      console.log(`✅ Found ${results.length} advanced results`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.knowledgeItemTitle} (${(result.similarity * 100).toFixed(1)}%)`);
      });
      
    } catch (error) {
      console.error(`❌ Error testing advanced retrieval for "${query}":`, error.message);
    }
  }
}

async function testEnhancedContext() {
  console.log('\n🧪 Testing Enhanced Context Generation...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      const context = await getRelevantContext(
        TEST_CONFIG.userId,
        query,
        5,
        0.5,
        TEST_CONFIG.conversationHistory
      );
      
      if (context) {
        console.log(`✅ Generated context (${context.length} characters)`);
        console.log(`   📚 Context preview: ${context.substring(0, 100)}...`);
        
        // Check for relevance indicators
        const hasHighRelevance = context.includes('[HIGH RELEVANCE]');
        const sourceCount = (context.match(/===/g) || []).length;
        
        console.log(`   🎯 High relevance items: ${hasHighRelevance ? 'Yes' : 'No'}`);
        console.log(`   📖 Source count: ${sourceCount}`);
      } else {
        console.log(`⚠️ No relevant context found`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing enhanced context for "${query}":`, error.message);
    }
  }
}

async function testFullEnhancedRAGPipeline() {
  console.log('\n🧪 Testing Full Enhanced RAG Pipeline...');
  
  for (const query of TEST_CONFIG.testQueries) {
    try {
      console.log(`\n🔍 Query: "${query}"`);
      
      // Use the enhanced context function from Gemini
      const enhancedContext = await getEnhancedContext(
        TEST_CONFIG.userId,
        query,
        TEST_CONFIG.conversationHistory
      );
      
      if (enhancedContext) {
        console.log(`✅ Enhanced RAG pipeline successful`);
        console.log(`   � Context length: ${enhancedContext.length} characters`);
        console.log(`   🎯 Context quality: ${enhancedContext.includes('[HIGH RELEVANCE]') ? 'High' : 'Standard'}`);
        
        // Count unique sources
        const sourceCount = (enhancedContext.match(/===/g) || []).length;
        console.log(`   📖 Unique sources: ${sourceCount}`);
        
        // Check for relevance scoring
        const hasRelevanceScoring = enhancedContext.includes('Relevance:');
        console.log(`   📊 Relevance scoring: ${hasRelevanceScoring ? 'Yes' : 'No'}`);
        
      } else {
        console.log(`⚠️ Enhanced RAG pipeline returned no context`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing full RAG pipeline for "${query}":`, error.message);
    }
  }
}

async function checkUserKnowledgeBase() {
  console.log('\n🧪 Checking User Knowledge Base...');
  
  try {
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
    
    console.log(`📚 Found ${knowledgeItems.length} knowledge items for user`);
    
    if (knowledgeItems.length === 0) {
      console.log('⚠️ Warning: No knowledge items found. The RAG system needs documents to work.');
      console.log('   Please upload some fitness/training documents first.');
      return false;
    }
    
    knowledgeItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type}) - ${item._count.chunks} chunks`);
    });
    
    // Check for embeddings
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
    
    console.log(`🔗 Chunks with embeddings: ${chunksWithEmbeddings}`);
    
    return chunksWithEmbeddings > 0;
    
  } catch (error) {
    console.error('❌ Error checking knowledge base:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced RAG System Tests...');
  console.log('================================================');
  
  // First, check if user has knowledge base
  const hasKnowledgeBase = await checkUserKnowledgeBase();
  
  if (!hasKnowledgeBase) {
    console.log('\n❌ Cannot run tests: No knowledge base found or no embeddings generated.');
    console.log('Please:');
    console.log('1. Upload some fitness/training documents');
    console.log('2. Generate embeddings for the documents');
    console.log('3. Update TEST_CONFIG.userId with a real user ID');
    return;
  }
  
  // Run all tests
  await testBasicVectorSearch();
  await testKeywordSearch();
  await testHybridSearch();
  await testQueryTransformation();
  await testAdvancedRetrieval();
  await testEnhancedContext();
  await testFullEnhancedRAGPipeline();
  
  console.log('\n✅ All tests completed!');
  console.log('================================================');
}

// Run the tests
runAllTests().catch(console.error);
