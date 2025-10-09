const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemPrompt() {
  try {
    console.log('🔍 Checking AI Configuration system prompt...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (config) {
      console.log('📋 Current System Prompt:');
      console.log('=' * 80);
      console.log(config.systemPrompt);
      console.log('=' * 80);
      
      // Check for problematic patterns
      const problematicPatterns = [
        'do not contain',
        'does not contain',
        'not available',
        'not present',
        'cannot provide',
        'cannot generate',
        'must be exclusively',
        'exclusively chosen',
        'specific list of exercises',
        'detailed exercise lists'
      ];
      
      console.log('\n🚨 Checking for restrictive language:');
      problematicPatterns.forEach(pattern => {
        if (config.systemPrompt.toLowerCase().includes(pattern.toLowerCase())) {
          console.log(`❌ Found: "${pattern}"`);
        }
      });
      
      // Check for exercise-related restrictions
      if (config.systemPrompt.includes('exercise') || config.systemPrompt.includes('Exercise')) {
        console.log('\n📋 Exercise-related instructions found:');
        const lines = config.systemPrompt.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes('exercise')) {
            console.log(`Line ${i + 1}: ${line}`);
          }
        });
      }
      
    } else {
      console.log('❌ No AI configuration found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemPrompt();
