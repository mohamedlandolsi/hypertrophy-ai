const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmbeddingsComplete() {
  console.log('🔍 COMPREHENSIVE EMBEDDING VERIFICATION');
  console.log('=====================================\n');

  try {
    // 1. Check overall statistics
    console.log('📊 Overall Statistics:');
    const totalKnowledgeItems = await prisma.knowledgeItem.count();
    const readyKnowledgeItems = await prisma.knowledgeItem.count({
      where: { status: 'READY' }
    });
    const totalChunks = await prisma.knowledgeChunk.count();
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: { embeddingData: { not: null } }
    });

    console.log(`  📚 Knowledge Items: ${readyKnowledgeItems}/${totalKnowledgeItems} READY`);
    console.log(`  📄 Chunks: ${chunksWithEmbeddings}/${totalChunks} with embeddings`);
    console.log(`  ✅ Embedding Coverage: ${((chunksWithEmbeddings/totalChunks)*100).toFixed(1)}%\n`);

    // 2. Check for missing embeddings
    const missingEmbeddings = await prisma.knowledgeChunk.findMany({
      where: { 
        embeddingData: null,
        knowledgeItem: { status: 'READY' }
      },
      include: { knowledgeItem: true },
      take: 10
    });

    if (missingEmbeddings.length > 0) {
      console.log('❌ Chunks Missing Embeddings:');
      missingEmbeddings.forEach((chunk, i) => {
        console.log(`  ${i+1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
      });
      console.log('');
    } else {
      console.log('✅ All READY knowledge chunks have embeddings\n');
    }

    // 3. Verify embedding format and dimensions
    console.log('🧠 Embedding Format Verification:');
    const sampleChunk = await prisma.knowledgeChunk.findFirst({
      where: { embeddingData: { not: null } },
      include: { knowledgeItem: true }
    });

    if (sampleChunk) {
      try {
        const embedding = JSON.parse(sampleChunk.embeddingData);
        console.log(`  📏 Embedding Dimensions: ${embedding.length}`);
        console.log(`  🔢 Sample Values: [${embedding.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...]`);
        console.log(`  📋 From: "${sampleChunk.knowledgeItem.title}"\n`);
        
        if (embedding.length !== 768) {
          console.log('❌ WARNING: Expected 768 dimensions for Gemini text-embedding-004');
        }
      } catch (error) {
        console.log(`  ❌ Invalid embedding format in chunk ${sampleChunk.id}`);
      }
    }

    // 4. Test vector search capability
    console.log('🔍 Vector Search Capability Test:');
    try {
      // Use a known embedding for testing
      const testEmbedding = Array(768).fill(0).map(() => Math.random() * 2 - 1);
      const embeddingStr = `[${testEmbedding.join(',')}]`;
      
      const vectorResults = await prisma.$queryRaw`
        SELECT
          kc.content,
          ki.title,
          1 - (kc."embeddingData"::vector <=> ${embeddingStr}::vector) as similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id  
        WHERE ki.status = 'READY' 
          AND kc."embeddingData" IS NOT NULL
        ORDER BY kc."embeddingData"::vector <=> ${embeddingStr}::vector
        LIMIT 3
      `;
      
      console.log(`  ✅ pgvector search working: ${vectorResults.length} results`);
      if (vectorResults.length > 0) {
        console.log(`  📊 Top similarity: ${vectorResults[0].similarity.toFixed(4)}`);
      }
    } catch (error) {
      console.log(`  ❌ pgvector search failed: ${error.message}`);
    }
    console.log('');

    // 5. Check content diversity
    console.log('📈 Content Diversity Analysis:');
    const topKnowledgeItems = await prisma.knowledgeItem.findMany({
      where: { status: 'READY' },
      include: {
        _count: { select: { chunks: true } }
      },
      orderBy: {
        chunks: { _count: 'desc' }
      },
      take: 10
    });

    console.log('  📚 Top Knowledge Items by Chunk Count:');
    topKnowledgeItems.forEach((item, i) => {
      console.log(`    ${i+1}. "${item.title}" - ${item._count.chunks} chunks`);
    });
    console.log('');

    // 6. Test specific content areas
    console.log('🎯 Content Area Coverage:');
    const contentAreas = [
      { name: 'Chest', keywords: ['chest', 'pectoral', 'bench'] },
      { name: 'Arms', keywords: ['arm', 'bicep', 'tricep'] },
      { name: 'Legs', keywords: ['leg', 'squat', 'quad'] },
      { name: 'Back', keywords: ['back', 'lat', 'row'] },
      { name: 'Progressive Overload', keywords: ['progressive', 'overload'] },
      { name: 'Range of Motion', keywords: ['range', 'motion', 'ROM'] }
    ];

    for (const area of contentAreas) {
      const count = await prisma.knowledgeChunk.count({
        where: {
          content: {
            contains: area.keywords[0],
            mode: 'insensitive'
          },
          knowledgeItem: { status: 'READY' },
          embeddingData: { not: null }
        }
      });
      console.log(`  ${area.name}: ${count} chunks with embeddings`);
    }

    console.log('\n🎉 VERIFICATION COMPLETE');
    console.log('=========================');
    
    if (chunksWithEmbeddings === totalChunks && missingEmbeddings.length === 0) {
      console.log('✅ ALL KNOWLEDGE BASE ITEMS ARE PERFECTLY EMBEDDED AND VECTORIZED');
      console.log('✅ RAG system is ready for optimal AI retrieval');
    } else {
      console.log('⚠️  Some chunks are missing embeddings - consider reprocessing');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmbeddingsComplete();
