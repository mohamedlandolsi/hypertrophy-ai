const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIConfiguration() {
  try {
    console.log('🔍 Checking AI Configuration...\n');

    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found!');
      console.log('   This could be why the chatbot is failing.');
      console.log('   Creating default configuration...\n');
      
      const newConfig = await prisma.aIConfiguration.create({
        data: {
          id: 'singleton',
          systemPrompt: 'You are a helpful AI assistant.',
          freeModelName: 'gemini-2.5-flash',
          proModelName: 'gemini-2.5-pro'
        }
      });
      
      console.log('✅ Created default AI configuration');
      console.log(`   Free Model: ${newConfig.freeModelName}`);
      console.log(`   Pro Model: ${newConfig.proModelName}`);
    } else {
      console.log('✅ AI Configuration found:');
      console.log(`   ID: ${config.id}`);
      console.log(`   Free Model: ${config.freeModelName}`);
      console.log(`   Pro Model: ${config.proModelName}`);
      console.log(`   System Prompt Length: ${config.systemPrompt.length} chars`);
      console.log(`   Temperature: ${config.temperature}`);
      console.log(`   Max Tokens: ${config.maxTokens}`);
      console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
      console.log(`   Use Client Memory: ${config.useClientMemory}`);
      
      // Check if model names are valid
      if (!config.freeModelName || config.freeModelName.trim() === '') {
        console.log('⚠️ WARNING: Free model name is empty!');
      }
      if (!config.proModelName || config.proModelName.trim() === '') {
        console.log('⚠️ WARNING: Pro model name is empty!');
      }
    }

  } catch (error) {
    console.error('❌ Error checking AI configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfiguration();
