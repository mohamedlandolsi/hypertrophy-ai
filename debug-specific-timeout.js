const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSpecificTimeoutQuery() {
  console.log('🔍 Debugging Specific Timeout Query: "upper/lower x full body hybrid program"...\n');
  
  try {
    // Test the exact query that's timing out
    const problematicQuery = "Give me a complete upper/lower x full body hybrid program";
    
    console.log(`🎯 Testing Query: "${problematicQuery}"`);
    console.log(`⏱️ This query timed out at 24.6 seconds\n`);

    // Check current timeout settings
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    console.log('⚙️ Current Configuration:');
    console.log(`- ragMaxChunks: ${config.ragMaxChunks}`);
    console.log(`- ragSimilarityThreshold: ${config.ragSimilarityThreshold}`);
    console.log(`- ragHighRelevanceThreshold: ${config.ragHighRelevanceThreshold}`);
    console.log(`- Free Model: ${config.freeModelName} (20-second timeout)`);
    console.log(`- Pro Model: ${config.proModelName} (30-second timeout)\n`);

    // The issue: 24.6 seconds > 20-second timeout for Flash model
    console.log('🚨 TIMEOUT ANALYSIS:');
    console.log('- Query took 24.6 seconds');
    console.log('- Flash model timeout: 20 seconds');
    console.log('- Result: Timeout triggered, fallback message shown\n');

    // Check if we can simulate the embedding generation
    console.log('🔍 Checking potential delay sources:');
    console.log('1. ✅ RAG chunk loading (controlled by ragMaxChunks: 22)');
    console.log('2. ❓ Embedding generation for the query');
    console.log('3. ❓ Vector search performance');
    console.log('4. ❓ Large system prompt processing');
    console.log('5. ❓ Client memory function calls\n');

    // Check knowledge base for relevant content
    const hybridResults = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { status: 'READY' },
        OR: [
          { content: { contains: 'hybrid', mode: 'insensitive' } },
          { content: { contains: 'upper/lower', mode: 'insensitive' } },
          { content: { contains: 'full body', mode: 'insensitive' } },
          { content: { contains: 'program', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 10
    });

    console.log(`📊 Knowledge Base Search Results: ${hybridResults.length} chunks found`);
    if (hybridResults.length > 0) {
      console.log('✅ Relevant content exists for this query');
      hybridResults.slice(0, 3).forEach((chunk, i) => {
        console.log(`${i + 1}. "${chunk.knowledgeItem.title}"`);
      });
    } else {
      console.log('❌ No relevant content found - may cause AI to use general knowledge');
    }

    console.log('\n🔧 IMMEDIATE SOLUTIONS:');
    console.log('1. 🚀 Switch to Pro model for complex queries (30s timeout)');
    console.log('2. ⚡ Reduce ragMaxChunks from 22 to 15 for faster processing');
    console.log('3. 📏 Optimize system prompt length');
    console.log('4. 🎯 Add query complexity detection');

    console.log('\n💡 RECOMMENDED FIX:');
    console.log('Implement adaptive timeout based on query complexity:');
    console.log('- Simple queries: Flash model (20s timeout)');
    console.log('- Complex program queries: Pro model (30s timeout)');
    console.log('- Detect "program", "split", "routine" keywords for complexity');

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugSpecificTimeoutQuery();
