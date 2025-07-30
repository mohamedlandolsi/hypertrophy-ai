const { getAIConfiguration } = require('./src/lib/gemini.js');

async function testAIConfiguration() {
  try {
    console.log('🧪 Testing getAIConfiguration function...\n');

    console.log('🆓 Testing FREE plan configuration:');
    const freeConfig = await getAIConfiguration('FREE');
    console.log(`   Model: ${freeConfig.modelName}`);
    console.log(`   Temperature: ${freeConfig.temperature}`);
    console.log(`   Max Tokens: ${freeConfig.maxTokens}`);
    console.log(`   System Prompt Length: ${freeConfig.systemPrompt.length} chars`);
    
    console.log('\n💎 Testing PRO plan configuration:');
    const proConfig = await getAIConfiguration('PRO');
    console.log(`   Model: ${proConfig.modelName}`);
    console.log(`   Temperature: ${proConfig.temperature}`);
    console.log(`   Max Tokens: ${proConfig.maxTokens}`);
    console.log(`   System Prompt Length: ${proConfig.systemPrompt.length} chars`);

    console.log('\n✅ AI Configuration functions are working correctly!');

  } catch (error) {
    console.error('❌ Error testing AI configuration:', error);
    console.error('Stack trace:', error.stack);
  }
}

testAIConfiguration();
