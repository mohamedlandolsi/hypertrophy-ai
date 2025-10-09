/**
 * Reset onboarding status for testing
 * This allows existing users to test the onboarding flow
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetOnboardingForTesting() {
  console.log('🔄 Resetting onboarding status for testing...');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        hasCompletedOnboarding: true,
        clientMemory: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} users`);

    // Reset onboarding status for users without significant profile data
    let resetCount = 0;
    
    for (const user of users) {
      // Only reset if user doesn't have much profile data
      if (!user.clientMemory || !user.clientMemory.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { hasCompletedOnboarding: false }
        });
        console.log(`✅ Reset onboarding for user: ${user.id}`);
        resetCount++;
      } else {
        console.log(`⏭️ Skipped user with profile data: ${user.id} (${user.clientMemory.name})`);
      }
    }

    console.log(`🎉 Reset onboarding for ${resetCount} users`);
    console.log('Now these users will be redirected to onboarding on next login!');

  } catch (error) {
    console.error('❌ Error resetting onboarding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetOnboardingForTesting();
