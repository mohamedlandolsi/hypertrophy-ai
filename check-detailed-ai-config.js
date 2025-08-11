const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAIConfigDetails() {
  try {
    console.log('🔍 Checking detailed AI Configuration...\n');

    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found!');
      return;
    }

    console.log('📋 AI Configuration Details:');
    console.log('- ID:', config.id);
    console.log('- Free Model:', config.freeModelName || 'NOT SET');
    console.log('- Pro Model:', config.proModelName || 'NOT SET');
    console.log('- Temperature:', config.temperature);
    console.log('- Max Tokens:', config.maxTokens);
    console.log('- Top K:', config.topK);
    console.log('- Top P:', config.topP);
    console.log('- RAG Similarity Threshold:', config.ragSimilarityThreshold);
    console.log('- RAG Max Chunks:', config.ragMaxChunks);
    console.log('- Use Knowledge Base:', config.useKnowledgeBase);
    console.log('- Use Client Memory:', config.useClientMemory);
    console.log('- Tool Enforcement Mode:', config.toolEnforcementMode);
    console.log('- System Prompt Length:', config.systemPrompt?.length || 0, 'characters');
    
    if (!config.freeModelName || !config.proModelName) {
      console.log('\n⚠️  Model names are not properly set! Updating...');
      
      await prisma.aIConfiguration.update({
        where: { id: 'singleton' },
        data: { 
          freeModelName: 'gemini-1.5-flash',
          proModelName: 'gemini-1.5-pro'
        }
      });
      
      console.log('✅ Model names updated: Free=gemini-1.5-flash, Pro=gemini-1.5-pro');
    }

    // Check if the system prompt encourages knowledge synthesis
    const prompt = config.systemPrompt || '';
    const hasKnowledgeSynthesis = prompt.toLowerCase().includes('knowledge') && prompt.toLowerCase().includes('evidence');
    
    console.log('\n📝 System Prompt Analysis:');
    console.log('- Mentions knowledge:', prompt.toLowerCase().includes('knowledge'));
    console.log('- Mentions evidence:', prompt.toLowerCase().includes('evidence'));
    console.log('- Encourages synthesis:', hasKnowledgeSynthesis);

    if (!hasKnowledgeSynthesis) {
      console.log('⚠️  System prompt may not adequately encourage knowledge synthesis');
    }

  } catch (error) {
    console.error('❌ Error checking AI config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIConfigDetails();
