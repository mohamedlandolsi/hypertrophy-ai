const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSplitHybridQuery() {
  console.log('🧪 Testing Split/Hybrid Program Query with New Synthesis Prompt...\n');
  
  try {
    // Get current AI configuration to show what prompt is being used
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.error('❌ No AI configuration found!');
      return;
    }
    
    console.log('🤖 Current System Prompt (first 200 chars):');
    console.log(config.systemPrompt.substring(0, 200) + '...\n');
    
    // Check if synthesis keywords are present
    const synthesisKeywords = [
      'synthesis',
      'synthesize',
      'intelligent combination',
      'program construction',
      'learning from the knowledge base'
    ];
    
    const hasSynthesis = synthesisKeywords.some(keyword => 
      config.systemPrompt.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`✅ Synthesis directives present: ${hasSynthesis ? 'YES' : 'NO'}\n`);
    
    // Test query that should trigger synthesis
    const testQuery = "Create a 4-day upper/lower split with some powerlifting elements";
    console.log(`🎯 Test Query: "${testQuery}"\n`);
    
    console.log('🔍 Expected Behavior with New Prompt:');
    console.log('1. AI should retrieve relevant upper body, lower body, and powerlifting content');
    console.log('2. AI should synthesize this into a complete 4-day program');
    console.log('3. AI should NOT deflect with "insufficient information"');
    console.log('4. AI should cite multiple knowledge sources used in synthesis\n');
    
    console.log('📋 Next Steps:');
    console.log('1. Go to http://localhost:3000/admin/ai-testing');
    console.log('2. Test this query in the admin interface');
    console.log('3. Verify the AI creates a complete program using synthesis');
    console.log('4. Check that multiple knowledge sources are cited\n');
    
    console.log('🔧 If AI still deflects:');
    console.log('- Check if more specific synthesis examples are needed in prompt');
    console.log('- Consider adding more detailed program construction guidance');
    console.log('- Verify knowledge base has sufficient building blocks');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSplitHybridQuery();
