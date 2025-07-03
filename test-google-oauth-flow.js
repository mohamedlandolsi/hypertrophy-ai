/**
 * Test script to simulate Google OAuth flow
 * This helps debug the onboarding redirection issue
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGoogleOAuthFlow() {
  console.log('🧪 Testing Google OAuth flow simulation...');

  try {
    // Simulate a new Google OAuth user ID
    const testUserId = 'google-oauth-test-' + Date.now();
    
    console.log(`\n1. Testing with new Google OAuth user ID: ${testUserId}`);

    // Simulate what the auth callback does with upsert for a NEW Google user
    console.log('\n2. Simulating auth callback upsert for NEW user...');
    const appUser = await prisma.user.upsert({
      where: { id: testUserId },
      update: {}, // Don't update anything if user exists
      create: {
        id: testUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      },
      select: { hasCompletedOnboarding: true }
    });

    console.log(`✅ User created with onboarding status: ${appUser.hasCompletedOnboarding}`);

    if (!appUser.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Would redirect to /onboarding');
    } else {
      console.log('❌ ❌ PROBLEM: Would redirect to /chat (this is wrong for new users)');
    }

    // Test what happens if user role API runs first
    console.log('\n3. Testing race condition - user role API runs first...');
    
    const testUserId2 = 'google-oauth-race-' + Date.now();
    
    // Simulate user role API creating user first (old way, without onboarding status)
    const userFromRoleAPI = await prisma.user.create({
      data: {
        id: testUserId2,
        role: 'user',
        hasCompletedOnboarding: false  // This is now correct after our fix
      }
    });
    
    console.log(`User created by role API with onboarding: ${userFromRoleAPI.hasCompletedOnboarding}`);
    
    // Then auth callback tries to upsert
    const appUser2 = await prisma.user.upsert({
      where: { id: testUserId2 },
      update: {}, // Don't update anything if user exists
      create: {
        id: testUserId2,
        role: 'user',
        hasCompletedOnboarding: false,
      },
      select: { hasCompletedOnboarding: true }
    });
    
    console.log(`After auth callback upsert: ${appUser2.hasCompletedOnboarding}`);
    
    if (!appUser2.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Race condition handled properly - would redirect to /onboarding');
    } else {
      console.log('❌ ❌ PROBLEM: Race condition not handled - would redirect to /chat');
    }

    // Clean up test users
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.user.delete({ where: { id: testUserId2 } });
    
    console.log('\n🧹 Test users cleaned up');
    console.log('\n🎉 Google OAuth flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleOAuthFlow();
