/**
 * Optimize RAG configuration for faster response times
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeRagConfig() {
  console.log('🔧 Optimizing RAG configuration for faster responses...');
  
  try {
    const updatedConfig = await prisma.aIConfiguration.update({
      where: {
        id: 'singleton'
      },
      data: {
        ragMaxChunks: 8,               // Reduce from 17 to 8 for faster processing
        ragSimilarityThreshold: 0.3,   // Lower threshold for better recall
        ragHighRelevanceThreshold: 0.6 // Lower from 0.5 to include more relevant content
      }
    });

    console.log('✅ RAG configuration optimized:');
    console.log('  - Max chunks: 17 → 8 (faster processing)');
    console.log('  - Similarity threshold: 0.1 → 0.3 (better filtering)');
    console.log('  - High relevance threshold: 0.5 → 0.6 (balanced quality/speed)');
    
    console.log('\n🎯 New configuration:', {
      ragMaxChunks: updatedConfig.ragMaxChunks,
      ragSimilarityThreshold: updatedConfig.ragSimilarityThreshold,
      ragHighRelevanceThreshold: updatedConfig.ragHighRelevanceThreshold
    });

  } catch (error) {
    console.error('❌ Error optimizing RAG configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeRagConfig();
