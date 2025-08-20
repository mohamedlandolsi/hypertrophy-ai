// test-similarity-function.js
// Test script for the PostgreSQL match_document_sections function

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimilarityFunction() {
  try {
    console.log('🧪 Testing PostgreSQL match_document_sections function...');

    // Check if function exists
    const functionCheck = await prisma.$queryRaw`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'match_document_sections'
    `;
    
    if (functionCheck.length === 0) {
      console.log('❌ Function match_document_sections not found!');
      console.log('📝 Please run the migration first:');
      console.log('   npx supabase db push');
      return;
    }
    
    console.log('✅ Function match_document_sections exists');

    // Check if we have any knowledge chunks with embeddings
    const chunkCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "KnowledgeChunk" 
      WHERE "embeddingData" IS NOT NULL
    `;
    
    console.log(`📊 Found ${chunkCount[0].count} chunks with embeddings`);
    
    if (chunkCount[0].count === 0) {
      console.log('⚠️ No chunks with embeddings found. Please process some documents first.');
      return;
    }

    // Get a sample embedding for testing
    const sampleChunk = await prisma.$queryRaw`
      SELECT "embeddingData"
      FROM "KnowledgeChunk" 
      WHERE "embeddingData" IS NOT NULL 
      LIMIT 1
    `;
    
    if (sampleChunk.length === 0) {
      console.log('❌ No sample embedding found');
      return;
    }

    const sampleEmbedding = sampleChunk[0].embeddingData;
    console.log('🔍 Testing with sample embedding...');

    // Test the function with different thresholds
    const thresholds = [0.1, 0.3, 0.5, 0.7];
    
    for (const threshold of thresholds) {
      const results = await prisma.$queryRaw`
        SELECT * FROM match_document_sections(
          ${sampleEmbedding}::text,
          ${threshold}::float,
          5::int
        )
      `;
      
      console.log(`📈 Threshold ${threshold}: ${results.length} results`);
      
      if (results.length > 0) {
        console.log(`   Best match: ${results[0].similarity.toFixed(4)} similarity`);
        console.log(`   Title: ${results[0].title}`);
        console.log(`   Content preview: ${results[0].content.substring(0, 100)}...`);
      }
    }

    // Test performance
    console.log('\n⚡ Testing performance...');
    const startTime = Date.now();
    
    const perfResults = await prisma.$queryRaw`
      SELECT * FROM match_document_sections(
        ${sampleEmbedding}::text,
        0.1::float,
        10::int
      )
    `;
    
    const endTime = Date.now();
    console.log(`🏁 Query completed in ${endTime - startTime}ms`);
    console.log(`📊 Returned ${perfResults.length} results`);

    // Check index status
    console.log('\n📊 Checking available indexes...');
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'KnowledgeChunk'
    `;
    
    if (indexCheck.length > 0) {
      console.log(`✅ Found ${indexCheck.length} indexes on KnowledgeChunk table`);
      indexCheck.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('📝 No custom indexes found (using default indexes)');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('function match_document_sections')) {
      console.log('\n📝 To fix this issue:');
      console.log('1. Make sure you have run the migration:');
      console.log('   npx supabase db push');
      console.log('2. Or apply the SQL file directly to your database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSimilarityFunction();
