/**
 * Fix existing users who don't have onboarding status set
 * Run this once to update existing users
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingUsers() {
  console.log('🔧 Checking existing users onboarding status...');

  try {
    // First, let's see what users exist and their status
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        hasCompletedOnboarding: true,
        clientMemory: {
          select: {
            name: true,
            age: true,
            primaryGoal: true
          }
        }
      }
    });

    console.log(`📊 Found ${allUsers.length} total users`);
    
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}: ${user.id}`);
      console.log(`  - Onboarding completed: ${user.hasCompletedOnboarding}`);
      console.log(`  - Has profile data: ${!!user.clientMemory}`);
      if (user.clientMemory) {
        console.log(`  - Name: ${user.clientMemory.name || 'Not set'}`);
        console.log(`  - Age: ${user.clientMemory.age || 'Not set'}`);
        console.log(`  - Goal: ${user.clientMemory.primaryGoal || 'Not set'}`);
      }
      console.log('');
    });

    // Mark users who already have ClientMemory data as completed onboarding
    const usersWithMemoryButNotCompleted = allUsers.filter(user => 
      !user.hasCompletedOnboarding && 
      user.clientMemory && 
      (user.clientMemory.name || user.clientMemory.age || user.clientMemory.primaryGoal)
    );

    console.log(`🔄 Found ${usersWithMemoryButNotCompleted.length} users with profile data but onboarding marked incomplete`);

    for (const user of usersWithMemoryButNotCompleted) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true }
      });
      console.log(`✅ Marked user ${user.id} as onboarding complete`);
    }

    console.log('🎉 User status check completed!');

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();
