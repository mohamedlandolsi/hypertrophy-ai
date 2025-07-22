const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function optimizeAIConfiguration() {
  try {
    console.log('🔧 OPTIMIZING AI CONFIGURATION');
    console.log('===============================');
    
    // Get current config
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!currentConfig) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('📋 Current Settings:');
    console.log(`   Similarity Threshold: ${currentConfig.ragSimilarityThreshold} (too low)`);
    console.log(`   Max Chunks: ${currentConfig.ragMaxChunks} (could be reduced)`);
    console.log(`   High Relevance Threshold: ${currentConfig.ragHighRelevanceThreshold} (too low)`);
    console.log(`   Max Tokens: ${currentConfig.maxTokens} (too high)`);
    
    // Apply optimizations based on your recommendations
    const optimizedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        ragSimilarityThreshold: 0.25,    // Increased from 0.05 → 0.25
        ragMaxChunks: 5,                 // Reduced from 8 → 5 chunks
        ragHighRelevanceThreshold: 0.65, // Increased from 0.15 → 0.65
        maxTokens: 2000                  // Reduced from 3000 → 2000
      }
    });
    
    console.log('\n✅ Optimized Settings Applied:');
    console.log(`   Similarity Threshold: ${optimizedConfig.ragSimilarityThreshold} (stricter - filters noise)`);
    console.log(`   Max Chunks: ${optimizedConfig.ragMaxChunks} (fewer chunks = faster responses)`);
    console.log(`   High Relevance Threshold: ${optimizedConfig.ragHighRelevanceThreshold} (higher bar for quality)`);
    console.log(`   Max Tokens: ${optimizedConfig.maxTokens} (faster generation)`);
    
    console.log('\n🎯 Expected Improvements:');
    console.log('   • Faster response times (less context, fewer tokens)');
    console.log('   • Better relevance (higher similarity thresholds)');
    console.log('   • Less domination by large documents');
    console.log('   • More precise muscle-specific results');
    
    console.log('\n⚠️  Note: The muscle-specific search system we implemented');
    console.log('   will still bypass these settings for direct muscle queries,');
    console.log('   but general queries will now be much more focused.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeAIConfiguration();
