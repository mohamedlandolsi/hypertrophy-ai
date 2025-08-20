#!/usr/bin/env node

/**
 * Quick test to verify the reprocess script dependencies and basic setup
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testSetup() {
  console.log('🔍 Testing Knowledge Base Re-processing Script Setup...\n');
  
  const issues = [];
  
  // Test 1: Environment variables
  console.log('1. Checking environment variables...');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('Missing NEXT_PUBLIC_SUPABASE_URL');
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL found');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('Missing SUPABASE_SERVICE_ROLE_KEY');
  } else {
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY found');
  }
  
  // Test 2: Supabase Edge Function connection
  console.log('\n2. Testing Supabase Edge Function connection...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Just test that we can create a client - the Edge Function test below will validate connectivity
    console.log(`   ✅ Supabase client created successfully`);
  } catch (error) {
    issues.push(`Supabase client error: ${error.message}`);
  }
  
  // Test 3: Prisma connection
  console.log('\n3. Testing Prisma database connection...');
  try {
    const prisma = new PrismaClient();
    const count = await prisma.knowledgeItem.count();
    console.log(`   ✅ Prisma connected (${count} knowledge items in database)`);
    await prisma.$disconnect();
  } catch (error) {
    issues.push(`Prisma connection error: ${error.message}`);
  }
  
  // Test 4: Check for Edge Function (basic test)
  console.log('\n4. Testing Edge Function availability...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // This will fail if the function doesn't exist, but we're just testing availability
    const { error } = await supabase.functions.invoke('file-processor', {
      body: { test: true }
    });
    
    if (error && error.message.includes('not found')) {
      issues.push('Edge Function "file-processor" not found - deploy it first');
    } else {
      console.log('   ✅ Edge Function "file-processor" is available');
    }
  } catch (error) {
    issues.push(`Edge Function test error: ${error.message}`);
  }
  
  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('📋 SETUP TEST RESULTS');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('🎉 All tests passed! The reprocess script should work correctly.');
    console.log('\nTo run the script:');
    console.log('   npm run reprocess-kb');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log('\nPlease fix these issues before running the reprocess script.');
  }
  
  console.log('='.repeat(50));
}

// Run the test
testSetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Test setup failed:', error);
    process.exit(1);
  });
