const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpperLowerQuery() {
  try {
    console.log('🔍 Testing Upper/Lower program query retrieval...\n');
    
    // First, let's see what knowledge items contain "upper" or "lower" in their title
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            content: true
          },
          take: 2 // Just first 2 chunks to see content
        }
      },
      where: {
        OR: [
          { title: { contains: 'upper', mode: 'insensitive' } },
          { title: { contains: 'lower', mode: 'insensitive' } },
          { title: { contains: 'split', mode: 'insensitive' } },
          { title: { contains: 'workout', mode: 'insensitive' } },
          { title: { contains: 'program', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Found ${knowledgeItems.length} knowledge items related to programs/splits:\n`);
    
    knowledgeItems.forEach((item, i) => {
      console.log(`${i + 1}. "${item.title}" (${item.type})`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Chunks: ${item.chunks.length > 0 ? item.chunks.length + ' found' : 'No chunks'}`);
      
      if (item.chunks.length > 0) {
        console.log(`   First chunk preview: "${item.chunks[0].content.substring(0, 200)}..."`);
      }
      console.log('');
    });
    
    // Now let's check the chunks table directly for upper/lower content
    console.log('\n🔍 Searching chunks directly for upper/lower content...\n');
    
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'upper lower', mode: 'insensitive' } },
          { content: { contains: 'upper/lower', mode: 'insensitive' } },
          { content: { contains: 'upper body', mode: 'insensitive' } },
          { content: { contains: 'lower body', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        chunkIndex: true,
        content: true,
        knowledgeItem: {
          select: {
            id: true,
            title: true
          }
        }
      },
      take: 10
    });
    
    console.log(`Found ${chunks.length} chunks with upper/lower content:\n`);
    
    chunks.forEach((chunk, i) => {
      console.log(`${i + 1}. From "${chunk.knowledgeItem.title}" (chunk ${chunk.chunkIndex})`);
      console.log(`   Content: "${chunk.content.substring(0, 300)}..."`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error testing RAG system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpperLowerQuery();
