const { PrismaClient } = require('@prisma/client');

async function restoreAdminUsers() {
  const prisma = new PrismaClient();
  
  try {
    // These were the previous admin user IDs
    const previousAdminIds = [
      '34f682d8-157d-4e1d-97e2-bcf13f03f869',
      '9104e76a-a73e-412b-b8d6-03064ce37347', 
      '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba'
    ];
    
    console.log('Restoring admin roles for users...');
    
    for (const userId of previousAdminIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, plan: true }
      });
      
      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'admin' }
        });
        console.log(`✓ Restored admin role for user ${userId} (Plan: ${user.plan})`);
      } else {
        console.log(`✗ User ${userId} not found`);
      }
    }
    
    // Verify the restoration
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, role: true, plan: true, hasCompletedOnboarding: true }
    });
    
    console.log(`\nAdmin users after restoration: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`- ID: ${admin.id}, Role: ${admin.role}, Plan: ${admin.plan}, Onboarded: ${admin.hasCompletedOnboarding}`);
    });
    
  } catch (error) {
    console.error('Error restoring admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdminUsers();
