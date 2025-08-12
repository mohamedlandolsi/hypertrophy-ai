const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWorkoutKeywordDetection() {
  try {
    console.log('🔍 Testing Workout Keyword Detection...\n');
    
    const testQueries = [
      "Design a complete, evidence-based leg workout",
      "Design a complete, evidence-based arm workout", 
      "How many sets and reps for leg training",
      "Create a chest workout program",
      "What rest periods for muscle growth",
      "How to train biceps effectively"
    ];
    
    // The exact keyword list from gemini.ts
    const workoutKeywords = [
      'workout', 'training', 'exercise', 'program', 'routine',
      'design', 'create', 'build', 'structure', 'plan',
      'complete', 'effective', 'optimal', 'best',
      'rep', 'reps', 'set', 'sets', 'rest', 'progression',
      'muscle', 'chest', 'back', 'legs', 'arms', 'shoulders',
      'bicep', 'tricep', 'quad', 'hamstring', 'glute', 'calves'
    ];
    
    testQueries.forEach(query => {
      console.log(`📝 Query: "${query}"`);
      
      const isWorkoutProgrammingQuery = workoutKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      );
      
      console.log(`   Detected as workout programming query: ${isWorkoutProgrammingQuery ? '✅' : '❌'}`);
      
      if (isWorkoutProgrammingQuery) {
        const matchingKeywords = workoutKeywords.filter(keyword => 
          query.toLowerCase().includes(keyword.toLowerCase())
        );
        console.log(`   Matching keywords: ${matchingKeywords.join(', ')}`);
      }
      console.log();
    });
    
    // Test the problematic leg workout query specifically
    const legQuery = "Design a complete, evidence-based leg workout";
    console.log(`🎯 Specific test: "${legQuery}"`);
    
    const isDetected = workoutKeywords.some(keyword => 
      legQuery.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`Detected: ${isDetected}`);
    
    if (isDetected) {
      console.log('✅ Should trigger comprehensive workout retrieval');
      
      // Test the programming queries that should be generated
      const programmingQueries = [
        'sets reps repetitions hypertrophy',
        'rest periods between sets muscle growth',
        'training volume muscle building'
      ];
      
      console.log('\n📊 Programming queries that should be executed:');
      programmingQueries.forEach((progQuery, i) => {
        console.log(`${i + 1}. "${progQuery}"`);
      });
      
    } else {
      console.log('❌ Should NOT trigger comprehensive workout retrieval');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkoutKeywordDetection();
