const { PrismaClient } = require('@prisma/client');

async function checkAIConfig() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking AI Configuration...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('📊 Current AI Configuration:');
    console.log('=====================================');
    console.log('📝 System Prompt:');
    console.log(config.systemPrompt);
    console.log('\n🎛️ Settings:');
    console.log(`- Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`- RAG Max Chunks: ${config.ragMaxChunks}`);
    console.log(`- RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`- Strict Muscle Priority: ${config.strictMusclePriority}`);
    console.log(`- Free Model: ${config.freeModelName}`);
    console.log(`- Pro Model: ${config.proModelName}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfig();
