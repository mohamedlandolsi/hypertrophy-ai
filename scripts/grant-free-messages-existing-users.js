const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantFreeMessagesToExistingUsers() {
  try {
    console.log('🎁 Starting to grant 15 free messages to existing users...');
    
    // Get all existing users who have 0 free messages (likely created before this feature)
    const existingUsers = await prisma.user.findMany({
      where: {
        freeMessagesRemaining: {
          lt: 15 // Less than 15, to handle cases where some users might have partial free messages
        }
      },
      select: {
        id: true,
        freeMessagesRemaining: true,
        plan: true,
      }
    });

    console.log(`📊 Found ${existingUsers.length} users who need free messages adjustment`);

    if (existingUsers.length === 0) {
      console.log('✅ All users already have their free messages!');
      return;
    }

    // Update all existing users to have 15 free messages
    const updateResult = await prisma.user.updateMany({
      where: {
        id: {
          in: existingUsers.map(user => user.id)
        }
      },
      data: {
        freeMessagesRemaining: 15
      }
    });

    console.log(`✅ Successfully granted 15 free messages to ${updateResult.count} existing users!`);
    
    // Show breakdown by plan
    const freeUsers = existingUsers.filter(u => u.plan === 'FREE').length;
    const proUsers = existingUsers.filter(u => u.plan === 'PRO').length;
    
    console.log(`📋 Breakdown:`);
    console.log(`   - FREE plan users: ${freeUsers}`);
    console.log(`   - PRO plan users: ${proUsers}`);
    console.log(`   - Total updated: ${updateResult.count}`);

  } catch (error) {
    console.error('❌ Error granting free messages to existing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantFreeMessagesToExistingUsers();
