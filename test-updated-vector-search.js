// test-updated-vector-search.js
// Test script for the updated vector search system

const { PrismaClient } = require('@prisma/client');
const { fetchKnowledgeContext } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

async function testUpdatedVectorSearch() {
  console.log('🧪 Testing Updated Vector Search System');
  console.log('=====================================\n');

  try {
    // Test 1: Basic search functionality
    console.log('Test 1: Basic Vector Search');
    console.log('---------------------------');
    
    const testQuery = "shoulder exercises";
    const maxChunks = 5;
    const similarityThreshold = 0.1;
    
    console.log(`Query: "${testQuery}"`);
    console.log(`Max chunks: ${maxChunks}`);
    console.log(`Similarity threshold: ${similarityThreshold}`);
    
    const results = await fetchKnowledgeContext(testQuery, maxChunks, similarityThreshold);
    
    console.log(`\n✅ Retrieved ${results.length} results\n`);
    
    if (results.length > 0) {
      console.log('Sample results:');
      results.slice(0, 3).forEach((result, index) => {
        console.log(`\n${index + 1}. Title: ${result.title}`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Score: ${result.score.toFixed(4)}`);
        console.log(`   Content preview: ${result.content.substring(0, 100)}...`);
      });
    }

    // Test 2: High threshold search
    console.log('\n\nTest 2: High Threshold Search');
    console.log('-----------------------------');
    
    const highThreshold = 0.5;
    console.log(`Query: "${testQuery}" with high threshold: ${highThreshold}`);
    
    const highThresholdResults = await fetchKnowledgeContext(testQuery, maxChunks, highThreshold);
    console.log(`✅ Retrieved ${highThresholdResults.length} high-quality results`);

    // Test 3: Interface compatibility check
    console.log('\n\nTest 3: Interface Compatibility');
    console.log('-------------------------------');
    
    if (results.length > 0) {
      const sample = results[0];
      const hasRequiredFields = 
        typeof sample.id === 'string' &&
        typeof sample.title === 'string' &&
        typeof sample.content === 'string' &&
        typeof sample.score === 'number';
      
      console.log(`✅ Interface compatibility: ${hasRequiredFields ? 'PASSED' : 'FAILED'}`);
      console.log(`Fields present: id(${typeof sample.id}), title(${typeof sample.title}), content(${typeof sample.content}), score(${typeof sample.score})`);
    }

    // Test 4: Database health check
    console.log('\n\nTest 4: Database Health Check');
    console.log('-----------------------------');
    
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { status: 'READY' }
      }
    });
    
    console.log(`✅ Total ready chunks with embeddings: ${totalChunks}`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUpdatedVectorSearch();
