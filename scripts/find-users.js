/**
 * Script to find users and their knowledge base status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUsers() {
  console.log('🔍 Finding Users and Knowledge Base Status');
  console.log('=========================================\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        _count: {
          select: {
            knowledgeItems: true,
            chats: true
          }
        }
      }
    });

    console.log(`Found ${users.length} users:`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    for (const user of users) {
      console.log(`\n📍 User: ${user.id}`);
      console.log(`   Knowledge Items: ${user._count.knowledgeItems}`);
      console.log(`   Chats: ${user._count.chats}`);

      // Check if this user has knowledge with embeddings
      if (user._count.knowledgeItems > 0) {
        const knowledgeItems = await prisma.knowledgeItem.findMany({
          where: {
            userId: user.id,
            status: 'READY'
          },
          select: {
            id: true,
            title: true,
            type: true,
            _count: {
              select: {
                chunks: true
              }
            }
          }
        });

        console.log(`   Ready Knowledge Items: ${knowledgeItems.length}`);
        
        if (knowledgeItems.length > 0) {
          for (const item of knowledgeItems) {
            console.log(`     - "${item.title}" (${item.type}) - ${item._count.chunks} chunks`);
          }

          // Check embeddings for this user
          const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
            where: {
              knowledgeItem: {
                userId: user.id
              },
              embeddingData: {
                not: null
              }
            }
          });

          console.log(`   Chunks with embeddings: ${chunksWithEmbeddings}`);
          
          if (chunksWithEmbeddings > 0) {
            console.log(`   ✅ This user has a working knowledge base!`);
          }
        }
      }
    }

    // Find the best user for testing
    console.log('\n📊 Recommended Users for Testing:');
    console.log('─'.repeat(40));
    
    for (const user of users) {
      const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
        where: {
          knowledgeItem: {
            userId: user.id
          },
          embeddingData: {
            not: null
          }
        }
      });

      if (chunksWithEmbeddings > 0) {
        console.log(`✅ User: ${user.id} (${chunksWithEmbeddings} embedded chunks)`);
      }
    }

  } catch (error) {
    console.error('❌ Error finding users:', error.message);
  }
}

// Run the user finder
async function runUserFinder() {
  try {
    await findUsers();
  } catch (error) {
    console.error('❌ User finder failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runUserFinder();
