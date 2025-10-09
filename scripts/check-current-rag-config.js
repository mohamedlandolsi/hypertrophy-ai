const { PrismaClient } = require('@prisma/client');

async function checkCurrentRAGConfig() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 Checking Current RAG Configuration...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        temperature: true,
        topK: true,
        topP: true,
        maxTokens: true,
        useKnowledgeBase: true,
        useClientMemory: true,
        enableWebSearch: true
      }
    });
    
    if (!config) {
      console.log('❌ No AI Configuration found');
      return;
    }
    
    console.log('🔧 Current RAG Settings:');
    console.log(`  Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`  Max Chunks: ${config.ragMaxChunks}`);
    console.log(`  High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    console.log('');
    console.log('🤖 AI Model Settings:');
    console.log(`  Temperature: ${config.temperature}`);
    console.log(`  Top K: ${config.topK}`);
    console.log(`  Top P: ${config.topP}`);
    console.log(`  Max Tokens: ${config.maxTokens}`);
    console.log('');
    console.log('🔄 Feature Flags:');
    console.log(`  Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`  Use Client Memory: ${config.useClientMemory}`);
    console.log(`  Enable Web Search: ${config.enableWebSearch}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRAGConfig();
