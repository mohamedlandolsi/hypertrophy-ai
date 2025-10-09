/**
 * Webhook Security Monitor
 * 
 * This script monitors webhook events and security metrics
 * Usage: node webhook-monitor.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorWebhookSecurity() {
  console.log('🔍 WEBHOOK SECURITY MONITOR');
  console.log('============================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Check for recent webhook activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get recent subscriptions (webhook activity indicator)
    const recentSubscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      include: {
        user: {
          select: {
            id: true,
            plan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 RECENT ACTIVITY (Last 24 hours):`);
    console.log(`New subscriptions: ${recentSubscriptions.length}`);

    if (recentSubscriptions.length > 0) {
      console.log('\n🔍 Recent Subscription Details:');
      recentSubscriptions.forEach((sub, index) => {
        console.log(`${index + 1}. User: ${sub.userId.substring(0, 8)}...`);
        console.log(`   Plan: ${sub.user.plan}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Created: ${sub.createdAt.toISOString()}`);
        console.log(`   Period: ${sub.currentPeriodStart} → ${sub.currentPeriodEnd}`);
      });
    }

    // Check for subscription anomalies
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });

    const proUsers = await prisma.user.count({
      where: { plan: 'PRO' }
    });

    const freeUsers = await prisma.user.count({
      where: { plan: 'FREE' }
    });

    console.log(`\n📈 CURRENT METRICS:`);
    console.log(`Active subscriptions: ${activeSubscriptions}`);
    console.log(`PRO users: ${proUsers}`);
    console.log(`FREE users: ${freeUsers}`);

    // Anomaly detection
    const anomalies = [];
    
    if (proUsers > activeSubscriptions) {
      anomalies.push(`⚠️  More PRO users (${proUsers}) than active subscriptions (${activeSubscriptions})`);
    }

    // Check for expired active subscriptions
    const now = new Date();
    const expiredActive = await prisma.subscription.count({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lte: now
        }
      }
    });

    if (expiredActive > 0) {
      anomalies.push(`⚠️  Found ${expiredActive} expired active subscriptions`);
    }

    // Check for PRO users without subscriptions
    const proWithoutSub = await prisma.user.count({
      where: {
        plan: 'PRO',
        subscription: null
      }
    });

    if (proWithoutSub > 0) {
      anomalies.push(`⚠️  Found ${proWithoutSub} PRO users without subscriptions`);
    }

    if (anomalies.length > 0) {
      console.log(`\n🚨 SECURITY ANOMALIES DETECTED:`);
      anomalies.forEach((anomaly, index) => {
        console.log(`${index + 1}. ${anomaly}`);
      });
      console.log(`\n💡 Run 'node subscription-security-job.js' to fix these issues`);
    } else {
      console.log(`\n✅ No security anomalies detected`);
    }

    // Security health score
    const healthScore = anomalies.length === 0 ? 100 : Math.max(0, 100 - (anomalies.length * 25));
    console.log(`\n🎯 SECURITY HEALTH SCORE: ${healthScore}%`);

    if (healthScore < 100) {
      console.log(`🔧 Recommendation: Run security validation to fix issues`);
    }

    await prisma.$disconnect();
    console.log('\n✅ Webhook security monitoring completed');

    return {
      recentSubscriptions: recentSubscriptions.length,
      activeSubscriptions,
      proUsers,
      freeUsers,
      anomalies: anomalies.length,
      healthScore
    };

  } catch (error) {
    console.error('❌ Error during webhook monitoring:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the monitor
monitorWebhookSecurity()
  .then(result => {
    console.log('\n📋 SUMMARY:');
    console.log(`Recent activity: ${result.recentSubscriptions} new subscriptions`);
    console.log(`Current status: ${result.proUsers} PRO, ${result.freeUsers} FREE users`);
    console.log(`Health score: ${result.healthScore}%`);
    
    if (result.anomalies > 0) {
      console.log(`Security issues: ${result.anomalies} anomalies detected`);
      process.exit(1); // Exit with error code for alerting
    } else {
      console.log('Security status: All systems healthy ✅');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
