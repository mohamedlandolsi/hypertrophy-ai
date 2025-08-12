const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRAGConfiguration() {
  try {
    console.log('🔧 Fixing RAG Configuration...\n');
    
    // Update AI configuration with proper RAG settings
    const updated = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        ragMaxChunks: 7,
        ragSimilarityThreshold: 0.3,
        ragHighRelevanceThreshold: 0.7,
        proModelName: 'gemini-2.0-flash-exp'  // Also set model if needed
      }
    });
    
    console.log('✅ AI Configuration updated with RAG settings:');
    console.log(`- Pro model: ${updated.proModelName}`);
    console.log(`- Max chunks: ${updated.ragMaxChunks}`);
    console.log(`- Similarity threshold: ${updated.ragSimilarityThreshold}`);
    console.log(`- High relevance threshold: ${updated.ragHighRelevanceThreshold}`);
    console.log(`- Temperature: ${updated.temperature}`);
    console.log(`- Max tokens: ${updated.maxTokens}`);
    console.log(`- Top K: ${updated.topK}`);
    console.log(`- Top P: ${updated.topP}`);
    console.log(`- Use knowledge base: ${updated.useKnowledgeBase}`);
    console.log(`- Use client memory: ${updated.useClientMemory}`);
    
    console.log('\n🎯 RAG Configuration is now properly set!');
    
  } catch (error) {
    console.error('❌ Error updating AI configuration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRAGConfiguration();
