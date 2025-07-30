const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemPrompt() {
  try {
    console.log('🔍 Checking system prompt for knowledge base instructions...');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI Configuration found');
      return;
    }
    
    console.log('✅ AI Configuration found');
    console.log('\n📝 Full System Prompt:');
    console.log('=====================================');
    console.log(config.systemPrompt);
    console.log('=====================================');
    
    // Check for specific knowledge base instructions
    const prompt = config.systemPrompt;
    const hasKnowledgeBaseInstructions = prompt.includes('Knowledge Base') || prompt.includes('knowledge base') || prompt.includes('knowledgeContext');
    const hasSearchInstructions = prompt.includes('search') || prompt.includes('Search');
    const hasContextInstructions = prompt.includes('context') || prompt.includes('Context');
    
    console.log('\n🔍 Knowledge Base Analysis:');
    console.log('- Contains "Knowledge Base" references:', hasKnowledgeBaseInstructions);
    console.log('- Contains "search" instructions:', hasSearchInstructions);
    console.log('- Contains "context" instructions:', hasContextInstructions);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemPrompt();
