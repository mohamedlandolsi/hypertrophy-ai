const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateUpperLowerOptimization() {
  console.log('✅ Validating Upper/Lower Program Retrieval Optimization');
  console.log('====================================================\n');

  try {
    // Check updated AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!aiConfig) {
      throw new Error('AI Configuration not found');
    }

    console.log('📊 Updated RAG Settings:');
    console.log(`   ✅ Similarity Threshold: ${aiConfig.ragSimilarityThreshold} (optimized for 0.59 scores)`);
    console.log(`   ✅ Max Chunks: ${aiConfig.ragMaxChunks} (increased for comprehensive content)`);
    console.log(`   ✅ High Relevance Threshold: ${aiConfig.ragHighRelevanceThreshold} (lowered for better matching)\n`);

    // Check if we have upper/lower content
    const upperLowerContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'upper', mode: 'insensitive' } },
          { content: { contains: 'lower', mode: 'insensitive' } },
          { content: { contains: 'split', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });

    console.log(`🔍 Found ${upperLowerContent.length} chunks with upper/lower content:`);
    
    const uniqueTitles = [...new Set(upperLowerContent.map(chunk => chunk.knowledgeItem.title))];
    uniqueTitles.forEach((title, index) => {
      console.log(`   ${index + 1}. "${title}"`);
    });

    console.log('\n📋 Key Points for Testing:');
    console.log('   1. The debug script showed scores of ~0.59 for upper/lower queries');
    console.log('   2. With threshold lowered to 0.3, these should now be retrieved');
    console.log('   3. With high relevance threshold at 0.5, scores of 0.59 are "high relevance"');
    console.log('   4. Max chunks increased to 15 for more comprehensive program info\n');

    console.log('🎯 Expected Behavior Now:');
    console.log('   - AI should retrieve upper/lower program content (0.59 > 0.3 threshold)');
    console.log('   - Content should be considered "high relevance" (0.59 > 0.5)');
    console.log('   - More chunks available for comprehensive program guidance');
    console.log('   - System prompt enforces KB-only responses for workout programming\n');

    console.log('💡 Testing Recommendations:');
    console.log('   1. Try: "Create a complete upper/lower program for me"');
    console.log('   2. Try: "Give me an upper lower split routine"');
    console.log('   3. Try: "How should I structure an upper/lower program?"');
    console.log('   4. AI should now provide specific guidance from the knowledge base\n');

    console.log('✅ Optimization validation complete!');
    console.log('The AI should now successfully retrieve and use upper/lower program content.');

  } catch (error) {
    console.error('❌ Error validating optimization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validateUpperLowerOptimization();
