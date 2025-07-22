const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDirectKeywordSearch() {
  try {
    console.log('🔧 CREATING DIRECT KEYWORD SEARCH FIX');
    console.log('=====================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const testQuery = 'What are the best chest exercises for muscle growth?';
    
    console.log(`Query: "${testQuery}"`);
    
    // Detect muscle-specific terms
    const muscleGroups = [
      'chest', 'pectoral', 'shoulders', 'delts', 'deltoid',
      'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
      'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
      'calves', 'abs', 'core', 'forearms'
    ];
    
    const queryLower = testQuery.toLowerCase();
    const mentionedMuscles = muscleGroups.filter(muscle => 
      queryLower.includes(muscle)
    );
    
    console.log(`Detected muscle groups: [${mentionedMuscles.join(', ')}]`);
    
    if (mentionedMuscles.length > 0) {
      console.log('🎯 Using muscle-specific search strategy...');
      
      // Priority 1: Title matches for mentioned muscles
      const titleMatches = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: {
            userId: userId,
            status: 'READY',
            OR: mentionedMuscles.map(muscle => ({
              title: {
                contains: muscle,
                mode: 'insensitive'
              }
            }))
          }
        },
        include: { knowledgeItem: { select: { title: true } } },
        take: 8,
        orderBy: { chunkIndex: 'asc' }
      });
      
      console.log(`\n📚 Title matches found: ${titleMatches.length}`);
      titleMatches.forEach((chunk, index) => {
        console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
      });
      
      if (titleMatches.length >= 5) {
        console.log('\n✅ SUCCESS: Found enough muscle-specific title matches!');
        console.log('   This should be the primary result set.');
        
        // Group by knowledge item
        const itemGroups = {};
        titleMatches.forEach(chunk => {
          const title = chunk.knowledgeItem.title;
          if (!itemGroups[title]) {
            itemGroups[title] = [];
          }
          itemGroups[title].push(chunk);
        });
        
        console.log('\n📊 Content diversity:');
        Object.entries(itemGroups).forEach(([title, chunks]) => {
          console.log(`   • "${title}": ${chunks.length} chunks`);
        });
        
      } else {
        console.log('\n⚠️  LIMITED: Need to supplement with content matches');
        
        // Priority 2: Content matches
        const contentMatches = await prisma.knowledgeChunk.findMany({
          where: {
            knowledgeItem: { userId: userId, status: 'READY' },
            OR: mentionedMuscles.map(muscle => ({
              content: {
                contains: muscle,
                mode: 'insensitive'
              }
            })),
            NOT: {
              id: { in: titleMatches.map(chunk => chunk.id) }
            }
          },
          include: { knowledgeItem: { select: { title: true } } },
          take: 8 - titleMatches.length
        });
        
        console.log(`   + ${contentMatches.length} content matches`);
        console.log(`   Total: ${titleMatches.length + contentMatches.length} chunks`);
      }
    }
    
    console.log('\n🔧 IMPLEMENTATION STRATEGY:');
    console.log('============================');
    console.log('1. Detect muscle group terms in query');
    console.log('2. If muscle terms found, prioritize title matches');
    console.log('3. Supplement with content matches if needed');
    console.log('4. Skip hybrid search complexity for muscle queries');
    console.log('5. This should give instant, accurate results');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDirectKeywordSearch();
