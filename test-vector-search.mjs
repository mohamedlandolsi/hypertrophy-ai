/**
 * Test script for the new improved getRelevantContext function
 * This will verify that muscle-specific queries return the right content
 */

import { getRelevantContext, runEmbeddingAudit } from '../src/lib/vector-search.js';

async function testStrictMusclePrioritization() {
  console.log('🧪 Testing Strict Muscle Prioritization\n');
  
  // Test cases - you'll need to replace 'test-user-id' with a real user ID
  const testUserId = 'test-user-id';
  
  const testQueries = [
    'chest training methods',
    'bicep exercises for beginners', 
    'back workout routine',
    'general fitness advice',
    'nutrition guidelines'
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n📝 Testing query: "${query}"`);
      console.log('=' + '='.repeat(50));
      
      const context = await getRelevantContext(testUserId, query);
      
      if (context.length > 0) {
        console.log(`✅ Found ${context.split('---').length} context sections`);
        console.log(`📏 Total context length: ${context.length} characters`);
        
        // Show first 200 characters as preview
        const preview = context.substring(0, 200);
        console.log(`🔍 Preview: ${preview}${context.length > 200 ? '...' : ''}`);
        
      } else {
        console.log('❌ No context found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error);
    }
  }
}

async function testEmbeddingAudit() {
  console.log('\n\n🔍 Running Embedding Audit\n');
  
  try {
    const report = await runEmbeddingAudit();
    
    console.log('📊 AUDIT RESULTS:');
    console.log(`   Total chunks: ${report.totalChunks}`);
    console.log(`   With embeddings: ${report.chunksWithEmbeddings}`);
    console.log(`   Missing embeddings: ${report.chunksWithoutEmbeddings}`);
    console.log(`   Coverage: ${report.coveragePercentage.toFixed(1)}%`);
    console.log(`   Avg dimensions: ${report.averageEmbeddingDimensions}`);
    
    if (report.itemsWithoutEmbeddings.length > 0) {
      console.log(`\n📋 Items needing embeddings (${report.itemsWithoutEmbeddings.length}):`);
      report.itemsWithoutEmbeddings.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
      if (report.itemsWithoutEmbeddings.length > 5) {
        console.log(`   ... and ${report.itemsWithoutEmbeddings.length - 5} more`);
      }
    }
    
    console.log(`\n💡 Recommendations (${report.recommendations.length}):`);
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('❌ Error running embedding audit:', error);
  }
}

// Run the tests
async function main() {
  try {
    await testEmbeddingAudit();
    // await testStrictMusclePrioritization(); // Uncomment when you have a test user ID
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
