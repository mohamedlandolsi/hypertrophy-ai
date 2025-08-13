const { PrismaClient } = require('@prisma/client');

async function testExerciseRetrieval() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Exercise Retrieval for Workout Requests...\n');
    
    // Test specific exercise queries
    const queries = [
      "chest exercises",
      "shoulder exercises", 
      "leg exercises",
      "upper body workout",
      "push exercises",
      "bench press variations"
    ];
    
    for (const query of queries) {
      console.log(`🔍 Query: "${query}"`);
      console.log('='.repeat(40));
      
      // Search for chunks that contain exercise information
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          OR: [
            {
              content: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: query.split(' ')[0], // first word like "chest", "shoulder"
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
        take: 5
      });
      
      console.log(`📄 Found ${chunks.length} relevant chunks`);
      
      if (chunks.length > 0) {
        console.log('📝 Sample Content:');
        chunks.forEach((chunk, index) => {
          console.log(`${index + 1}. ${chunk.knowledgeItem.title}`);
          // Look for exercise names in the content
          const exerciseMatches = chunk.content.match(/\b\w+\s+(press|curl|row|squat|deadlift|pull|push|fly|extension|raise)\b/gi);
          if (exerciseMatches) {
            console.log(`   Exercises mentioned: ${exerciseMatches.slice(0, 3).join(', ')}`);
          }
          console.log(`   Content: ${chunk.content.substring(0, 150)}...`);
          console.log('');
        });
      } else {
        console.log('⚠️ No chunks found for this query');
      }
      
      console.log('\n');
    }
    
    // Check for specific exercise guides
    console.log('🎯 Looking for dedicated exercise guides...\n');
    
    const exerciseGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          {
            title: {
              contains: 'Upper Body Workout',
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: 'Lower Body Workout',
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: 'Exercise',
              mode: 'insensitive'
            }
          }
        ],
        status: 'READY'
      },
      select: {
        title: true,
        _count: {
          select: {
            chunks: true
          }
        }
      }
    });
    
    console.log('📚 Exercise-specific guides:');
    exerciseGuides.forEach((guide, index) => {
      console.log(`${index + 1}. ${guide.title} (${guide._count.chunks} chunks)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testExerciseRetrieval();
