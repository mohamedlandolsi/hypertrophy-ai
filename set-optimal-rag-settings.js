const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setOptimalRAGSettings() {
  try {
    console.log('🔧 Setting Optimal RAG Configuration...\n');
    
    const updatedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        ragSimilarityThreshold: 0.25,    // Soft threshold - don't discard chunks early
        ragMaxChunks: 7,                 // Sufficient for comprehensive programming  
        ragHighRelevanceThreshold: 0.7,  // For marking high-confidence only
        temperature: 0.3                 // More deterministic responses
      }
    });
    
    console.log('✅ Optimal RAG Settings Applied:');
    console.log(`   Similarity Threshold: ${updatedConfig.ragSimilarityThreshold} (soft - preserves more context)`);
    console.log(`   Max Chunks: ${updatedConfig.ragMaxChunks} (adequate for complete programming)`);
    console.log(`   High Relevance Threshold: ${updatedConfig.ragHighRelevanceThreshold} (marking only)`);
    console.log(`   Temperature: ${updatedConfig.temperature} (deterministic evidence-based responses)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setOptimalRAGSettings();
