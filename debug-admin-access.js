const { PrismaClient } = require('@prisma/client');

async function debugAuthFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== ADMIN ACCESS DEBUG ===\n');
    
    // Check admin users in Prisma database
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, role: true, plan: true, hasCompletedOnboarding: true }
    });
    
    console.log('Admin users in Prisma database:');
    adminUsers.forEach(admin => {
      console.log(`- ID: ${admin.id}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Plan: ${admin.plan}`);
      console.log(`  Onboarded: ${admin.hasCompletedOnboarding}\n`);
    });
    
    // Check AI Configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { id: true, systemPrompt: true }
    });
    
    if (aiConfig) {
      console.log('✓ AI Configuration exists');
      console.log(`  ID: ${aiConfig.id}`);
      console.log(`  System Prompt Length: ${aiConfig.systemPrompt?.length || 0} characters\n`);
    } else {
      console.log('✗ AI Configuration missing\n');
    }
    
    // Instructions for debugging
    console.log('=== DEBUGGING STEPS ===');
    console.log('1. Make sure you are logged in with one of the admin user IDs listed above');
    console.log('2. The Supabase Auth user ID must match one of the Prisma User IDs');
    console.log('3. You can check your current user ID by going to /api/debug/auth');
    console.log('4. If your Supabase user ID doesn\'t match, you may need to create a Prisma user record');
    
  } catch (error) {
    console.error('Error in debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuthFlow();
