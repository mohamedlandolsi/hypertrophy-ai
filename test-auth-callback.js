/**
 * Test the auth callback flow
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthFlow() {
  console.log('🧪 Testing auth callback flow...');

  try {
    // Simulate a completely new user ID (like what Supabase would create)
    const testUserId = 'test-new-user-' + Date.now();
    
    console.log(`Testing with new user ID: ${testUserId}`);

    // Simulate what the auth callback does with upsert
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

    console.log(`✅ User created/found with onboarding status: ${appUser.hasCompletedOnboarding}`);

    if (!appUser.hasCompletedOnboarding) {
      console.log('✅ Would redirect to /onboarding');
    } else {
      console.log('❌ Would redirect to /chat (this is wrong for new users)');
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId }
    });
    
    console.log('🧹 Test user cleaned up');

  } catch (error) {
    console.error('❌ Error testing auth flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();
