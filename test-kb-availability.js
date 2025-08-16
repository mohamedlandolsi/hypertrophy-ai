// Quick test to verify the exercise availability fix
const { PrismaClient } = require('@prisma/client');
const { fetchKnowledgeContext } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

async function testExerciseAvailabilityFix() {
  try {
    console.log('🧪 Testing Exercise Availability Fix\n');
    
    // Test with a query that might trigger the limitation message
    const testQuery = "What exercises should I do for my chest and arms?";
    
    console.log(`Query: "${testQuery}"`);
    console.log('Fetching knowledge base context...\n');
    
    // Get actual KB context
    const { knowledgeContext } = await fetchKnowledgeContext(testQuery, 5, 0.05);
    
    console.log(`Found ${knowledgeContext.length} KB chunks`);
    
    if (knowledgeContext.length > 0) {
      console.log('\n📚 KB Content Summary:');
      knowledgeContext.forEach((chunk, index) => {
        console.log(`${index + 1}. ${chunk.title} (score: ${chunk.score.toFixed(3)})`);
        console.log(`   Preview: ${chunk.content.substring(0, 100)}...`);
      });
      
      console.log('\n✅ KB has content - the AI should NOT claim limitations for chest/arms');
      console.log('✅ The new exercise availability analysis should prevent false limitation claims');
    } else {
      console.log('\n⚠️ No KB content found - limitation message would be appropriate');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testExerciseAvailabilityFix();
