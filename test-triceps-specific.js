const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTricepsSpecific() {
  console.log('\n🔍 Testing Specific Triceps Content Search\n');
  
  try {
    // Test what happens when we search for triceps-specific terms
    const tricepsSpecificQuery = 'triceps heads biasing';
    console.log(`Testing query: "${tricepsSpecificQuery}"`);
    
    // Split into terms for AND search
    const searchTerms = tricepsSpecificQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .join(' & ');
    
    console.log(`Search terms: "${searchTerms}"`);
    
    const chunks = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`Found ${chunks.length} chunks with triceps-specific terms:`);
    chunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.title} (Similarity: ${chunk.similarity})`);
      if (chunk.title.includes('Biasing the Triceps Heads')) {
        console.log(`   🎯 THIS IS THE TRICEPS BIASING GUIDE!`);
      }
    });
    
    // Now test with the problematic query
    console.log('\n--- Testing problematic query ---');
    const problematicQuery = 'What are the best isolation exercises for arms';
    const problematicTerms = problematicQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(term => term.length > 2)
      .join(' & ');
    
    console.log(`Problematic query: "${problematicQuery}"`);
    console.log(`Search terms: "${problematicTerms}"`);
    
    const problematicChunks = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${problematicTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${problematicTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`\nFound ${problematicChunks.length} chunks for problematic query:`);
    problematicChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.title} (Similarity: ${chunk.similarity})`);
    });
    
    // Let's try a more flexible approach - use OR for arm-related terms
    console.log('\n--- Testing flexible arm-related search ---');
    const flexibleTerms = 'triceps | arms | biceps | isolation';
    console.log(`Flexible search terms: "${flexibleTerms}"`);
    
    const flexibleChunks = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${flexibleTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${flexibleTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`\nFound ${flexibleChunks.length} chunks for flexible search:`);
    flexibleChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. ${chunk.title} (Similarity: ${chunk.similarity})`);
      if (chunk.title.includes('Biasing the Triceps Heads')) {
        console.log(`   🎯 THIS IS THE TRICEPS BIASING GUIDE!`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error during triceps specific test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTricepsSpecific();
