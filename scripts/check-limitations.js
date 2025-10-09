const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemPromptLimitations() {
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (config) {
      const prompt = config.systemPrompt;
      console.log('🔍 Checking system prompt for limitation instructions...\n');
      
      // Search for limitation-related instructions
      const limitationTerms = ['limitation', 'do not have', 'missing', 'lacks', 'inform'];
      
      const lines = prompt.split('\n');
      lines.forEach((line, index) => {
        if (limitationTerms.some(term => line.toLowerCase().includes(term))) {
          console.log(`Line ${index + 1}: ${line.trim()}`);
        }
      });
      
      // Also search for exercise-related instructions
      console.log('\n🔍 Exercise-related instructions:');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('exercise') && (line.includes('not') || line.includes('missing') || line.includes('KB'))) {
          console.log(`Line ${index + 1}: ${line.trim()}`);
        }
      });
    } else {
      console.log('❌ No AI configuration found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemPromptLimitations();
