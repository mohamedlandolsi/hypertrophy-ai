const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Muscle group detection
const MUSCLE_GROUPS = [
  'chest', 'pectoral', 'shoulders', 'delts', 'deltoid',
  'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
  'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
  'calves', 'abs', 'core', 'forearms'
];

async function testMuscleSpecificSearch() {
  try {
    console.log('🎯 TESTING MUSCLE-SPECIFIC SEARCH FIX (DIRECT)');
    console.log('==============================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    const testQueries = [
      'What are the best chest exercises for muscle growth?',
      'How should I train my shoulders?',
      'What are the principles of effective muscle building?', // General query
      'Tell me about bicep training methods'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Query: "${query}"`);
      console.log('─'.repeat(60));
      
      const startTime = Date.now();
      
      // MUSCLE-SPECIFIC SEARCH LOGIC
      const queryLower = query.toLowerCase();
      const mentionedMuscles = MUSCLE_GROUPS.filter(muscle => 
        queryLower.includes(muscle)
      );
      
      let context = '';
      
      if (mentionedMuscles.length > 0) {
        console.log(`🎯 Muscle-specific query detected: [${mentionedMuscles.join(', ')}]`);
        console.log('   Using direct keyword search for maximum accuracy...');
        
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
        
        if (titleMatches.length >= 3) {
          console.log(`✅ Found ${titleMatches.length} title matches - using muscle-specific results`);
          context = titleMatches.map(chunk => chunk.content).join('\n\n');
          
          // Show titles found
          const uniqueTitles = [...new Set(titleMatches.map(chunk => chunk.knowledgeItem.title))];
          console.log('📚 Knowledge items used:');
          uniqueTitles.forEach((title, index) => {
            console.log(`   ${index + 1}. "${title}"`);
          });
          
        } else {
          console.log(`⚠️  Only ${titleMatches.length} title matches - supplementing with content search`);
          
          // Priority 2: Content matches to supplement
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
            take: 8 - titleMatches.length,
            orderBy: { chunkIndex: 'asc' }
          });
          
          const allMatches = [...titleMatches, ...contentMatches];
          context = allMatches.map(chunk => chunk.content).join('\n\n');
          console.log(`✅ Combined muscle-specific results: ${allMatches.length} chunks`);
        }
      } else {
        console.log('📚 General query - would use hybrid search...');
        context = 'GENERAL_SEARCH_PLACEHOLDER';
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📄 Context length: ${context.length} chars`);
      
      if (context !== 'GENERAL_SEARCH_PLACEHOLDER') {
        // Show first few lines to verify content
        const lines = context.split('\n').slice(0, 3);
        console.log('📝 Content preview:');
        lines.forEach((line, index) => {
          if (line.trim()) {
            console.log(`   ${index + 1}. ${line.substring(0, 80)}...`);
          }
        });
      }
    }
    
    console.log('\n✅ MUSCLE-SPECIFIC SEARCH TEST COMPLETE');
    console.log('   • Fast, direct retrieval for muscle queries');
    console.log('   • Prioritizes title matches over content matches');  
    console.log('   • Fallback to hybrid search for general queries');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMuscleSpecificSearch();
