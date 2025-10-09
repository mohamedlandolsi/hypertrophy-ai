/**
 * Automated Subscription Security & Validation Job
 * 
 * This script should be run periodically (e.g., via cron job) to ensure
 * subscription data integrity and automatically handle expired subscriptions.
 * 
 * Recommended schedule: Every hour
 * Usage: node subscription-security-job.js
 */

console.log('🔒 STARTING SUBSCRIPTION SECURITY CHECK');
console.log('==========================================');
console.log(`Timestamp: ${new Date().toISOString()}`);

async function runSubscriptionSecurityCheck() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    // Import Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    console.log('📊 Checking subscription security...');

    // Find expired active subscriptions
    const now = new Date();
    const expiredActiveSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lte: now
        }
      },
      include: {
        user: true
      }
    });

    console.log(`Found ${expiredActiveSubscriptions.length} expired active subscriptions`);

    // Find PRO users without valid subscriptions
    const proUsersWithoutValidSubs = await prisma.user.findMany({
      where: {
        plan: 'PRO',
        OR: [
          {
            subscription: null
          },
          {
            subscription: {
              OR: [
                { status: { not: 'active' } },
                { currentPeriodEnd: { lte: now } }
              ]
            }
          }
        ]
      },
      include: {
        subscription: true
      }
    });

    console.log(`Found ${proUsersWithoutValidSubs.length} PRO users without valid subscriptions`);

    const actionsPerformed = [];

    // Downgrade expired subscriptions
    for (const subscription of expiredActiveSubscriptions) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' }
      });

      if (subscription.user.plan === 'PRO') {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: 'FREE' }
        });
        actionsPerformed.push(`Downgraded user ${subscription.userId} from PRO to FREE due to expired subscription`);
      }
      
      actionsPerformed.push(`Set subscription ${subscription.id} status to expired`);
    }

    // Downgrade PRO users without valid subscriptions
    for (const user of proUsersWithoutValidSubs) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'FREE' }
      });
      actionsPerformed.push(`Downgraded user ${user.id} from PRO to FREE due to invalid subscription`);
    }

    if (actionsPerformed.length > 0) {
      console.log('\n🔧 ACTIONS PERFORMED:');
      actionsPerformed.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
    } else {
      console.log('\n✅ No security issues found - all subscriptions are valid');
    }

    await prisma.$disconnect();
    console.log('\n✅ Subscription security check completed successfully');
    
    return {
      expiredActiveSubscriptions: expiredActiveSubscriptions.length,
      proUsersWithoutValidSubscriptions: proUsersWithoutValidSubs.length,
      actionsPerformed
    };

  } catch (error) {
    console.error('❌ Error during subscription security check:', error);
    process.exit(1);
  }
}

// Run the check
runSubscriptionSecurityCheck()
  .then(result => {
    console.log('\n📈 FINAL SUMMARY:');
    console.log(`Total expired subscriptions processed: ${result.expiredActiveSubscriptions}`);
    console.log(`Total PRO users downgraded: ${result.proUsersWithoutValidSubscriptions}`);
    console.log(`Total actions: ${result.actionsPerformed.length}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Job failed:', error);
    process.exit(1);
  });

// Health check function
async function healthCheck() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection: OK');
    
    // Test environment variables
    const requiredVars = [
      'LEMONSQUEEZY_API_KEY',
      'LEMONSQUEEZY_WEBHOOK_SECRET',
      'LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID',
      'LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log('⚠️  Missing environment variables:', missingVars);
    } else {
      console.log('✅ Environment variables: OK');
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 SUBSCRIPTION SECURITY JOB STARTED');
  console.log('=====================================\n');
  
  // Perform health check first
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.error('❌ Health check failed - aborting security check');
    process.exit(1);
  }
  
  try {
    await runSubscriptionSecurityCheck();
    console.log('\n🎉 Job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Job failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Received SIGINT - gracefully shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM - gracefully shutting down');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = {
  runSubscriptionSecurityCheck,
  healthCheck
};
