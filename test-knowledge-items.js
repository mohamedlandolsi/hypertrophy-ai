const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKnowledge() {
  try {
    const items = await prisma.knowledgeItem.findMany({
      select: { id: true, title: true, type: true, status: true },
      take: 5
    });
    console.log('Knowledge items:');
    items.forEach(item => {
      console.log(`- ID: ${item.id}, Title: ${item.title}, Type: ${item.type}, Status: ${item.status}`);
    });
    if (items.length > 0) {
      console.log(`\nTest URL: http://localhost:3000/knowledge/${items[0].id}`);
    } else {
      console.log('\nNo knowledge items found in database.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnowledge();
