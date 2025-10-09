const { PrismaClient } = require('@prisma/client');

async function checkCurrentRoles() {
  const prisma = new PrismaClient();
  
  try {
    // Get all distinct roles currently in the database
    const users = await prisma.user.findMany({
      select: {
        role: true,
        id: true
      }
    });
    
    const roleCounts = {};
    users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('Current role distribution:');
    console.log(roleCounts);
    
    console.log('\nTotal users:', users.length);
    
    // Show a few examples
    console.log('\nFirst 5 users:');
    users.slice(0, 5).forEach(user => {
      console.log(`ID: ${user.id}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRoles();
