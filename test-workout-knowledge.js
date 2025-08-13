const { PrismaClient } = require('@prisma/client');
const { fetchKnowledgeContext } = require('./src/lib/vector-search');

async function testWorkoutKnowledge() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏋️ Testing Workout Knowledge Retrieval...\n');
    
    const queries = [
      "Give me chest exercises",
      "Create a push workout",
      "What are the best exercises for shoulders", 
      "Design a leg workout",
      "Upper body exercises for muscle growth"
    ];
    
    for (const query of queries) {
      console.log(`🔍 Testing Query: "${query}"`);
      console.log('='.repeat(50));
      
      try {
        const knowledge = await fetchKnowledgeContext(query, 10, 0.1);
        
        console.log(`📚 Retrieved ${knowledge.length} knowledge chunks`);
        
        if (knowledge.length > 0) {
          console.log('📄 Top 3 Results:');
          knowledge.slice(0, 3).forEach((chunk, index) => {
            console.log(`${index + 1}. ${chunk.title} (Score: ${chunk.score.toFixed(3)})`);
            console.log(`   Content Preview: ${chunk.content.substring(0, 150)}...`);
          });
          
          // Check if we have exercise-specific content
          const exerciseRelated = knowledge.filter(chunk => 
            chunk.content.toLowerCase().includes('exercise') ||
            chunk.title.toLowerCase().includes('exercise') ||
            chunk.content.toLowerCase().includes('workout') ||
            chunk.content.toLowerCase().includes('movement')
          );
          
          console.log(`💪 Exercise-related chunks: ${exerciseRelated.length}/${knowledge.length}`);
        } else {
          console.log('⚠️ No knowledge retrieved for this query');
        }
        
      } catch (error) {
        console.log(`❌ Error retrieving knowledge: ${error.message}`);
      }
      
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkoutKnowledge();
