const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Role: ${user.role}`);
    });
    
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\n👑 Admin users: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      console.log('✅ Admin users found:', adminUsers);
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
