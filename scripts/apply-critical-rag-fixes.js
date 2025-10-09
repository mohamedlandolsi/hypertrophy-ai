// apply-critical-rag-fixes.js
// Apply the critical RAG configuration fixes immediately

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyCriticalFixes() {
  console.log('🔧 APPLYING CRITICAL RAG FIXES');
  console.log('==============================\n');

  try {
    console.log('📊 Current Configuration:');
    const currentConfig = await prisma.aIConfiguration.findFirst();
    
    if (!currentConfig) {
      console.log('❌ No AI configuration found!');
      return;
    }

    console.log(`   Similarity Threshold: ${currentConfig.ragSimilarityThreshold}`);
    console.log(`   High Relevance Threshold: ${currentConfig.ragHighRelevanceThreshold}`);
    console.log(`   Max Chunks: ${currentConfig.ragMaxChunks}`);
    console.log(`   Temperature: ${currentConfig.temperature}`);

    console.log('\n🚀 Applying optimal settings...');
    
    const updatedConfig = await prisma.aIConfiguration.update({
      where: { id: "singleton" },
      data: {
        ragSimilarityThreshold: 0.1,
        ragHighRelevanceThreshold: 0.3,
        ragMaxChunks: 20,
        temperature: 0.3
      }
    });

    console.log('\n✅ Configuration updated successfully!');
    console.log('\n📊 New Configuration:');
    console.log(`   Similarity Threshold: ${updatedConfig.ragSimilarityThreshold} (was ${currentConfig.ragSimilarityThreshold})`);
    console.log(`   High Relevance Threshold: ${updatedConfig.ragHighRelevanceThreshold} (was ${currentConfig.ragHighRelevanceThreshold})`);
    console.log(`   Max Chunks: ${updatedConfig.ragMaxChunks} (was ${currentConfig.ragMaxChunks})`);
    console.log(`   Temperature: ${updatedConfig.temperature} (was ${currentConfig.temperature})`);

    console.log('\n🎯 IMPACT OF CHANGES:');
    console.log('--------------------');
    console.log('✅ Similarity threshold lowered: Will retrieve MUCH more relevant knowledge');
    console.log('✅ High relevance threshold lowered: Better balance of high/medium relevance content');
    console.log('✅ Max chunks increased: Richer context for complex fitness questions');
    console.log('✅ Temperature lowered: More focused and consistent responses');

    console.log('\n🚀 RAG SYSTEM IS NOW OPTIMIZED!');
    console.log('The AI will now provide significantly better, knowledge-based responses.');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyCriticalFixes();
