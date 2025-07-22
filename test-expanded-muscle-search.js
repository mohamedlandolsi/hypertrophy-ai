const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Muscle group detection
const MUSCLE_GROUPS = [
  'chest', 'pectoral', 'shoulders', 'delts', 'deltoid',
  'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
  'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
  'calves', 'abs', 'core', 'forearms'
];

// Training-related terms that should also use muscle-specific search
const TRAINING_TERMS = [
  'exercise', 'exercises', 'workout', 'training', 'build muscle',
  'muscle building', 'muscle growth', 'hypertrophy', 'strength'
];

async function testExpandedMuscleSearch() {
  try {
    console.log('🎯 TESTING EXPANDED MUSCLE-SPECIFIC SEARCH');
    console.log('==========================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    const testQueries = [
      'What are the best chest exercises for muscle growth?', // Direct muscle + training
      'How should I train my shoulders?', // Direct muscle + training
      'Tell me about bicep training methods', // Variation + training
      'What are the principles of effective muscle building?', // General training
      'How do I build strength?', // Training term
      'What foods should I eat?' // Non-training query
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Query: "${query}"`);
      console.log('─'.repeat(60));
      
      const startTime = Date.now();
      
      // EXPANDED MUSCLE-SPECIFIC SEARCH LOGIC
      const queryLower = query.toLowerCase();
      const mentionedMuscles = MUSCLE_GROUPS.filter(muscle => 
        queryLower.includes(muscle)
      );
      
      // Also check for general training terms with muscle context
      const hasTrainingTerms = TRAINING_TERMS.some(term => 
        queryLower.includes(term)
      );
      
      // Use muscle-specific search for:
      // 1. Direct muscle mentions (chest, biceps, etc.)
      // 2. Training terms in combination with muscle context
      // 3. "bicep" variations caught by includes()
      const shouldUseMuscleSearch = mentionedMuscles.length > 0 || (hasTrainingTerms && (
        queryLower.includes('bicep') || // Catches "bicep training methods"
        queryLower.includes('muscle') ||
        queryLower.includes('training')
      ));
      
      let context = '';
      
      if (shouldUseMuscleSearch) {
        // Expand muscle search to include variations
        let searchMuscles = [...mentionedMuscles];
        if (queryLower.includes('bicep')) searchMuscles.push('biceps');
        
        console.log(`🎯 Muscle/training query detected: [${searchMuscles.join(', ')}]`);
        console.log('   Using direct keyword search for maximum accuracy...');
        
        // Priority 1: Title matches for mentioned muscles or training terms
        const titleMatches = await prisma.knowledgeChunk.findMany({
          where: {
            knowledgeItem: {
              userId: userId,
              status: 'READY',
              OR: searchMuscles.length > 0 ? searchMuscles.map(muscle => ({
                title: {
                  contains: muscle,
                  mode: 'insensitive'
                }
              })) : [
                // Fallback for general training terms
                { title: { contains: 'training', mode: 'insensitive' } },
                { title: { contains: 'guide', mode: 'insensitive' } },
                { title: { contains: 'exercise', mode: 'insensitive' } }
              ]
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
          console.log(`⚠️  Only ${titleMatches.length} title matches - supplementing`);
          context = titleMatches.map(chunk => chunk.content).join('\n\n') || 'LIMITED_RESULTS';
        }
        
      } else {
        console.log('📚 General query - would use hybrid search...');
        context = 'GENERAL_SEARCH_PLACEHOLDER';
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📄 Context length: ${context.length} chars`);
      
      if (context !== 'GENERAL_SEARCH_PLACEHOLDER' && context !== 'LIMITED_RESULTS') {
        // Show first line to verify content
        const firstLine = context.split('\n')[0];
        if (firstLine.trim()) {
          console.log(`📝 Content preview: ${firstLine.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n✅ EXPANDED MUSCLE-SPECIFIC SEARCH TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExpandedMuscleSearch();
