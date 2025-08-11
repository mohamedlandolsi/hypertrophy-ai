const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExerciseGuides() {
  try {
    // Check upper body guide
    const upperGuide = await prisma.knowledgeItem.findFirst({
      where: { title: { contains: 'Effective Upper Body Workout', mode: 'insensitive' } },
      include: { chunks: { orderBy: { chunkIndex: 'asc' }, take: 3 } }
    });
    
    if (upperGuide) {
      console.log('=== Upper Body Workout Guide ===');
      console.log('Title:', upperGuide.title);
      upperGuide.chunks.forEach(chunk => {
        console.log(`Chunk ${chunk.chunkIndex}:`, chunk.content.substring(0, 500) + '...');
        console.log('');
      });
    }
    
    // Check lower body guide  
    const lowerGuide = await prisma.knowledgeItem.findFirst({
      where: { title: { contains: 'Effective Lower Body Workout', mode: 'insensitive' } },
      include: { chunks: { orderBy: { chunkIndex: 'asc' }, take: 3 } }
    });
    
    if (lowerGuide) {
      console.log('=== Lower Body Workout Guide ===');
      console.log('Title:', lowerGuide.title);
      lowerGuide.chunks.forEach(chunk => {
        console.log(`Chunk ${chunk.chunkIndex}:`, chunk.content.substring(0, 500) + '...');
        console.log('');
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExerciseGuides();
