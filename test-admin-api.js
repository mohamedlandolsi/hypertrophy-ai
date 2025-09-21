const { PrismaClient } = require('@prisma/client');

async function testAdminAPI() {
  const prisma = new PrismaClient();
  
  try {
    // Get one of the admin user IDs
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, role: true, plan: true }
    });
    
    console.log('Admin users found:');
    adminUsers.forEach(admin => {
      console.log(`- ID: ${admin.id}, Role: ${admin.role}, Plan: ${admin.plan}`);
    });
    
    // Test the AI Configuration exists
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (aiConfig) {
      console.log('\nAI Configuration exists in database');
    } else {
      console.log('\nAI Configuration NOT found in database - this might be the issue!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAPI();
