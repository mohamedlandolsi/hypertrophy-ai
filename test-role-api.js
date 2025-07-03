/**
 * Test what happens when user role API creates a user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserRoleAPI() {
  console.log('🧪 Testing user role API flow...');

  try {
    // Simulate a new user ID
    const testUserId = 'test-role-api-' + Date.now();
    
    console.log(`Testing user role API with new user ID: ${testUserId}`);

    // Simulate what the user role API does
    const newUser = await prisma.user.create({
      data: {
        id: testUserId,
        role: 'user',
        hasCompletedOnboarding: false
      }
    });

    console.log('✅ User created by role API:', {
      id: newUser.id,
      role: newUser.role,
      hasCompletedOnboarding: newUser.hasCompletedOnboarding
    });

    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId }
    });
    
    console.log('🧹 Test user cleaned up');

  } catch (error) {
    console.error('❌ Error testing user role API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserRoleAPI();
