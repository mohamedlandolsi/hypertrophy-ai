const { PrismaClient } = require('@prisma/client');

async function checkRagSettings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Checking RAG Configuration...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        useKnowledgeBase: true,
        modelName: true,
        temperature: true
      }
    });
    
    if (config) {
      console.log('📊 RAG-Specific Settings:');
      console.log(`   🎯 Similarity Threshold: ${config.ragSimilarityThreshold}`);
      console.log(`   📦 Max Chunks: ${config.ragMaxChunks}`);
      console.log(`   ⭐ High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
      console.log(`   🧠 Use Knowledge Base: ${config.useKnowledgeBase}`);
      
      console.log('\n🤖 Model Settings:');
      console.log(`   🔥 Model: ${config.modelName}`);
      console.log(`   🌡️ Temperature: ${config.temperature}`);
      
      // Analyze the settings
      console.log('\n🔍 Analysis:');
      if (config.ragSimilarityThreshold > 0.3) {
        console.log('⚠️  ISSUE: Similarity threshold is too high! Should be around 0.05-0.1');
        console.log('   This explains why no knowledge base content is being retrieved.');
      } else {
        console.log('✅ Similarity threshold looks reasonable');
      }
      
      if (config.ragMaxChunks < 8) {
        console.log('⚠️  SUGGESTION: Consider increasing max chunks to 8 for richer context');
      } else {
        console.log('✅ Max chunks setting looks good');
      }
      
    } else {
      console.log('❌ No AI configuration found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRagSettings();
