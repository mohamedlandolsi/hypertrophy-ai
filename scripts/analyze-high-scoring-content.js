const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeHighScoringContent() {
  try {
    console.log('🔍 ANALYZING HIGH-SCORING CONTENT');
    console.log('==================================');
    
    // Get the chunks that scored highest in our previous test
    const highScoringItems = [
      { title: 'Matching Resistance Profiles to Upper Body Muscles', chunk: 61 },
      { title: 'Matching Resistance Profiles to Upper Body Muscles', chunk: 2 },
      { title: 'Full-Body Workouts for Men: Sample Routines', chunk: 110 },
      { title: 'Recommended Gym Accessories', chunk: 43 }
    ];
    
    for (const item of highScoringItems) {
      console.log(`\n📄 "${item.title}" - Chunk ${item.chunk}:`);
      
      const chunk = await prisma.knowledgeChunk.findFirst({
        where: {
          knowledgeItem: {
            title: { contains: item.title.split(' ').slice(0, 3).join(' '), mode: 'insensitive' }
          },
          chunkIndex: item.chunk
        },
        include: { knowledgeItem: { select: { title: true } } }
      });
      
      if (chunk) {
        console.log('Content:');
        console.log(chunk.content.substring(0, 400) + '...');
        console.log('─'.repeat(60));
        
        // Analyze why this might score highly for "chest exercises for muscle growth"
        const content = chunk.content.toLowerCase();
        const queryTerms = ['chest', 'exercise', 'muscle', 'growth', 'hypertrophy', 'training'];
        
        console.log('Query term analysis:');
        queryTerms.forEach(term => {
          const count = (content.match(new RegExp(term, 'g')) || []).length;
          if (count > 0) {
            console.log(`  - "${term}": ${count} occurrences`);
          }
        });
      } else {
        console.log('❌ Chunk not found');
      }
    }
    
    // Now compare with chest content
    console.log('\n🎯 CHEST CONTENT ANALYSIS:');
    console.log('===========================');
    
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          title: { contains: 'Chest', mode: 'insensitive' }
        }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 5
    });
    
    for (const chunk of chestChunks) {
      console.log(`\n📄 "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}:`);
      console.log('Content:');
      console.log(chunk.content.substring(0, 400) + '...');
      console.log('─'.repeat(60));
      
      // Analyze query terms
      const content = chunk.content.toLowerCase();
      const queryTerms = ['chest', 'exercise', 'muscle', 'growth', 'hypertrophy', 'training'];
      
      console.log('Query term analysis:');
      queryTerms.forEach(term => {
        const count = (content.match(new RegExp(term, 'g')) || []).length;
        if (count > 0) {
          console.log(`  - "${term}": ${count} occurrences`);
        }
      });
    }
    
    console.log('\n💡 ANALYSIS SUMMARY:');
    console.log('====================');
    console.log('This will help us understand why certain content scores higher');
    console.log('than chest-specific content for chest-related queries.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeHighScoringContent();
