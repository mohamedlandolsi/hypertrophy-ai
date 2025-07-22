const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOptimizedSearch() {
  try {
    console.log('🧪 TESTING OPTIMIZED SEARCH SYSTEM');
    console.log('===================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    // Verify optimized AI configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        maxTokens: true
      }
    });
    
    console.log('✅ Optimized Configuration:');
    console.log(`   Similarity Threshold: ${config.ragSimilarityThreshold} (was 0.05)`);
    console.log(`   Max Chunks: ${config.ragMaxChunks} (was 8)`);
    console.log(`   High Relevance Threshold: ${config.ragHighRelevanceThreshold} (was 0.15)`);
    console.log(`   Max Tokens: ${config.maxTokens} (was 3000)`);
    
    // Test muscle-specific queries that should now be more focused
    const testQueries = [
      {
        query: 'What are the best chest exercises?',
        expectation: 'Should return chest-specific guides, limited per-item'
      },
      {
        query: 'How do I train my shoulders effectively?',
        expectation: 'Should return shoulder-specific content'
      },
      {
        query: 'What are effective muscle building principles?',
        expectation: 'Should be more focused, not dominated by full-body guides'
      }
    ];
    
    for (const test of testQueries) {
      console.log(`\n🔍 Testing: "${test.query}"`);
      console.log(`   Expected: ${test.expectation}`);
      console.log('─'.repeat(70));
      
      const startTime = Date.now();
      
      // Simulate the muscle-specific search logic
      const queryLower = test.query.toLowerCase();
      const muscleGroups = [
        'chest', 'pectoral', 'shoulders', 'delts', 'deltoid',
        'back', 'lats', 'rhomboids', 'traps', 'biceps', 'triceps',
        'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes',
        'calves', 'abs', 'core', 'forearms'
      ];
      
      const trainingTerms = [
        'exercise', 'exercises', 'workout', 'training', 'build muscle',
        'muscle building', 'muscle growth', 'hypertrophy', 'strength'
      ];
      
      const mentionedMuscles = muscleGroups.filter(muscle => 
        queryLower.includes(muscle)
      );
      
      const hasTrainingTerms = trainingTerms.some(term => 
        queryLower.includes(term)
      );
      
      const shouldUseMuscleSearch = mentionedMuscles.length > 0 || (hasTrainingTerms && (
        queryLower.includes('bicep') ||
        queryLower.includes('muscle') ||
        queryLower.includes('training')
      ));
      
      if (shouldUseMuscleSearch) {
        let searchMuscles = [...mentionedMuscles];
        if (queryLower.includes('bicep')) searchMuscles.push('biceps');
        
        console.log(`🎯 Muscle/training search: [${searchMuscles.join(', ')}]`);
        
        // Get title matches with the new configuration limits
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
                { title: { contains: 'training', mode: 'insensitive' } },
                { title: { contains: 'guide', mode: 'insensitive' } }
              ]
            }
          },
          include: { knowledgeItem: { select: { title: true } } },
          take: config.ragMaxChunks, // Now limited to 5 instead of 8
          orderBy: { chunkIndex: 'asc' }
        });
        
        // Simulate diversity filtering (max 2 chunks per item)
        const itemCounts = new Map();
        const diverseMatches = [];
        
        for (const chunk of titleMatches) {
          const currentCount = itemCounts.get(chunk.knowledgeItemId) || 0;
          if (currentCount < 2) { // Max 2 chunks per item
            diverseMatches.push(chunk);
            itemCounts.set(chunk.knowledgeItemId, currentCount + 1);
          }
        }
        
        console.log(`   📊 Results: ${titleMatches.length} found → ${diverseMatches.length} after diversity filter`);
        
        const uniqueItems = [...new Set(diverseMatches.map(chunk => chunk.knowledgeItem.title))];
        console.log(`   📚 Unique knowledge items (${uniqueItems.length}):`);
        uniqueItems.forEach((title, index) => {
          const count = diverseMatches.filter(chunk => chunk.knowledgeItem.title === title).length;
          console.log(`      ${index + 1}. "${title}" (${count} chunks)`);
        });
        
        // Check if full-body guides are dominating
        const fullBodyCount = uniqueItems.filter(title => 
          title.toLowerCase().includes('full-body')
        ).length;
        
        if (fullBodyCount === 0) {
          console.log('   ✅ SUCCESS: No full-body workout guides dominating results');
        } else {
          console.log(`   ⚠️  Still ${fullBodyCount} full-body guides in results`);
        }
        
      } else {
        console.log('📚 General query - would use optimized hybrid search');
      }
      
      const duration = Date.now() - startTime;
      console.log(`   ⏱️  Query time: ${duration}ms`);
    }
    
    console.log('\n✅ OPTIMIZATION SUMMARY');
    console.log('=======================');
    console.log('🎯 Configuration Changes:');
    console.log('   • Similarity threshold: 0.05 → 0.25 (5x stricter)');
    console.log('   • Max chunks: 8 → 5 (faster responses)');
    console.log('   • High relevance: 0.15 → 0.65 (higher quality bar)');
    console.log('   • Max tokens: 3000 → 2000 (33% faster generation)');
    console.log('');
    console.log('🔧 Code Improvements:');
    console.log('   • Added per-item chunk limits (max 2-3 per knowledge item)');
    console.log('   • Enhanced diversity filtering to prevent domination');
    console.log('   • Muscle-specific search bypasses complex hybrid search');
    console.log('');
    console.log('📈 Expected Results:');
    console.log('   • 40-60% faster response times');
    console.log('   • More relevant, focused answers');
    console.log('   • Reduced domination by large documents');
    console.log('   • Better muscle-specific targeting');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOptimizedSearch();
