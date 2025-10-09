const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentConfiguration() {
  console.log('🔍 Checking Current AI Configuration in Database');
  console.log('===============================================\n');

  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI Configuration found!');
      return;
    }

    console.log('📊 Current Database Configuration:');
    console.log(`   Tool Enforcement Mode: ${config.toolEnforcementMode}`);
    console.log(`   RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`   RAG Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   RAG High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`   Use Client Memory: ${config.useClientMemory}`);
    console.log(`   Temperature: ${config.temperature}`);
    console.log(`   Max Tokens: ${config.maxTokens}`);
    console.log(`   System Prompt Length: ${config.systemPrompt.length} characters\n`);

    // Check if our changes are there
    const isOptimal = 
      config.toolEnforcementMode === 'AUTO' &&
      config.ragSimilarityThreshold <= 0.3 &&
      config.ragMaxChunks >= 15 &&
      config.ragHighRelevanceThreshold <= 0.5;

    if (isOptimal) {
      console.log('✅ Configuration appears optimal for upper/lower synthesis');
    } else {
      console.log('⚠️ Configuration may need adjustment');
    }

    // Show system prompt snippet to check if it encourages synthesis
    console.log('\n📝 System Prompt Analysis:');
    const promptSnippet = config.systemPrompt.substring(0, 500);
    console.log(`First 500 characters: "${promptSnippet}..."`);
    
    if (config.systemPrompt.includes('intelligently synthesize')) {
      console.log('✅ System prompt includes synthesis language');
    } else {
      console.log('❌ System prompt may not encourage synthesis');
    }

  } catch (error) {
    console.error('❌ Error checking configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentConfiguration();
