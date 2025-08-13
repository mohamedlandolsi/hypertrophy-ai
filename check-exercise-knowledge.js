const { PrismaClient } = require('@prisma/client');

async function checkExerciseKnowledge() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Exercise Knowledge in Database...\n');
    
    // Get all knowledge items
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY'
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        _count: {
          select: {
            chunks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📚 Total Knowledge Items: ${knowledgeItems.length}`);
    console.log('=====================================');
    
    const exerciseRelated = knowledgeItems.filter(item => 
      item.title.toLowerCase().includes('exercise') ||
      item.title.toLowerCase().includes('workout') ||
      item.title.toLowerCase().includes('movement') ||
      item.fileName?.toLowerCase().includes('exercise')
    );
    
    console.log(`💪 Exercise-related items: ${exerciseRelated.length}`);
    
    if (exerciseRelated.length > 0) {
      console.log('\n🏋️ Exercise-related Knowledge Items:');
      exerciseRelated.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} (${item._count.chunks} chunks)`);
      });
    }
    
    // Check some knowledge chunks for exercise content
    console.log('\n🔍 Searching for exercise content in chunks...');
    
    const exerciseChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          {
            content: {
              contains: 'exercise',
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: 'workout',
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: 'movement',
              mode: 'insensitive'
            }
          }
        ],
        knowledgeItem: {
          status: 'READY'
        }
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 10
    });
    
    console.log(`📄 Exercise-related chunks found: ${exerciseChunks.length}`);
    
    if (exerciseChunks.length > 0) {
      console.log('\n📝 Sample Exercise Content:');
      exerciseChunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`${index + 1}. From: ${chunk.knowledgeItem.title}`);
        console.log(`   Content: ${chunk.content.substring(0, 200)}...`);
        console.log('');
      });
    }
    
    // Check for specific exercise names
    console.log('\n🎯 Searching for specific exercise names...');
    
    const exerciseNames = ['bench press', 'squat', 'deadlift', 'pull up', 'push up', 'row', 'curl', 'press'];
    
    for (const exercise of exerciseNames) {
      const count = await prisma.knowledgeChunk.count({
        where: {
          content: {
            contains: exercise,
            mode: 'insensitive'
          },
          knowledgeItem: {
            status: 'READY'
          }
        }
      });
      
      if (count > 0) {
        console.log(`✅ "${exercise}": ${count} chunks`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExerciseKnowledge();
