const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchRearDeltExercises() {
  console.log('🔍 Searching for rear delt exercises in knowledge base...\n');
  
  try {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'rear delt', mode: 'insensitive' } },
          { content: { contains: 'posterior delt', mode: 'insensitive' } },
          { content: { contains: 'reverse fly', mode: 'insensitive' } },
          { content: { contains: 'face pull', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      }
    });
    
    console.log(`Found ${chunks.length} relevant chunks:\n`);
    
    chunks.forEach((chunk, index) => {
      console.log(`${index + 1}. Source: ${chunk.knowledgeItem?.title || 'Unknown'}`);
      const lines = chunk.content.split('\n');
      lines.forEach(line => {
        if (line.toLowerCase().includes('rear delt') || 
            line.toLowerCase().includes('posterior delt') || 
            line.toLowerCase().includes('reverse fly') || 
            line.toLowerCase().includes('face pull')) {
          console.log(`   📄 ${line.trim()}`);
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchRearDeltExercises();
