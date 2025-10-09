const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCurrentConfig() {
  try {
    console.log('🔧 CHECKING CURRENT AI CONFIGURATION');
    console.log('====================================');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('📋 Current Configuration:');
    console.log(`   Temperature: ${config.temperature}`);
    console.log(`   Max Tokens: ${config.maxTokens}`);
    console.log(`   Top K: ${config.topK}`);
    console.log(`   Top P: ${config.topP}`);
    console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`   Free Model: ${config.freeModelName}`);
    console.log(`   Pro Model: ${config.proModelName}`);
    
    console.log('\n📝 System Prompt (first 500 characters):');
    console.log(config.systemPrompt.substring(0, 500) + '...');
    
    // Look for problematic instructions in the system prompt
    const prompt = config.systemPrompt.toLowerCase();
    
    console.log('\n🔍 Checking for problematic instructions:');
    
    if (prompt.includes('must be based on') && prompt.includes('knowledge base')) {
      console.log('⚠️  Found STRICT knowledge base requirement');
    }
    
    if (prompt.includes('cannot answer') || prompt.includes('unable to answer')) {
      console.log('⚠️  Found potential refusal instruction');
    }
    
    if (prompt.includes('only use knowledge base') || prompt.includes('exclusively')) {
      console.log('⚠️  Found exclusive knowledge base instruction');
    }
    
    // Look for fallback allowances
    if (prompt.includes('general knowledge') || prompt.includes('fallback')) {
      console.log('✅ Found general knowledge fallback instruction');
    }
    
    console.log('\n📊 RAG Configuration:');
    console.log(`   Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`   Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentConfig();
