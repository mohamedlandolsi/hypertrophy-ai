const { PrismaClient } = require('@prisma/client');

async function testCoachMessage() {
  const prisma = new PrismaClient();
  
  console.log('🧪 Testing Coach Message System...\n');
  
  try {
    // Find available coaches
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
    
    console.log('📋 Available Coaches:');
    coaches.forEach((coach, index) => {
      console.log(`${index + 1}. ID: ${coach.id}, Role: ${coach.role}`);
    });
    
    // Find coach chats
    const chats = await prisma.coachChat.findMany({
      include: {
        messages: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log('\n💬 Coach Chats:');
    chats.forEach((chat, index) => {
      console.log(`${index + 1}. Chat ID: ${chat.id}`);
      console.log(`   User: ${chat.userId}`);
      console.log(`   Coach: ${chat.coachId}`);
      console.log(`   Messages: ${chat.messages.length}`);
    });
    
    if (chats.length > 0) {
      const testChat = chats[0];
      console.log(`\n🔍 Testing with Chat ID: ${testChat.id}`);
      
      // Test message creation (simulating API call)
      const testMessage = await prisma.coachMessage.create({
        data: {
          coachChatId: testChat.id,
          content: 'Test message from debug script',
          senderId: testChat.userId
        }
      });
      
      console.log('✅ Test message created:', {
        id: testMessage.id,
        content: testMessage.content,
        senderId: testMessage.senderId,
        createdAt: testMessage.createdAt
      });
      
      // Clean up test message
      await prisma.coachMessage.delete({
        where: { id: testMessage.id }
      });
      
      console.log('🧹 Test message cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCoachMessage();
