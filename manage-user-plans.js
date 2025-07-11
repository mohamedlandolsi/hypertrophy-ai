/**
 * Admin script to manage user subscriptions
 * Run this from the project root with: node manage-user-plans.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manageUserPlans() {
  console.log('👑 HypertroQ Subscription Management Tool\n');

  try {
    // List all users with their plans
    console.log('📊 Current User Plans:');
    console.log('─'.repeat(60));
    
    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            chats: true,
            knowledgeItems: true,
          }
        }
      },
      orderBy: {
        plan: 'desc' // PRO users first
      }
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    users.forEach((user, index) => {
      const planEmoji = user.plan === 'PRO' ? '👑' : '🆓';
      const statusEmoji = user.subscription?.status === 'active' ? '✅' : '⏸️';
      
      console.log(`${index + 1}. ${planEmoji} ${user.id.slice(-8)}`);
      console.log(`   Plan: ${user.plan}`);
      console.log(`   Messages Used Today: ${user.messagesUsedToday}/${user.plan === 'FREE' ? '15' : '∞'}`);
      console.log(`   Last Reset: ${user.lastMessageReset.toDateString()}`);
      console.log(`   Chats: ${user._count.chats}, Knowledge Items: ${user._count.knowledgeItems}`);
      console.log(`   Role: ${user.role}`);
      
      if (user.subscription) {
        console.log(`   Subscription: ${statusEmoji} ${user.subscription.status}`);
        if (user.subscription.currentPeriodEnd) {
          console.log(`   Period End: ${new Date(user.subscription.currentPeriodEnd).toDateString()}`);
        }
      }
      console.log('');
    });

    // Summary statistics
    const totalUsers = users.length;
    const proUsers = users.filter(u => u.plan === 'PRO').length;
    const freeUsers = users.filter(u => u.plan === 'FREE').length;
    const activeSubscriptions = users.filter(u => u.subscription?.status === 'active').length;

    console.log('📈 Summary Statistics:');
    console.log('─'.repeat(30));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`PRO Users: ${proUsers} (${Math.round(proUsers/totalUsers*100)}%)`);
    console.log(`FREE Users: ${freeUsers} (${Math.round(freeUsers/totalUsers*100)}%)`);
    console.log(`Active Subscriptions: ${activeSubscriptions}`);

    // Show high usage free users (potential upgrade candidates)
    const highUsageFreeUsers = users.filter(u => 
      u.plan === 'FREE' && u.messagesUsedToday >= 10
    );

    if (highUsageFreeUsers.length > 0) {
      console.log('\n🎯 High Usage FREE Users (Upgrade Candidates):');
      console.log('─'.repeat(50));
      highUsageFreeUsers.forEach(user => {
        console.log(`• ${user.id.slice(-8)} - ${user.messagesUsedToday}/15 messages used`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Utility function to upgrade a user to PRO (for testing)
async function upgradeUserToPro(userId) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'PRO',
        messagesUsedToday: 0,
      }
    });

    // Create a test subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        lemonSqueezyId: `test-${Date.now()}`,
        status: 'active',
        planId: 'pro-plan',
        variantId: 'pro-variant',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        status: 'active',
      }
    });

    console.log(`✅ Upgraded user ${userId.slice(-8)} to PRO`);
  } catch (error) {
    console.error(`❌ Failed to upgrade user: ${error.message}`);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args[0] === 'upgrade' && args[1]) {
  upgradeUserToPro(args[1]).then(() => process.exit(0));
} else {
  manageUserPlans().then(() => process.exit(0));
}

// Usage examples:
// node manage-user-plans.js                    # List all users and their plans
// node manage-user-plans.js upgrade USER_ID    # Upgrade a user to PRO
