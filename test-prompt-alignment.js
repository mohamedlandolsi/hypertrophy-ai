// Test script to verify prompt alignment between admin settings and AI system
const { PrismaClient } = require('@prisma/client');

async function testPromptAlignment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 TESTING PROMPT ALIGNMENT');
    console.log('============================\n');
    
    // 1. Check if AI configuration exists
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log(`📏 System prompt length: ${config.systemPrompt.length} characters`);
    
    // 2. Check if the prompt contains the expected sections
    const expectedSections = [
      'MISSION & PERSONA',
      'KNOWLEDGE BASE GROUNDING', 
      'RESPONSE PROTOCOL',
      'FALLBACK PROTOCOL',
      'USER PROFILE INTEGRATION',
      'TONE & STYLE'
    ];
    
    console.log('\n🔍 Checking for required sections:');
    expectedSections.forEach(section => {
      const hasSection = config.systemPrompt.includes(section);
      console.log(`   ${hasSection ? '✅' : '❌'} ${section}`);
    });
    
    // 3. Check for HypertroQ persona
    const hasHypertroQ = config.systemPrompt.includes('HypertroQ');
    console.log(`\n🤖 HypertroQ persona: ${hasHypertroQ ? '✅' : '❌'}`);
    
    // 4. Check for knowledge base directives
    const hasKBDirectives = config.systemPrompt.includes('KNOWLEDGE') && 
                           config.systemPrompt.includes('single source of truth');
    console.log(`📚 KB grounding directives: ${hasKBDirectives ? '✅' : '❌'}`);
    
    // 5. Check for user profile integration
    const hasProfileIntegration = config.systemPrompt.includes('USER PROFILE');
    console.log(`👤 User profile integration: ${hasProfileIntegration ? '✅' : '❌'}`);
    
    console.log('\n🎯 PROMPT ALIGNMENT STATUS:');
    const alignmentScore = [hasHypertroQ, hasKBDirectives, hasProfileIntegration].filter(Boolean).length;
    console.log(`   Score: ${alignmentScore}/3`);
    
    if (alignmentScore === 3) {
      console.log('   ✅ EXCELLENT: Admin settings and AI system are fully aligned');
    } else if (alignmentScore === 2) {
      console.log('   ⚠️  GOOD: Minor alignment issues');
    } else {
      console.log('   ❌ POOR: Significant alignment issues detected');
    }
    
    console.log('\n📝 Sample prompt excerpt:');
    console.log(config.systemPrompt.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Error testing prompt alignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPromptAlignment();
