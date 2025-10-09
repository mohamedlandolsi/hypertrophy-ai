const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({ 
      select: { 
        id: true, 
        role: true,
        hasCompletedOnboarding: true,
        plan: true
      } 
    });
    
    console.log('Prisma Users with roles:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Role: ${user.role}, Plan: ${user.plan}, Onboarded: ${user.hasCompletedOnboarding}`);
    });
    
    // Check if there are any admin users
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\nAdmin users found: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\nAdmin user IDs:');
      adminUsers.forEach(admin => {
        console.log(`- ${admin.id}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
