const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRAGConfig() {
  try {
    console.log('🔧 Fixing RAG Configuration for better performance...');
    
    // Update the AI configuration with more realistic similarity thresholds
    const updatedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        ragSimilarityThreshold: 0.05,    // 5% instead of 50% - much more realistic
        ragMaxChunks: 8,                 // Increase from 5 to 8 for better context
        ragHighRelevanceThreshold: 0.15  // 15% instead of 85% for high relevance marking
      }
    });
    
    console.log('✅ Updated RAG Configuration:');
    console.log(`   - Similarity Threshold: ${updatedConfig.ragSimilarityThreshold} (${(updatedConfig.ragSimilarityThreshold * 100).toFixed(1)}%)`);
    console.log(`   - Max Chunks: ${updatedConfig.ragMaxChunks}`);
    console.log(`   - High Relevance Threshold: ${updatedConfig.ragHighRelevanceThreshold} (${(updatedConfig.ragHighRelevanceThreshold * 100).toFixed(1)}%)`);
    
    console.log('\n📊 Expected Impact:');
    console.log('   🚀 Faster response times (vector search will work)');
    console.log('   🎯 Better knowledge retrieval (more relevant chunks)');
    console.log('   📚 More diverse knowledge sources (not just foundational training)');
    console.log('   💡 Chest training queries will now find chest-specific content');
    
  } catch (error) {
    console.error('❌ Error updating RAG config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRAGConfig();
