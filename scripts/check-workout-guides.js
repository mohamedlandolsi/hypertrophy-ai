const { PrismaClient } = require('@prisma/client');

async function checkWorkoutGuides() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Specific Workout Guide Content...\n');
    
    // Get the Upper Body Workout guide
    const upperBodyGuide = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'Structuring an Effective Upper Body Workout',
          mode: 'insensitive'
        },
        status: 'READY'
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });
    
    if (upperBodyGuide) {
      console.log(`📚 Upper Body Guide: "${upperBodyGuide.title}"`);
      console.log(`📄 Total chunks: ${upperBodyGuide.chunks.length}`);
      console.log('=====================================');
      
      // Look for exercise lists in the chunks
      upperBodyGuide.chunks.forEach((chunk, index) => {
        if (chunk.content.toLowerCase().includes('exercise') || 
            chunk.content.includes('•') || 
            chunk.content.includes('-')) {
          console.log(`\n📝 Chunk ${index + 1}:`);
          console.log(chunk.content.substring(0, 500));
          console.log('...\n');
        }
      });
    }
    
    // Check Lower Body guide too
    const lowerBodyGuide = await prisma.knowledgeItem.findFirst({
      where: {
        title: {
          contains: 'Structuring an Effective Lower Body Workout',
          mode: 'insensitive'
        },
        status: 'READY'
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });
    
    if (lowerBodyGuide) {
      console.log(`\n📚 Lower Body Guide: "${lowerBodyGuide.title}"`);
      console.log(`📄 Total chunks: ${lowerBodyGuide.chunks.length}`);
      console.log('=====================================');
      
      // Look for exercise lists in the chunks
      lowerBodyGuide.chunks.forEach((chunk, index) => {
        if (chunk.content.toLowerCase().includes('exercise') || 
            chunk.content.includes('•') || 
            chunk.content.includes('-')) {
          console.log(`\n📝 Chunk ${index + 1}:`);
          console.log(chunk.content.substring(0, 500));
          console.log('...\n');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkoutGuides();
