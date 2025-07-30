/**
 * Check and optimize AI model configuration for speed
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndOptimizeModels() {
  console.log('🔍 Checking AI model configuration...');
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }

    console.log('📋 Current model configuration:');
    console.log('  - Free model:', config.freeModelName || 'not set');
    console.log('  - Pro model:', config.proModelName || 'not set');
    console.log('  - Temperature:', config.temperature);
    console.log('  - Max tokens:', config.maxTokens);

    // Optimize for speed if using slow models
    let updates = {};
    let needsUpdate = false;

    // Use faster models if current ones are slow
    if (config.proModelName === 'gemini-2.5-pro' || !config.proModelName) {
      updates.proModelName = 'gemini-2.5-flash';
      needsUpdate = true;
      console.log('🚀 Switching PRO model to gemini-2.5-flash for faster responses');
    }

    if (config.freeModelName === 'gemini-2.5-pro' || !config.freeModelName) {
      updates.freeModelName = 'gemini-2.0-flash';
      needsUpdate = true;
      console.log('🚀 Switching FREE model to gemini-2.0-flash for faster responses');
    }

    // Reduce max tokens for faster generation
    if (config.maxTokens > 1500) {
      updates.maxTokens = 1500;
      needsUpdate = true;
      console.log('🚀 Reducing max tokens to 1500 for faster generation');
    }

    if (needsUpdate) {
      const updatedConfig = await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: updates
      });

      console.log('✅ AI configuration optimized for speed:');
      console.log('  - Free model:', updatedConfig.freeModelName);
      console.log('  - Pro model:', updatedConfig.proModelName);
      console.log('  - Max tokens:', updatedConfig.maxTokens);
    } else {
      console.log('✅ AI configuration is already optimized');
    }

  } catch (error) {
    console.error('❌ Error checking AI models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndOptimizeModels();
