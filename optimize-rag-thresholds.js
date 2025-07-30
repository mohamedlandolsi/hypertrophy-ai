/**
 * Further optimize RAG thresholds for better knowledge retrieval
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeRagThresholds() {
  console.log('🔧 Further optimizing RAG thresholds for better knowledge retrieval...');
  
  try {
    const updatedConfig = await prisma.aIConfiguration.update({
      where: {
        id: 'singleton'
      },
      data: {
        ragMaxChunks: 12,               // Increase from 8 to 12 for better coverage
        ragSimilarityThreshold: 0.2,    // Lower from 0.3 to 0.2 for broader recall
        ragHighRelevanceThreshold: 0.4  // Lower from 0.5 to 0.4 for more inclusive results
      }
    });

    console.log('✅ RAG thresholds further optimized:');
    console.log('  - Max chunks: 8 → 12 (better coverage while staying fast)');
    console.log('  - Similarity threshold: 0.3 → 0.2 (broader recall)');
    console.log('  - High relevance threshold: 0.5 → 0.4 (more inclusive)');
    
    console.log('\n🎯 Final configuration:', {
      ragMaxChunks: updatedConfig.ragMaxChunks,
      ragSimilarityThreshold: updatedConfig.ragSimilarityThreshold,
      ragHighRelevanceThreshold: updatedConfig.ragHighRelevanceThreshold
    });

    console.log('\n✅ This should provide consistent knowledge base results while maintaining speed.');

  } catch (error) {
    console.error('❌ Error optimizing RAG thresholds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeRagThresholds();
