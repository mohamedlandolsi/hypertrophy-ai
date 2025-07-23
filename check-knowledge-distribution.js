const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkKnowledgeDistribution() {
  try {
    console.log('📊 Checking Knowledge Base Distribution...\n');

    // Get all knowledge items with their chunk counts
    const items = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            chunks: {
              where: {
                embeddingData: { not: null }
              }
            }
          }
        }
      },
      orderBy: {
        chunks: {
          _count: 'desc'
        }
      }
    });

    console.log(`📚 Knowledge Items (${items.length} total):`);
    items.slice(0, 15).forEach((item, i) => {
      console.log(`${i + 1}. "${item.title}" - ${item._count.chunks} chunks`);
    });

    // Now test with chunks from multiple sources
    const chunksFromMultipleSources = await prisma.knowledgeChunk.findMany({
      where: {
        embeddingData: { not: null },
        knowledgeItem: { status: 'READY' }
      },
      include: {
        knowledgeItem: {
          select: { id: true, title: true }
        }
      },
      take: 100,
      orderBy: {
        knowledgeItem: {
          title: 'asc'
        }
      }
    });

    const uniqueSources = new Set(chunksFromMultipleSources.map(c => c.knowledgeItem.title));
    console.log(`\n🔍 Sample of 100 chunks comes from ${uniqueSources.size} unique sources:`);
    
    const sourceCount = {};
    chunksFromMultipleSources.forEach(chunk => {
      sourceCount[chunk.knowledgeItem.title] = (sourceCount[chunk.knowledgeItem.title] || 0) + 1;
    });

    Object.entries(sourceCount).slice(0, 10).forEach(([title, count]) => {
      console.log(`- "${title.substring(0, 60)}...": ${count} chunks`);
    });

  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnowledgeDistribution().catch(console.error);
