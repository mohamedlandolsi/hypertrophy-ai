// simple-function-test.js
// Quick test to check if the function exists and works

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleTest() {
  try {
    console.log('🔍 Checking function status...');

    // Check if function exists - simplified query to avoid oidvector issues
    const functionCheck = await prisma.$queryRaw`
      SELECT proname, pronargs, proargnames
      FROM pg_proc 
      WHERE proname = 'match_document_sections'
    `;
    
    if (functionCheck.length === 0) {
      console.log('❌ Function not found');
      return;
    }
    
    console.log('✅ Function exists:', functionCheck[0]);

    // Get a simple test embedding - just use a small array
    const testEmbedding = JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]);
    
    console.log('🧪 Testing with simple embedding...');
    
    // Test the function
    const results = await prisma.$queryRaw`
      SELECT * FROM match_document_sections(
        ${testEmbedding}::text,
        0.0::float,
        5::int
      )
    `;
    
    console.log(`📊 Function returned ${results.length} results`);
    
    if (results.length > 0) {
      console.log('✅ Function works! Sample result:');
      console.log(`   ID: ${results[0].id}`);
      console.log(`   Title: ${results[0].title}`);
      console.log(`   Similarity: ${results[0].similarity}`);
      console.log(`   Content: ${results[0].content.substring(0, 100)}...`);
    } else {
      console.log('⚠️ No results returned - this might be normal if no chunks match');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n💡 The function needs to be created or updated in the database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
