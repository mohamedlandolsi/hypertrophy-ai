const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRAGConfig() {
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
      }
    });
    
    console.log('🔧 RAG Configuration:', config);
    
    // Also check the default values used in code
    console.log('🔧 Default fallback values:');
    console.log('  - Similarity Threshold: 0.6 (60%)');
    console.log('  - Max Chunks: 5');
    console.log('  - High Relevance Threshold: 0.8 (80%)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRAGConfig();
