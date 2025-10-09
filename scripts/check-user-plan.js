const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: '9104e76a-a73e-412b-b8d6-03064ce37347' },
      include: { subscription: true }
    });
    
    console.log('User plan:', user?.plan);
    console.log('Subscription data:', user?.subscription);
    
    if (user?.plan === 'PRO') {
      console.log('✅ User successfully upgraded to Pro!');
    } else {
      console.log('❌ User is still on Free plan');
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
