const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupplementKnowledgeSearch() {
  try {
    console.log('🔍 Testing supplement knowledge search in database...\n');
    
    // Search for supplement-related knowledge items
    const supplementKnowledge = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'supplement', mode: 'insensitive' } },
          { content: { contains: 'creatine', mode: 'insensitive' } },
          { content: { contains: 'protein powder', mode: 'insensitive' } },
          { content: { contains: 'whey', mode: 'insensitive' } },
          { content: { contains: 'vitamin', mode: 'insensitive' } },
          { content: { contains: 'mineral', mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        content: true,
        knowledgeItem: {
          select: {
            title: true,
            category: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${supplementKnowledge.length} supplement-related knowledge items:`);
    
    if (supplementKnowledge.length === 0) {
      console.log('❌ No supplement knowledge found in database');
      console.log('✅ This confirms why the AI should use fallback protocol for supplement questions');
    } else {
      console.log('📋 Available supplement knowledge:');
      supplementKnowledge.forEach((item, index) => {
        console.log(`${index + 1}. ${item.knowledgeItem?.title || 'No title'} (Category: ${item.knowledgeItem?.category || 'No category'})`);
        console.log(`   Content preview: ${item.content.substring(0, 100)}...`);
      });
    }
    
    // Check AI configuration for supplement handling
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (aiConfig) {
      const hasMandatory = aiConfig.systemPrompt.includes('MANDATORY: Use Domain Expertise');
      const hasCritical = aiConfig.systemPrompt.includes('CRITICAL: For supplement questions');
      const hasSupplements = aiConfig.systemPrompt.includes('supplements');
      
      console.log('\n🤖 AI Configuration Analysis:');
      console.log(`✅ Has MANDATORY domain expertise: ${hasMandatory}`);
      console.log(`✅ Has CRITICAL supplement directive: ${hasCritical}`);
      console.log(`✅ Includes supplements in domain list: ${hasSupplements}`);
      
      if (hasMandatory && hasSupplements) {
        console.log('\n🎯 Result: AI should provide supplement recommendations using domain expertise');
        console.log('📝 Expected behavior: AI will acknowledge KB limitations but provide evidence-based supplement guidance');
      } else {
        console.log('\n❌ Configuration issue: Missing required directives');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing supplement knowledge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupplementKnowledgeSearch();
