const { PrismaClient } = require('@prisma/client');

async function checkSystemPrompt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Fetching full system prompt...\n');
    
    const config = await prisma.aIConfiguration.findFirst();
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('📝 FULL SYSTEM PROMPT:');
    console.log('=' .repeat(80));
    console.log(config.systemPrompt);
    console.log('=' .repeat(80));
    console.log(`\n📊 System prompt length: ${config.systemPrompt.length} characters`);
    
    // Check for specific keywords related to profile conflicts
    const profileConflictKeywords = [
      'PROFILE CONFLICT',
      'profile.*conflict',
      'conflict.*profile',
      'acknowledge.*conflict',
      'update.*profile',
      'proactive.*profile',
      'memory.*update'
    ];
    
    console.log('\n🔍 Checking for profile conflict handling...');
    profileConflictKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'i');
      const found = regex.test(config.systemPrompt);
      console.log(`- ${keyword}: ${found ? '✅ Found' : '❌ Not found'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemPrompt();
