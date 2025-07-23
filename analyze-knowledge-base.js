const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeKnowledgeBase() {
  console.log('📊 Analyzing Current Knowledge Base...\n');

  try {
    // Get knowledge items stats
    const totalItems = await prisma.knowledgeItem.count();
    const readyItems = await prisma.knowledgeItem.count({
      where: { status: 'READY' }
    });

    console.log(`📚 Knowledge Items:`);
    console.log(`- Total: ${totalItems}`);
    console.log(`- Ready: ${readyItems}`);

    // Get chunks stats
    const totalChunks = await prisma.knowledgeChunk.count();
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: { embeddingData: { not: null } }
    });

    console.log(`\n📄 Knowledge Chunks:`);
    console.log(`- Total: ${totalChunks}`);
    console.log(`- With embeddings: ${chunksWithEmbeddings}`);
    console.log(`- Without embeddings: ${totalChunks - chunksWithEmbeddings}`);

    // Sample some chunks to check title prefixing status
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null }
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });

    console.log(`\n🔍 Sample Chunks (checking for title prefixing):`);
    let prefixedCount = 0;
    
    sampleChunks.forEach((chunk, i) => {
      const startsWithTitle = chunk.content.startsWith(chunk.knowledgeItem.title);
      if (startsWithTitle) prefixedCount++;
      
      console.log(`\n--- Sample ${i + 1} ---`);
      console.log(`Title: ${chunk.knowledgeItem.title}`);
      console.log(`Content start: ${chunk.content.substring(0, 80)}...`);
      console.log(`Has title prefix: ${startsWithTitle ? '✅' : '❌'}`);
    });

    console.log(`\n📈 Title Prefixing Status:`);
    console.log(`- Chunks with title prefix: ${prefixedCount}/${sampleChunks.length}`);
    console.log(`- Estimated total needing update: ${Math.round((1 - prefixedCount/sampleChunks.length) * chunksWithEmbeddings)}`);

    // Get breakdown by knowledge item
    const itemsWithChunks = await prisma.knowledgeItem.findMany({
      where: { status: 'READY' },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            chunks: {
              where: { embeddingData: { not: null } }
            }
          }
        }
      },
      orderBy: {
        chunks: {
          _count: 'desc'
        }
      },
      take: 10
    });

    console.log(`\n📚 Top Knowledge Items by Chunk Count:`);
    itemsWithChunks.forEach((item, i) => {
      console.log(`${i + 1}. "${item.title}" - ${item._count.chunks} chunks`);
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeKnowledgeBase().catch(console.error);
