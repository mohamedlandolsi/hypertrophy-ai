const { PrismaClient } = require('@prisma/client');

async function optimizeRAGConfiguration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Optimizing RAG Configuration for Better Performance...\n');
    
    // Current config
    const current = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        temperature: true,
        topK: true
      }
    });
    
    console.log('📊 Current Settings:');
    console.log(`  Similarity Threshold: ${current?.ragSimilarityThreshold}`);
    console.log(`  Max Chunks: ${current?.ragMaxChunks}`);
    console.log(`  High Relevance Threshold: ${current?.ragHighRelevanceThreshold}`);
    console.log(`  Temperature: ${current?.temperature}`);
    console.log(`  Top K: ${current?.topK}\n`);
    
    // Recommended optimizations
    const optimizedConfig = {
      ragSimilarityThreshold: 0.3,  // Lower threshold for better recall
      ragMaxChunks: 12,             // Reduced for better focus and performance  
      ragHighRelevanceThreshold: 0.65, // Lower high-confidence threshold
      temperature: 0.4,             // Keep current (good balance)
      topK: 30                      // Keep current (good diversity)
    };
    
    console.log('🎯 Recommended Optimized Settings:');
    console.log(`  Similarity Threshold: ${optimizedConfig.ragSimilarityThreshold} (better recall)`);
    console.log(`  Max Chunks: ${optimizedConfig.ragMaxChunks} (focused context)`);
    console.log(`  High Relevance Threshold: ${optimizedConfig.ragHighRelevanceThreshold} (balanced confidence)`);
    console.log(`  Temperature: ${optimizedConfig.temperature} (current - good)`);
    console.log(`  Top K: ${optimizedConfig.topK} (current - good)\n`);
    
    console.log('💡 Rationale:');
    console.log('  • Lower similarity threshold (0.3) captures more relevant context');
    console.log('  • Fewer max chunks (12) reduces noise while maintaining coverage');
    console.log('  • Lower high-relevance threshold (0.65) provides more confident citations');
    console.log('  • These settings work better with your fallback logic in the code\n');
    
    const apply = process.argv.includes('--apply');
    
    if (apply) {
      console.log('🚀 Applying optimized configuration...');
      
      await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: optimizedConfig
      });
      
      console.log('✅ RAG configuration optimized successfully!');
    } else {
      console.log('🔍 This is a preview. Run with --apply to implement changes:');
      console.log('   node optimize-rag-config.js --apply');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeRAGConfiguration();
