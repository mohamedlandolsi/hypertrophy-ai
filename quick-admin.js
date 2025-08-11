const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeExistingUserAdmin() {
  try {
    // Pick a user that exists in both auth and database from the debug output
    const userId = '51d9022f-8bdc-4e21-b91f-3af5255cbcc6';
    
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' }
    });
    
    console.log('✅ Made user', userId, 'an admin');
    console.log('📧 Check the debug output above to find the email for this user ID');
    console.log('🎯 Log in with that email and try accessing /admin/ai-testing');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeExistingUserAdmin();
