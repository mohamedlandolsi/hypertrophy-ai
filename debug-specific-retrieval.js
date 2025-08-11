const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugSpecificRetrieval() {
  try {
    console.log('🔍 Debugging Specific Knowledge Retrieval Issue...\n');

    // 1. Find the "Lower Body Workout" knowledge item
    const lowerBodyKnowledge = await prisma.knowledgeItem.findMany({
      where: {
        title: {
          contains: 'Lower Body Workout',
          mode: 'insensitive'
        }
      },
      include: {
        chunks: {
          take: 3,
          select: {
            id: true,
            content: true,
            chunkIndex: true,
            embeddingData: true
          }
        }
      }
    });

    console.log(`📚 Found ${lowerBodyKnowledge.length} lower body knowledge items:`);
    lowerBodyKnowledge.forEach(item => {
      console.log(`- "${item.title}" (${item.chunks.length} chunks)`);
    });

    if (lowerBodyKnowledge.length === 0) {
      console.log('❌ No lower body workout knowledge found!');
      
      // Search for any knowledge with "lower" in title
      const anyLower = await prisma.knowledgeItem.findMany({
        where: {
          title: {
            contains: 'lower',
            mode: 'insensitive'
          }
        },
        select: { title: true }
      });
      
      console.log(`🔍 Found ${anyLower.length} items with "lower" in title:`);
      anyLower.forEach(item => console.log(`- ${item.title}`));
      return;
    }

    // 2. Test what would be retrieved for the query "upper/lower program"
    console.log('\n🎯 Testing retrieval for "Give me a complete upper/lower program"...');
    
    const testQueries = [
      'upper lower program',
      'upper/lower program', 
      'lower body workout',
      'upper body workout',
      'complete program',
      'workout structure'
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      // Simulate keyword search
      const keywordResults = await prisma.knowledgeChunk.findMany({
        where: {
          OR: query.split(' ').map(word => ({
            content: {
              contains: word,
              mode: 'insensitive'
            }
          }))
        },
        take: 5,
        include: {
          knowledgeItem: {
            select: {
              title: true
            }
          }
        }
      });

      console.log(`  📝 Keyword search found ${keywordResults.length} chunks:`);
      keywordResults.forEach((chunk, i) => {
        const preview = chunk.content.substring(0, 100) + '...';
        console.log(`    ${i+1}. From "${chunk.knowledgeItem.title}": ${preview}`);
      });
    }

    // 3. Check if the content actually contains what we need
    if (lowerBodyKnowledge.length > 0) {
      const firstItem = lowerBodyKnowledge[0];
      console.log(`\n📖 Examining content of "${firstItem.title}":`);
      
      firstItem.chunks.forEach((chunk, i) => {
        console.log(`\nChunk ${i+1} (${chunk.content.length} chars):`);
        console.log(chunk.content.substring(0, 200) + '...');
        
        // Check if it contains program/structure keywords
        const hasProgram = chunk.content.toLowerCase().includes('program');
        const hasStructure = chunk.content.toLowerCase().includes('structure');
        const hasUpper = chunk.content.toLowerCase().includes('upper');
        const hasLower = chunk.content.toLowerCase().includes('lower');
        
        console.log(`Keywords: program=${hasProgram}, structure=${hasStructure}, upper=${hasUpper}, lower=${hasLower}`);
      });
    }

    console.log('\n✅ Specific retrieval debug complete');

  } catch (error) {
    console.error('❌ Error debugging specific retrieval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSpecificRetrieval();
