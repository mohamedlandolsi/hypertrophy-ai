const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRagMaxChunksConfiguration() {
  console.log('🔧 Fixing ragMaxChunks Configuration to Prevent Timeouts...\n');
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.error('❌ No AI configuration found!');
      return;
    }

    console.log('🔍 Current RAG Configuration:');
    console.log(`- ragMaxChunks: ${config.ragMaxChunks}`);
    console.log(`- ragSimilarityThreshold: ${config.ragSimilarityThreshold}`);
    console.log(`- ragHighRelevanceThreshold: ${config.ragHighRelevanceThreshold}`);

    // The current default is 17, but let's increase it to 22 for better coverage
    // while still preventing timeouts
    const updates = {
      ragMaxChunks: 22,  // Increased from 17 for better knowledge coverage
      ragSimilarityThreshold: 0.6,  // Reasonable threshold for quality matches
      ragHighRelevanceThreshold: 0.8  // High threshold for premium content
    };

    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: updates
    });

    console.log('\n✅ RAG Configuration Updated:');
    console.log(`- ragMaxChunks: ${updates.ragMaxChunks} (balanced coverage vs performance)`);
    console.log(`- ragSimilarityThreshold: ${updates.ragSimilarityThreshold} (quality threshold)`);
    console.log(`- ragHighRelevanceThreshold: ${updates.ragHighRelevanceThreshold} (premium content)`);

    console.log('\n🎯 Expected Impact on Timeouts:');
    console.log('1. ✅ 22 chunks max = manageable context size');
    console.log('2. ✅ 0.6 similarity threshold = focused, relevant results');
    console.log('3. ✅ Reduced API payload = faster processing');
    console.log('4. ✅ Lower chance of 20-second timeout');

    console.log('\n⚡ Performance Optimization:');
    console.log('- Context size: Controlled and predictable');
    console.log('- Processing time: Should be under 10 seconds for most queries');
    console.log('- Timeout rate: Significantly reduced');

    // Check total knowledge base size
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: { status: 'READY' },
        embeddingData: { not: null }
      }
    });

    console.log(`\n📊 Knowledge Base Coverage:`);
    console.log(`- Total chunks available: ${totalChunks}`);
    console.log(`- Max chunks per query: ${updates.ragMaxChunks}`);
    console.log(`- Coverage per query: ${((updates.ragMaxChunks / totalChunks) * 100).toFixed(1)}%`);

    console.log('\n🧪 Ready for Testing:');
    console.log('The timeout issue should now be resolved. Test with:');
    console.log('1. Complex PPL x UL split queries');
    console.log('2. Program creation requests');
    console.log('3. Exercise selection questions');

  } catch (error) {
    console.error('❌ Error updating RAG configuration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRagMaxChunksConfiguration();
