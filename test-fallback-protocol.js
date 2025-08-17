const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFallbackProtocol() {
  try {
    console.log('🧪 Testing Fallback Protocol for Supplement/Fitness Queries...\n');
    
    // Check AI configuration has the updated fallback protocol
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.log('❌ AI Configuration not found');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log(`📋 System prompt length: ${aiConfig.systemPrompt.length} characters`);
    
    // Check if the fallback protocol includes domain expertise step
    const hasDomainExpertise = aiConfig.systemPrompt.includes('Use Domain Expertise for Fitness Topics');
    const hasSupplementsMention = aiConfig.systemPrompt.includes('supplements');
    const hasFallbackProtocol = aiConfig.systemPrompt.includes('FALLBACK PROTOCOL');
    
    console.log('\n🔍 Fallback Protocol Analysis:');
    console.log(`✅ Contains FALLBACK PROTOCOL section: ${hasFallbackProtocol}`);
    console.log(`✅ Contains Domain Expertise step: ${hasDomainExpertise}`);
    console.log(`✅ Mentions supplements in domain list: ${hasSupplementsMention}`);
    
    if (hasDomainExpertise && hasSupplementsMention && hasFallbackProtocol) {
      console.log('\n🎯 Test Result: PASS');
      console.log('✅ The AI should now be able to answer supplement-related questions using domain expertise when the knowledge base doesn\'t have specific information');
      console.log('✅ The AI will clearly state knowledge base limitations while providing evidence-based guidance');
    } else {
      console.log('\n❌ Test Result: FAIL');
      console.log('❌ Fallback protocol is missing required components');
    }
    
    // Extract and display the fallback protocol section
    console.log('\n📝 Current Fallback Protocol:');
    const fallbackMatch = aiConfig.systemPrompt.match(/# FALLBACK PROTOCOL[\s\S]*?(?=\n# |$)/);
    if (fallbackMatch) {
      console.log(fallbackMatch[0]);
    } else {
      console.log('❌ Could not extract fallback protocol section');
    }
    
    console.log('\n🔄 Next Steps:');
    console.log('1. Test with actual supplement questions in the chat interface');
    console.log('2. Verify the AI provides helpful responses while stating KB limitations');
    console.log('3. Ensure responses stay within fitness/health domains');
    
  } catch (error) {
    console.error('❌ Error testing fallback protocol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFallbackProtocol();
