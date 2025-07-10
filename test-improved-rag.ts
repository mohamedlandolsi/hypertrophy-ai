/**
 * Test script for the improved RAG system
 * 
 * This script tests the enhanced hybrid search functionality
 * to ensure it can properly retrieve relevant articles.
 */

import { PrismaClient } from '@prisma/client';
import { performHybridSearch, performVectorSearch, performEnhancedKeywordSearch } from './src/lib/vector-search.js';

const prisma = new PrismaClient();

async function testImprovedRAG() {
  console.log('🔍 Testing Improved RAG System...\n');
  
  try {
    // Test queries that were previously failing
    const testQueries = [
      'what is perception of effort',
      'perception of effort',
      'RPE rate of perceived exertion',
      'how to train forearms',
      'forearm training',
      'forearm exercises',
      'grip strength training'
    ];
    
    // Get a test user who has knowledge base articles
    const testUser = await prisma.user.findFirst({
      include: {
        knowledgeItems: {
          where: { status: 'READY' },
          take: 5
        }
      }
    });
    
    if (!testUser) {
      console.log('❌ No test user found with knowledge base articles');
      return;
    }
    
    console.log(`📚 Testing with user: ${testUser.id}`);
    console.log(`📚 Available knowledge items: ${testUser.knowledgeItems.length}`);
    testUser.knowledgeItems.forEach(item => {
      console.log(`  - ${item.title} (${item.id})`);
    });
    console.log();
    
    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      
      try {
        // Test enhanced hybrid search
        const hybridResults = await performHybridSearch(query, testUser.id, {
          limit: 5,
          threshold: 0.25,
          vectorWeight: 0.6,
          keywordWeight: 0.4,
          rerank: true
        });
        
        console.log(`  📊 Hybrid search results: ${hybridResults.length}`);
        hybridResults.forEach(result => {
          console.log(`    - ${result.knowledgeItemTitle} (${result.knowledgeItemId}): ${(result.similarity * 100).toFixed(1)}%`);
        });
        
        // Test vector search only
        const vectorResults = await performVectorSearch(query, {
          limit: 5,
          threshold: 0.3,
          userId: testUser.id
        });
        
        console.log(`  📊 Vector search results: ${vectorResults.length}`);
        vectorResults.forEach(result => {
          console.log(`    - ${result.knowledgeItemTitle} (${result.knowledgeItemId}): ${(result.similarity * 100).toFixed(1)}%`);
        });
        
        // Test keyword search only
        const keywordResults = await performEnhancedKeywordSearch(query, testUser.id, {
          limit: 5,
          threshold: 0.1
        });
        
        console.log(`  📊 Keyword search results: ${keywordResults.length}`);
        keywordResults.forEach(result => {
          console.log(`    - ${result.knowledgeItemTitle} (${result.knowledgeItemId}): ${(result.similarity * 100).toFixed(1)}%`);
        });
        
        console.log();
        
      } catch (error) {
        console.error(`  ❌ Error testing query "${query}":`, error instanceof Error ? error.message : 'Unknown error');
        console.log();
      }
    }
    
    console.log('✅ RAG testing completed!');
    
  } catch (error) {
    console.error('❌ Error during RAG testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testImprovedRAG().catch(console.error);
