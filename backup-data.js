const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function backupUserData() {
  const prisma = new PrismaClient();
  
  try {
    // Backup all users with their important data
    const users = await prisma.user.findMany({
      include: {
        chats: {
          include: {
            messages: true
          }
        },
        clientMemory: true,
        knowledgeItems: {
          include: {
            chunks: true
          }
        },
        subscription: true
      }
    });
    
    // Backup AI Configuration 
    const aiConfig = await prisma.aIConfiguration.findFirst();
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      users: users,
      aiConfiguration: aiConfig
    };
    
    // Write backup to file
    const backupFileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFileName}`);
    console.log(`📊 Backed up ${users.length} users`);
    console.log(`💬 Total chats: ${users.reduce((acc, user) => acc + user.chats.length, 0)}`);
    console.log(`📝 Total messages: ${users.reduce((acc, user) => acc + user.chats.reduce((acc2, chat) => acc2 + chat.messages.length, 0), 0)}`);
    console.log(`📚 Total knowledge items: ${users.reduce((acc, user) => acc + user.knowledgeItems.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupUserData();
