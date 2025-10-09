const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSupplementFallback() {
  try {
    console.log('🧪 Analyzing supplement fallback configuration...\n');
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.log('❌ AI Configuration not found');
      return;
    }
    
    console.log('📋 Current System Prompt Analysis:');
    console.log(`Total length: ${aiConfig.systemPrompt.length} characters`);
    
    // Check for key phrases
    const keyChecks = {
      'FALLBACK PROTOCOL': aiConfig.systemPrompt.includes('FALLBACK PROTOCOL'),
      'MANDATORY: Use Domain Expertise': aiConfig.systemPrompt.includes('MANDATORY: Use Domain Expertise'),
      'DO NOT STOP at step 2': aiConfig.systemPrompt.includes('DO NOT STOP at step 2'),
      'supplements': aiConfig.systemPrompt.includes('supplements'),
      'CRITICAL': aiConfig.systemPrompt.includes('CRITICAL'),
      'supplement questions specifically': aiConfig.systemPrompt.includes('supplement questions specifically')
    };
    
    Object.entries(keyChecks).forEach(([key, found]) => {
      console.log(`${found ? '✅' : '❌'} ${key}: ${found}`);
    });
    
    // Extract fallback protocol section for review
    console.log('\n📝 Extracting Fallback Protocol Section:');
    const fallbackStart = aiConfig.systemPrompt.indexOf('# FALLBACK PROTOCOL');
    const nextSection = aiConfig.systemPrompt.indexOf('\n# ', fallbackStart + 1);
    
    if (fallbackStart !== -1) {
      const fallbackSection = nextSection !== -1 
        ? aiConfig.systemPrompt.substring(fallbackStart, nextSection)
        : aiConfig.systemPrompt.substring(fallbackStart);
      
      console.log(fallbackSection);
      
      // Check if the section includes step 3
      const hasStep3 = fallbackSection.includes('3.') && fallbackSection.includes('MANDATORY');
      console.log(`\n🎯 Step 3 (MANDATORY) present: ${hasStep3 ? '✅' : '❌'}`);
      
      if (hasStep3) {
        console.log('✅ The AI should proceed to step 3 for supplement questions');
        console.log('✅ The AI is explicitly required to provide domain expertise');
      } else {
        console.log('❌ Step 3 may not be properly configured');
      }
    } else {
      console.log('❌ Fallback protocol section not found');
    }
    
    console.log('\n🔄 Test Recommendation:');
    console.log('Try asking: "recommend me supplements" in the chat interface');
    console.log('Expected behavior: AI should state KB limitations but provide supplement recommendations');
    
  } catch (error) {
    console.error('❌ Error analyzing supplement fallback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSupplementFallback();
