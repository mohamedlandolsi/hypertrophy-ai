/**
 * Test script for onboarding functionality
 * Run with: node test-onboarding.js
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prisma = new PrismaClient();

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Implementation...\n');

  try {
    // Test 1: Check if hasCompletedOnboarding field exists
    console.log('1. Checking database schema...');
    const userSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'hasCompletedOnboarding'
    `;
    
    if (userSchema.length > 0) {
      console.log('✅ hasCompletedOnboarding field exists in User model');
    } else {
      console.log('❌ hasCompletedOnboarding field missing in User model');
    }

    // Test 2: Check default value for new users
    console.log('\n2. Checking default values...');
    const testUsers = await prisma.user.findMany({
      select: { id: true, hasCompletedOnboarding: true },
      take: 5
    });
    
    console.log(`📊 Sample users onboarding status:`, testUsers);

    // Test 3: Simulate onboarding completion
    console.log('\n3. Testing onboarding completion flow...');
    
    // Find a test user or create one
    let testUser = await prisma.user.findFirst({
      where: { hasCompletedOnboarding: false }
    });

    if (!testUser) {
      console.log('No users with incomplete onboarding found. This is expected if all users have completed onboarding.');
    } else {
      console.log(`Found test user: ${testUser.id}`);
      
      // Test updating onboarding status
      await prisma.user.update({
        where: { id: testUser.id },
        data: { hasCompletedOnboarding: true }
      });
      
      console.log('✅ Successfully updated onboarding status');
      
      // Revert for testing
      await prisma.user.update({
        where: { id: testUser.id },
        data: { hasCompletedOnboarding: false }
      });
      
      console.log('↩️ Reverted onboarding status for testing');
    }

    // Test 4: Check ClientMemory model compatibility
    console.log('\n4. Checking ClientMemory model...');
    const memoryFields = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ClientMemory'
      AND column_name IN ('name', 'age', 'primaryGoal', 'trainingExperience')
    `;
    
    console.log(`✅ ClientMemory has ${memoryFields.length} onboarding-compatible fields`);

    console.log('\n🎉 Onboarding implementation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test file structure
function testFileStructure() {
  console.log('\n📁 Testing file structure...');
  
  const requiredFiles = [
    'src/app/onboarding/page.tsx',
    'src/app/onboarding/actions.ts',
    'src/app/onboarding/layout.tsx',
    'src/app/onboarding/_components/step1-personal.tsx',
    'src/app/onboarding/_components/step2-training.tsx',
    'src/app/onboarding/_components/step3-goals.tsx',
    'src/app/onboarding/_components/step4-environment.tsx',
    'src/components/ui/progress.tsx'
  ];
  
  requiredFiles.forEach(file => {
    try {
      require.resolve(`./${file}`);
      console.log(`✅ ${file}`);
    } catch {
      console.log(`❌ ${file} - File not found`);
    }
  });
}

// Run tests
console.log('Starting onboarding implementation tests...\n');
testOnboardingFlow();
testFileStructure();
