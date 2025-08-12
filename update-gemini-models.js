const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateGeminiModels() {
  console.log('🔧 Updating Gemini Model Configuration...\n');
  
  try {
    // Update the AI configuration with the correct Gemini 2.5 models
    const updatedConfig = await prisma.aIConfiguration.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        freeModelName: 'gemini-2.5-flash',
        proModelName: 'gemini-2.5-pro',
        systemPrompt: 'You are a fitness AI assistant.',
        temperature: 0.4,
        maxTokens: 2000,
        topK: 30,
        topP: 0.8
      },
      update: {
        freeModelName: 'gemini-2.5-flash',
        proModelName: 'gemini-2.5-pro'
      }
    });
    
    console.log('✅ AI Configuration updated successfully!');
    console.log(`📱 Free Model: ${updatedConfig.freeModelName}`);
    console.log(`💎 Pro Model: ${updatedConfig.proModelName}`);
    console.log('\n🎯 Model Benefits:');
    console.log('   📱 Gemini 2.5 Flash (FREE users):');
    console.log('      - Best price-performance ratio');
    console.log('      - Adaptive thinking capabilities');
    console.log('      - Cost-efficient for high volume');
    console.log('   💎 Gemini 2.5 Pro (PRO users):');
    console.log('      - Most powerful thinking model');
    console.log('      - Maximum response accuracy');
    console.log('      - Advanced reasoning and multimodal understanding');
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeminiModels();
