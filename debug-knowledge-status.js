const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKnowledgeBase() {
  try {
    console.log('🔍 Checking Knowledge Base Status...\n');

    // Check knowledge items
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      include: {
        _count: {
          select: { chunks: true }
        }
      }
    });

    console.log(`📚 Knowledge Items: ${knowledgeItems.length}`);
    knowledgeItems.forEach(item => {
      console.log(`   - ${item.title} (${item.status}) - ${item._count.chunks} chunks`);
    });

    // Check knowledge chunks with embeddings
    const totalChunks = await prisma.knowledgeChunk.count();
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });

    console.log(`\n🧩 Total Chunks: ${totalChunks}`);
    console.log(`🎯 Chunks with Embeddings: ${chunksWithEmbeddings}`);

    // Check chunks for ready items only
    const readyChunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null },
        knowledgeItem: {
          status: 'READY'
        }
      }
    });

    console.log(`✅ Ready Chunks with Embeddings: ${readyChunks}`);

    if (readyChunks === 0) {
      console.log('\n❌ ISSUE FOUND: No ready chunks with embeddings available!');
      console.log('   This explains why RAG is returning 0 chunks.');
      
      // Check if items are ready but chunks lack embeddings
      const readyItems = await prisma.knowledgeItem.findMany({
        where: { status: 'READY' },
        include: {
          chunks: {
            select: {
              id: true,
              embeddingData: true
            }
          }
        }
      });

      console.log('\n🔍 Analyzing ready items:');
      readyItems.forEach(item => {
        const chunksWithEmbeddings = item.chunks.filter(chunk => chunk.embeddingData !== null).length;
        const totalChunks = item.chunks.length;
        console.log(`   - ${item.title}: ${chunksWithEmbeddings}/${totalChunks} chunks have embeddings`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnowledgeBase();
