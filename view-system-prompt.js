const { PrismaClient } = require('@prisma/client');

async function viewSystemPrompt() {
  const prisma = new PrismaClient();
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (config) {
      console.log('🔍 Current System Prompt:');
      console.log('=' .repeat(80));
      console.log(config.systemPrompt);
      console.log('=' .repeat(80));
      
      // Check for knowledge integration instructions
      const prompt = config.systemPrompt.toLowerCase();
      console.log('\n📋 Knowledge Integration Analysis:');
      
      if (prompt.includes('knowledge base context')) {
        console.log('✅ Contains "knowledge base context" reference');
      }
      if (prompt.includes('prioritize information')) {
        console.log('✅ Contains prioritization instructions');
      }
      if (prompt.includes('never mention') || prompt.includes('do not mention')) {
        console.log('⚠️  Contains instructions to hide sources');
      }
      if (prompt.includes('cite') || prompt.includes('reference')) {
        console.log('✅ Contains citation/reference instructions');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewSystemPrompt();
