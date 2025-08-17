const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateSupplementQuery() {
  try {
    console.log('🎯 Simulating supplement query processing...\n');
    
    // Simulate a supplement query
    const query = "recommend me supplements";
    console.log(`User Query: "${query}"`);
    
    // Step 1: Search for relevant knowledge (simulate vector search)
    console.log('\n🔍 Step 1: Searching knowledge base for supplement information...');
    
    const knowledgeResults = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'supplement', mode: 'insensitive' } },
          { content: { contains: 'creatine', mode: 'insensitive' } },
          { content: { contains: 'protein', mode: 'insensitive' } },
          { content: { contains: 'vitamin', mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        knowledgeItem: {
          select: {
            title: true,
            category: true
          }
        }
      }
    });
    
    console.log(`Found ${knowledgeResults.length} potentially relevant knowledge chunks`);
    
    // Step 2: Analyze knowledge relevance
    console.log('\n📊 Step 2: Analyzing knowledge relevance...');
    
    let hasSpecificSupplementGuidance = false;
    knowledgeResults.forEach((chunk, index) => {
      const isRelevant = chunk.content.toLowerCase().includes('recommend') || 
                        chunk.content.toLowerCase().includes('dosage') ||
                        chunk.content.toLowerCase().includes('supplement protocol');
      
      console.log(`${index + 1}. ${chunk.knowledgeItem?.title || 'Unknown'}`);
      console.log(`   Relevant for supplement recommendations: ${isRelevant ? '✅' : '❌'}`);
      console.log(`   Content: ${chunk.content.substring(0, 80)}...`);
      
      if (isRelevant) hasSpecificSupplementGuidance = true;
    });
    
    console.log(`\n🎯 Has specific supplement guidance: ${hasSpecificSupplementGuidance ? '✅' : '❌'}`);
    
    // Step 3: Determine AI response path
    console.log('\n🤖 Step 3: AI Response Path Determination...');
    
    if (!hasSpecificSupplementGuidance) {
      console.log('❌ Knowledge base lacks specific supplement recommendations');
      console.log('✅ AI should follow FALLBACK PROTOCOL');
      console.log('   1. ❌ Cannot generalize from exercise principles');
      console.log('   2. ✅ State limitations clearly');
      console.log('   3. ✅ MANDATORY: Use domain expertise for supplements');
      console.log('   4. ✅ CRITICAL: Provide supplement recommendations with evidence');
      
      console.log('\n📝 Expected AI Response Pattern:');
      console.log('   "Based on my current knowledge base, specific supplement guidelines are not detailed.');
      console.log('   However, from an evidence-based fitness standpoint, I can recommend...');
      console.log('   [Followed by specific supplement recommendations with dosages and timing]"');
    } else {
      console.log('✅ Knowledge base contains supplement guidance');
      console.log('✅ AI should use knowledge-based response');
    }
    
    // Step 4: Verify AI configuration supports this
    console.log('\n⚙️ Step 4: Configuration Verification...');
    
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (aiConfig) {
      const configChecks = {
        'Has MANDATORY step': aiConfig.systemPrompt.includes('MANDATORY: Use Domain Expertise'),
        'Includes supplements in domain': aiConfig.systemPrompt.includes('supplements'),
        'Has CRITICAL directive': aiConfig.systemPrompt.includes('CRITICAL: For supplement questions'),
        'Forbids stopping at step 2': aiConfig.systemPrompt.includes('DO NOT STOP at step 2')
      };
      
      Object.entries(configChecks).forEach(([check, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${check}`);
      });
      
      const allConfigured = Object.values(configChecks).every(Boolean);
      console.log(`\n🎯 Configuration Status: ${allConfigured ? '✅ READY' : '❌ NEEDS FIXING'}`);
      
      if (allConfigured) {
        console.log('\n🚀 The AI should now provide supplement recommendations!');
        console.log('   Try the query "recommend me supplements" in the chat interface.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error simulating supplement query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateSupplementQuery();
