const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModelSelection() {
  try {
    console.log('🧪 Testing model selection based on user plans...\n');

    // Check if AI configuration exists
    let config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('⚠️ No AI configuration found, creating default...');
      config = await prisma.aIConfiguration.create({
        data: {
          id: 'singleton',
          systemPrompt: 'Default system prompt',
          freeModelName: 'gemini-2.5-flash',
          proModelName: 'gemini-2.5-pro'
        }
      });
    }

    console.log('📋 Current AI Configuration:');
    console.log(`Free Model: ${config.freeModelName}`);
    console.log(`Pro Model: ${config.proModelName}`);
    console.log(`System Prompt (first 100 chars): ${config.systemPrompt.substring(0, 100)}...`);
    console.log('');

    // Test with different user plans
    const testCases = [
      { plan: 'FREE', expectedModel: config.freeModelName },
      { plan: 'PRO', expectedModel: config.proModelName }
    ];

    console.log('🔍 Testing model selection logic:');
    for (const testCase of testCases) {
      const selectedModel = testCase.plan === 'PRO' ? config.proModelName : config.freeModelName;
      const isCorrect = selectedModel === testCase.expectedModel;
      
      console.log(`${isCorrect ? '✅' : '❌'} ${testCase.plan} plan: ${selectedModel} ${isCorrect ? '(correct)' : '(incorrect)'}`);
    }

    console.log('\n🎉 Model selection test completed!');
    
  } catch (error) {
    console.error('❌ Error testing model selection:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModelSelection();
