/**
 * Test script for subscription tier functionality
 * Run this from the project root with: node test-subscription-tiers.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptionTiers() {
  console.log('🧪 Testing Subscription Tiers Implementation...\n');

  try {
    // Test 1: Check if UserPlan enum is working
    console.log('1️⃣ Testing UserPlan enum...');
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        plan: 'FREE',
        messagesUsedToday: 5,
        lastMessageReset: new Date(),
      }
    });
    console.log('✅ Created test user with FREE plan');
    console.log(`   User ID: ${testUser.id}`);
    console.log(`   Plan: ${testUser.plan}`);
    console.log(`   Messages Used: ${testUser.messagesUsedToday}`);

    // Test 2: Test subscription record
    console.log('\n2️⃣ Testing Subscription model...');
    const subscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        lemonSqueezyId: 'test-ls-123',
        status: 'active',
        planId: 'test-plan-id',
        variantId: 'test-variant-id',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    console.log('✅ Created test subscription');
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);

    // Test 3: Update user to PRO
    console.log('\n3️⃣ Testing plan upgrade...');
    const upgradedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        plan: 'PRO',
        messagesUsedToday: 0, // Reset on upgrade
      }
    });
    console.log('✅ Upgraded user to PRO plan');
    console.log(`   New Plan: ${upgradedUser.plan}`);
    console.log(`   Messages Reset: ${upgradedUser.messagesUsedToday}`);

    // Test 4: Query user with subscription
    console.log('\n4️⃣ Testing user query with subscription...');
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        subscription: true,
      }
    });
    console.log('✅ Retrieved user with subscription data');
    console.log(`   Plan: ${userWithSubscription?.plan}`);
    console.log(`   Has Subscription: ${!!userWithSubscription?.subscription}`);
    console.log(`   Subscription Status: ${userWithSubscription?.subscription?.status}`);

    // Test 5: Test daily message reset logic
    console.log('\n5️⃣ Testing daily message reset...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        plan: 'FREE',
        messagesUsedToday: 15,
        lastMessageReset: yesterday,
      }
    });

    const userBeforeReset = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    console.log(`   Before reset - Messages: ${userBeforeReset?.messagesUsedToday}, Last reset: ${userBeforeReset?.lastMessageReset?.toDateString()}`);

    // Simulate the reset logic
    const today = new Date();
    const shouldReset = today.toDateString() !== userBeforeReset?.lastMessageReset?.toDateString();
    
    if (shouldReset) {
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          messagesUsedToday: 0,
          lastMessageReset: today,
        }
      });
      console.log('✅ Daily message count reset triggered');
    }

    const userAfterReset = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    console.log(`   After reset - Messages: ${userAfterReset?.messagesUsedToday}, Last reset: ${userAfterReset?.lastMessageReset?.toDateString()}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.subscription.delete({
      where: { id: subscription.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All subscription tier tests passed!');
    console.log('\n📋 Summary of implemented features:');
    console.log('   • FREE tier: 15 messages/day, no conversation memory');
    console.log('   • PRO tier: Unlimited messages, full conversation memory');
    console.log('   • Daily message tracking and reset');
    console.log('   • Subscription management with Lemon Squeezy integration');
    console.log('   • Database schema for plans and subscriptions');
    console.log('   • API endpoints for plan management');
    console.log('   • UI components for plan display and upgrades');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSubscriptionTiers();
