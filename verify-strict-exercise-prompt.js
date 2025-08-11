const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyStrictExercisePrompt() {
  console.log('🔍 Verifying Updated System Prompt for Strict Exercise Selection...\n');
  
  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.error('❌ No AI configuration found!');
      return;
    }

    // Check for key enforcement phrases
    const enforcements = [
      'YOU MAY ONLY RECOMMEND EXERCISES THAT ARE EXPLICITLY MENTIONED IN THE KNOWLEDGE BASE',
      'MANDATORY', 
      'Every exercise recommendation MUST be cited',
      'NO GENERIC EXAMPLES',
      'Never use generic examples like "e.g., Barbell Bench Press"',
      'SPECIFIC CITATIONS',
      'state this clearly'
    ];

    console.log('✅ Checking for strict exercise enforcement phrases:');
    enforcements.forEach(phrase => {
      const found = config.systemPrompt.includes(phrase);
      console.log(`${found ? '✅' : '❌'} "${phrase.substring(0, 50)}${phrase.length > 50 ? '...' : ''}"`);
    });

    console.log('\n📋 System Prompt Overview:');
    console.log('Length:', config.systemPrompt.length, 'characters');
    
    // Check specific sections
    const hasExerciseProtocol = config.systemPrompt.includes('Exercise Selection Protocol');
    const hasProgrammingRules = config.systemPrompt.includes('Exercise Programming Rules');
    const hasInsufficientKnowledge = config.systemPrompt.includes('When Knowledge Base is Insufficient');
    
    console.log(`✅ Exercise Selection Protocol: ${hasExerciseProtocol ? 'YES' : 'NO'}`);
    console.log(`✅ Exercise Programming Rules: ${hasProgrammingRules ? 'YES' : 'NO'}`);
    console.log(`✅ Insufficient Knowledge Handling: ${hasInsufficientKnowledge ? 'YES' : 'NO'}`);

    console.log('\n🧪 Ready for Testing!');
    console.log('The system prompt now enforces:');
    console.log('1. 🚫 No generic exercise examples');
    console.log('2. 📝 Mandatory citations for all exercises');
    console.log('3. 🔍 Only exercises from knowledge base');
    console.log('4. 💡 Transparent limitation acknowledgment');
    
    console.log('\n🎯 Test Commands:');
    console.log('1. Go to: http://localhost:3000/admin/ai-testing');
    console.log('2. Test query: "Create a 4-day upper/lower split with powerlifting elements"');
    console.log('3. Verify: No generic examples, all exercises cited, clear limitations stated');
    
    console.log('\n❗ Expected Changes:');
    console.log('Before: "e.g., Barbell Bench Press, Incline Dumbbell Press"');
    console.log('After: "Based on the chest training guide [1], specific exercises include: [actual KB exercises with citations]"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStrictExercisePrompt();
