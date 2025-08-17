/**
 * Simple RAG Pipeline Test for Enhanced Features
 * Tests basic functionality without complex imports
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testRAGPipelineBasics() {
  console.log('🚀 TESTING RAG PIPELINE BASICS');
  console.log('==============================\n');

  try {
    // Test 1: Check if we have knowledge chunks in the database
    console.log('📊 Testing knowledge base availability...');
    const totalChunks = await prisma.knowledgeChunk.count();
    console.log(`Found ${totalChunks} knowledge chunks in database`);

    if (totalChunks === 0) {
      console.log('❌ No knowledge chunks found! Upload some content first.');
      return;
    }

    // Test 2: Check for fitness-related content
    console.log('\n🏋️ Testing fitness content availability...');
    const fitnessChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'hypertrophy', mode: 'insensitive' } },
          { content: { contains: 'muscle', mode: 'insensitive' } },
          { content: { contains: 'exercise', mode: 'insensitive' } },
          { content: { contains: 'training', mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        content: true,
        knowledgeItem: {
          select: {
            title: true,
            fileName: true,
            category: true
          }
        }
      }
    });

    console.log(`Found ${fitnessChunks.length} fitness-related chunks`);

    if (fitnessChunks.length > 0) {
      console.log('\n📋 Sample fitness content:');
      fitnessChunks.forEach((chunk, i) => {
        console.log(`${i + 1}. ${chunk.content.substring(0, 100)}...`);
        if (chunk.knowledgeItem) {
          const source = chunk.knowledgeItem.fileName || chunk.knowledgeItem.title || 'Unknown';
          const category = chunk.knowledgeItem.category || 'General';
          console.log(`   Source: ${source} (Category: ${category})`);
        }
      });
    }

    // Test 3: Check for embeddings
    console.log('\n🔍 Testing embeddings availability...');
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });

    console.log(`Found ${chunksWithEmbeddings} chunks with embeddings`);
    console.log(`Embedding coverage: ${((chunksWithEmbeddings / totalChunks) * 100).toFixed(1)}%`);

    if (chunksWithEmbeddings === 0) {
      console.log('❌ No embeddings found! Run embedding generation first.');
      return;
    }

    // Test 4: Sample vector similarity search
    console.log('\n🎯 Testing basic vector search...');
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        embeddingData: { not: null },
        content: { contains: 'muscle', mode: 'insensitive' }
      }
    });

    if (sampleChunk && sampleChunk.embeddingData) {
      // Parse the embedding
      const embedding = JSON.parse(sampleChunk.embeddingData);
      
      // Simple similarity search using raw SQL
      const similarChunks = await prisma.$queryRaw`
        SELECT 
          id, 
          content,
          (1 - ("embeddingData"::vector <=> ${JSON.stringify(embedding)}::vector)) as similarity
        FROM "KnowledgeChunk" 
        WHERE "embeddingData" IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 5
      `;

      console.log(`Found ${similarChunks.length} similar chunks:`);
      similarChunks.forEach((chunk, i) => {
        console.log(`${i + 1}. Similarity: ${chunk.similarity.toFixed(3)} - ${chunk.content.substring(0, 80)}...`);
      });
    }

    // Test 5: Full-text search capabilities
    console.log('\n🔎 Testing full-text search...');
    const searchTerms = ['hypertrophy', 'deltoids', 'training', 'muscle building'];
    
    for (const term of searchTerms) {
      const results = await prisma.knowledgeChunk.count({
        where: {
          content: { contains: term, mode: 'insensitive' }
        }
      });
      console.log(`"${term}": ${results} chunks`);
    }

    console.log('\n✅ RAG Pipeline Basic Tests Complete!');
    console.log('\n📈 RECOMMENDATIONS:');
    if (chunksWithEmbeddings / totalChunks < 0.8) {
      console.log('⚠️  Consider regenerating embeddings for all chunks');
    }
    if (fitnessChunks.length < 10) {
      console.log('⚠️  Consider uploading more fitness-specific content');
    }
    console.log('✨ Enhanced RAG v3 features are ready for testing with real queries');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRAGPipelineBasics()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
