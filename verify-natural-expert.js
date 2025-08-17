const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyNaturalExpertPrompt() {
  try {
    console.log('🔍 Verifying Natural Expert Prompt Implementation...\n');
    
    // Get AI configuration from database
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.log('❌ AI Configuration not found');
      return;
    }
    
    console.log('📋 System Prompt Analysis:');
    console.log(`Total length: ${aiConfig.systemPrompt.length} characters`);
    
    // Check for problematic technical terms (AI actually using these terms)
    const technicalTerms = [
      'knowledge base',
      'training data', 
      'AI personal trainer',
      '[KNOWLEDGE]',
      '[USER_PROFILE]',
      'based on my knowledge base',
      'my training data shows',
      'according to my database'
    ];
    
    // Check for good natural language
    const naturalLanguage = [
      'natural fitness expert',
      'In my experience',
      'I recommend',
      'What I typically recommend',
      'from a biomechanical standpoint',
      'based on exercise science principles'
    ];
    
    console.log('\n❌ Technical Terms to Avoid:');
    technicalTerms.forEach(term => {
      const found = aiConfig.systemPrompt.includes(term);
      console.log(`  ${found ? '❌ FOUND' : '✅ CLEAN'}: "${term}"`);
    });
    
    console.log('\n✅ Natural Expert Language:');
    naturalLanguage.forEach(phrase => {
      const found = aiConfig.systemPrompt.includes(phrase);
      console.log(`  ${found ? '✅ PRESENT' : '❌ MISSING'}: "${phrase}"`);
    });
    
    // Overall assessment
    const hasTechnicalTerms = technicalTerms.some(term => aiConfig.systemPrompt.includes(term));
    const hasNaturalLanguage = naturalLanguage.some(phrase => aiConfig.systemPrompt.includes(phrase));
    
    console.log('\n🎯 Overall Assessment:');
    if (!hasTechnicalTerms && hasNaturalLanguage) {
      console.log('✅ PERFECT: AI will sound like a natural fitness expert');
      console.log('✅ No technical jargon detected');
      console.log('✅ Natural expert language present');
    } else if (hasTechnicalTerms) {
      console.log('❌ NEEDS WORK: Still contains technical terms');
    } else if (!hasNaturalLanguage) {
      console.log('⚠️ PARTIAL: Clean but missing natural phrases');
    }
    
    // Sample response expectations
    console.log('\n📝 Expected Response Style:');
    console.log('✅ Natural: "While I don\'t have specific protocols for that, here\'s what generally works..."');
    console.log('✅ Expert: "In my experience, the most effective approach is..."');
    console.log('✅ Confident: "I recommend starting with..."');
    console.log('❌ Avoid: "Based on my knowledge base..." or "My training data shows..."');
    
  } catch (error) {
    console.error('❌ Error verifying natural expert prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNaturalExpertPrompt();
