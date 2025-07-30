const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTieredModels() {
  try {
    console.log('🔍 Checking tiered model configuration...');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI Configuration found');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log('\n📋 Model Configuration:');
    console.log('- Old Model Name (deprecated):', config.modelName);
    console.log('- Free Tier Model:', config.freeModelName);
    console.log('- Pro Tier Model:', config.proModelName);
    
    console.log('\n🎯 RAG Settings:');
    console.log('- Use Knowledge Base:', config.useKnowledgeBase);
    console.log('- Similarity Threshold:', config.ragSimilarityThreshold);
    console.log('- Max Chunks:', config.ragMaxChunks);
    console.log('- High Relevance Threshold:', config.ragHighRelevanceThreshold);
    
    console.log('\n📝 System Prompt Preview:');
    console.log('- Length:', config.systemPrompt.length, 'characters');
    console.log('- First 200 chars:', config.systemPrompt.substring(0, 200) + '...');
    
    // Check if models are properly configured
    if (!config.freeModelName || !config.proModelName) {
      console.log('\n⚠️  WARNING: Tiered models are not configured!');
      console.log('Please configure both freeModelName and proModelName in the admin panel.');
    } else {
      console.log('\n✅ Tiered models are properly configured');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTieredModels();
