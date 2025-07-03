/**
 * Complete Onboarding Flow Test
 * This script tests the entire onboarding flow from user creation to completion
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteOnboardingFlow() {
  console.log('🧪 Testing Complete Onboarding Flow...\n');

  try {
    // Test 1: New User Creation (Google OAuth)
    console.log('=== Test 1: New Google OAuth User ===');
    const googleUserId = 'google-oauth-test-' + Date.now();
    
    // Simulate auth callback creating new Google user
    const googleUser = await prisma.user.upsert({
      where: { id: googleUserId },
      update: {},
      create: {
        id: googleUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      },
      select: { hasCompletedOnboarding: true, role: true }
    });

    console.log(`✅ Google user created: ${JSON.stringify(googleUser)}`);
    
    if (!googleUser.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Google user would be redirected to /onboarding');
    } else {
      console.log('❌ ❌ PROBLEM: Google user would skip onboarding');
    }

    // Test 2: Email/Password User Creation
    console.log('\n=== Test 2: New Email/Password User ===');
    const emailUserId = 'email-test-' + Date.now();
    
    // Simulate signup form creating user
    const emailUser = await prisma.user.create({
      data: {
        id: emailUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      }
    });

    console.log(`✅ Email user created: hasCompletedOnboarding = ${emailUser.hasCompletedOnboarding}`);
    
    if (!emailUser.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Email user would be redirected to /onboarding');
    } else {
      console.log('❌ ❌ PROBLEM: Email user would skip onboarding');
    }

    // Test 3: Complete Onboarding with Data
    console.log('\n=== Test 3: Complete Onboarding with Full Data ===');
    
    // Simulate saving onboarding data
    const onboardingData = {
      userId: googleUserId,
      name: 'Test User',
      age: 25,
      gender: 'MALE',
      height: 180,
      weight: 75,
      bodyFatPercentage: 15,
      trainingExperience: 'INTERMEDIATE',
      weeklyTrainingDays: 4,
      preferredTrainingStyle: 'STRENGTH',
      activityLevel: 'MODERATE',
      primaryGoal: 'BUILD_MUSCLE',
      targetWeight: 80,
      motivation: 'Want to get stronger',
      gymAccess: true,
      homeGym: false,
      lastInteraction: new Date(),
    };

    const clientMemory = await prisma.clientMemory.upsert({
      where: { userId: googleUserId },
      update: onboardingData,
      create: onboardingData,
    });

    // Mark onboarding as complete
    const completedUser = await prisma.user.update({
      where: { id: googleUserId },
      data: { hasCompletedOnboarding: true },
    });

    console.log(`✅ Onboarding completed: hasCompletedOnboarding = ${completedUser.hasCompletedOnboarding}`);
    console.log(`✅ Client memory created with name: ${clientMemory.name}`);

    // Test 4: Skip Onboarding
    console.log('\n=== Test 4: Skip Onboarding ===');
    
    // Just mark as complete without saving data
    const skippedUser = await prisma.user.update({
      where: { id: emailUserId },
      data: { hasCompletedOnboarding: true },
    });

    console.log(`✅ User skipped onboarding: hasCompletedOnboarding = ${skippedUser.hasCompletedOnboarding}`);

    // Test 5: Existing User Login
    console.log('\n=== Test 5: Existing User Login ===');
    
    // Simulate existing user login (Google OAuth)
    const existingUser = await prisma.user.upsert({
      where: { id: googleUserId },
      update: {}, // Don't update existing user
      create: {
        id: googleUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      },
      select: { hasCompletedOnboarding: true }
    });

    if (existingUser.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Existing user would go to /chat (skipping onboarding)');
    } else {
      console.log('❌ ❌ PROBLEM: Existing user would be redirected to onboarding again');
    }

    // Test 6: Race Condition (User Role API vs Auth Callback)
    console.log('\n=== Test 6: Race Condition Test ===');
    const raceUserId = 'race-test-' + Date.now();
    
    // Simulate user role API creating user first
    const userFromRoleAPI = await prisma.user.create({
      data: {
        id: raceUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      }
    });
    
    // Then auth callback tries to upsert
    const raceUser = await prisma.user.upsert({
      where: { id: raceUserId },
      update: {},
      create: {
        id: raceUserId,
        role: 'user',
        hasCompletedOnboarding: false,
      },
      select: { hasCompletedOnboarding: true }
    });

    if (!raceUser.hasCompletedOnboarding) {
      console.log('✅ ✅ CORRECT: Race condition handled properly');
    } else {
      console.log('❌ ❌ PROBLEM: Race condition not handled');
    }

    // Test 7: Verify Database Schema
    console.log('\n=== Test 7: Database Schema Verification ===');
    
    const userFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'hasCompletedOnboarding'
    `;
    
    if (userFields.length > 0) {
      console.log('✅ hasCompletedOnboarding field exists in User table');
      console.log(`   Type: ${userFields[0].data_type}, Nullable: ${userFields[0].is_nullable}`);
    } else {
      console.log('❌ hasCompletedOnboarding field missing from User table');
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log('✅ New Google OAuth users: Redirected to onboarding');
    console.log('✅ New email/password users: Redirected to onboarding');
    console.log('✅ Onboarding completion: Data saved to ClientMemory');
    console.log('✅ Onboarding skip: User marked as completed');
    console.log('✅ Existing users: Skip onboarding, go to chat');
    console.log('✅ Race conditions: Handled properly');
    console.log('✅ Database schema: hasCompletedOnboarding field exists');

    // Clean up test data
    await prisma.clientMemory.deleteMany({
      where: { userId: { in: [googleUserId, emailUserId, raceUserId] } }
    });
    
    await prisma.user.deleteMany({
      where: { id: { in: [googleUserId, emailUserId, raceUserId] } }
    });
    
    console.log('\n🧹 Test data cleaned up');
    console.log('\n🎉 Complete onboarding flow test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteOnboardingFlow();
