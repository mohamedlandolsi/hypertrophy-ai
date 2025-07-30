const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugKnowledgeChunks() {
  try {
    console.log('🔍 Debugging knowledge base chunking...\n');

    // Get all knowledge items
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        fileName: true,
        createdAt: true,
        userId: true,
        _count: {
          select: {
            chunks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${knowledgeItems.length} knowledge items:\n`);

    if (knowledgeItems.length === 0) {
      console.log('❌ No knowledge items found. Try uploading a file first.');
      return;
    }

    for (const item of knowledgeItems) {
      console.log(`📄 ${item.title} (${item.fileName || 'No file'})`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Chunks: ${item._count.chunks}`);
      console.log(`   Created: ${item.createdAt.toLocaleString()}`);
      console.log(`   User: ${item.userId}`);
      console.log('');

      if (item._count.chunks === 0) {
        console.log(`⚠️ WARNING: "${item.title}" has no chunks!`);
        
        // Check if there are any chunks with wrong knowledgeItemId
        const orphanedChunks = await prisma.knowledgeChunk.findMany({
          where: {
            knowledgeItemId: item.id
          }
        });

        if (orphanedChunks.length > 0) {
          console.log(`   Found ${orphanedChunks.length} chunks that should be linked`);
        } else {
          console.log(`   No chunks found at all - chunking process may have failed`);
        }
        console.log('');
      }
    }

    // Check for orphaned chunks
    const orphanedChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: null
      }
    });

    if (orphanedChunks.length > 0) {
      console.log(`⚠️ Found ${orphanedChunks.length} orphaned chunks (no parent knowledge item)`);
    }

    // Get total chunk statistics
    const totalChunks = await prisma.knowledgeChunk.count();
    console.log(`📈 Total chunks in database: ${totalChunks}`);

    // Get recent chunks
    const recentChunks = await prisma.knowledgeChunk.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        knowledgeItemId: true,
        chunkIndex: true,
        content: true,
        createdAt: true,
        knowledgeItem: {
          select: {
            title: true
          }
        }
      }
    });

    if (recentChunks.length > 0) {
      console.log('\n📝 Recent chunks:');
      for (const chunk of recentChunks) {
        console.log(`   ${chunk.knowledgeItem?.title || 'Unknown'} - Chunk ${chunk.chunkIndex}`);
        console.log(`     Content: ${chunk.content.substring(0, 100)}...`);
        console.log(`     Created: ${chunk.createdAt.toLocaleString()}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error debugging chunks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugKnowledgeChunks();
