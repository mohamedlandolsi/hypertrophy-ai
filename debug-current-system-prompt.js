const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIConfig() {
  try {
    const aiConfig = await prisma.aIConfiguration.findFirst();
    console.log('Current AI Configuration:');
    console.log('=======================');
    
    if (aiConfig) {
      console.log(`Model: ${aiConfig.modelName}`);
      console.log(`Temperature: ${aiConfig.temperature}`);
      console.log(`Multi-query enabled: ${aiConfig.enableMultiQuery}`);
      console.log('\nSystem Prompt:');
      console.log('===============');
      console.log(aiConfig.systemPrompt);
    } else {
      console.log('No AI configuration found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfig();
