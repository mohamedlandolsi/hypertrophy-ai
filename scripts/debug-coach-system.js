const { PrismaClient } = require('@prisma/client');

async function debugCoachSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Coach System...\n');
    
    // Check all users and their roles
    console.log('👥 All Users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        hasCompletedOnboarding: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Role: ${user.role}, Onboarded: ${user.hasCompletedOnboarding}`);
    });
    
    // Check coach users specifically
    console.log('\n👨‍💼 Coach Users:');
    const coaches = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'coach' },
          { role: { contains: 'coach' } }
        ]
      },
      select: {
        id: true,
        role: true,
      }
    });
    
    console.log(`Found ${coaches.length} coaches:`);
    coaches.forEach((coach, index) => {
      console.log(`${index + 1}. ID: ${coach.id}, Role: ${coach.role}`);
    });
    
    // Check coach chats
    console.log('\n💬 Coach Chats:');
    const coachChats = await prisma.coachChat.findMany({
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
    
    console.log(`Found ${coachChats.length} coach chats:`);
    coachChats.forEach((chat, index) => {
      console.log(`${index + 1}. ID: ${chat.id}, User: ${chat.userId}, Coach: ${chat.coachId}, Messages: ${chat._count.messages}`);
    });
    
    // Check coach messages
    console.log('\n📨 Coach Messages:');
    const coachMessages = await prisma.coachMessage.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        coachChat: {
          select: {
            id: true,
            userId: true,
            coachId: true
          }
        }
      }
    });
    
    console.log(`Found ${coachMessages.length} recent coach messages:`);
    coachMessages.forEach((message, index) => {
      console.log(`${index + 1}. From: ${message.senderId}, Content: ${message.content.substring(0, 50)}...`);
    });
    
    console.log('\n✅ Coach system debug complete!');
    
  } catch (error) {
    console.error('❌ Error debugging coach system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCoachSystem();
