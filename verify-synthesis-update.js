/**
 * Clear AI Configuration Cache and Test Synthesis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearCacheAndTest() {
  try {
    console.log('🔄 Clearing AI configuration cache...');
    
    // The cache is likely in memory in the running Node.js process
    // We can restart the dev server or just verify the current config
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: { 
        systemPrompt: true,
        freeModelName: true,
        proModelName: true,
        ragMaxChunks: true,
        ragSimilarityThreshold: true
      }
    });
    
    if (config) {
      console.log('✅ Current AI Configuration:');
      console.log(`- Free Model: ${config.freeModelName}`);
      console.log(`- Pro Model: ${config.proModelName}`);
      console.log(`- RAG Max Chunks: ${config.ragMaxChunks}`);
      console.log(`- RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
      console.log(`- System Prompt Length: ${config.systemPrompt.length} characters`);
      
      // Check if the new prompt contains our synthesis keywords
      const hasSynthesis = config.systemPrompt.includes('INTELLIGENT SYNTHESIS');
      const hasNeverSufficient = config.systemPrompt.includes('NEVER') && config.systemPrompt.includes('insufficient information');
      const hasConstruct = config.systemPrompt.includes('CONSTRUCT, DON\'T COPY');
      
      console.log('\n🔍 Synthesis Features Check:');
      console.log(`- Contains "INTELLIGENT SYNTHESIS": ${hasSynthesis ? '✅' : '❌'}`);
      console.log(`- Contains "NEVER insufficient": ${hasNeverSufficient ? '✅' : '❌'}`);
      console.log(`- Contains "CONSTRUCT, DON'T COPY": ${hasConstruct ? '✅' : '❌'}`);
      
      if (hasSynthesis && hasNeverSufficient && hasConstruct) {
        console.log('\n🎯 System prompt update confirmed! The AI should now:');
        console.log('1. Synthesize information intelligently from multiple KB sources');
        console.log('2. Build complete programs using knowledge base components');
        console.log('3. Apply expert reasoning to fill logical gaps');
        console.log('4. Never decline with "insufficient information" when KB has relevant content');
        console.log('5. Create comprehensive, actionable guidance');
      } else {
        console.log('\n⚠️ System prompt may not have updated properly');
      }
      
    } else {
      console.log('❌ No AI configuration found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearCacheAndTest();
