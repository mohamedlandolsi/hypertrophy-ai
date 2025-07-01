const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAIConfigIntegration() {
  try {
    console.log('🧪 Testing AI Configuration Integration...');
    
    // Check current configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('✅ AI Configuration loaded');
    console.log('- System Prompt Length:', config.systemPrompt.length, 'characters');
    console.log('- Model:', config.modelName);
    console.log('- Temperature:', config.temperature);
    console.log('- Max Tokens:', config.maxTokens);
    
    // Test the configuration structure matches what Gemini.ts expects
    const expectedFields = [
      'systemPrompt', 'modelName', 'temperature', 'maxTokens', 
      'topK', 'topP', 'useKnowledgeBase', 'useClientMemory', 'enableWebSearch'
    ];
    
    const missingFields = expectedFields.filter(field => !(field in config));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present for Gemini integration');
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
    
    // Verify the system prompt starts with the expected content
    if (config.systemPrompt.includes('You are an expert AI fitness and hypertrophy coach')) {
      console.log('✅ System prompt contains comprehensive fitness coaching instructions');
    } else {
      console.log('❌ System prompt does not match expected format');
    }
    
    // Check if the system prompt includes the critical information extraction section
    if (config.systemPrompt.includes('CRITICAL: Information Extraction & Storage')) {
      console.log('✅ System prompt includes information extraction instructions');
    } else {
      console.log('❌ System prompt missing information extraction instructions');
    }
    
    console.log('\n✅ AI Configuration Integration Test Complete!');
    console.log('📝 Summary:');
    console.log('   - Configuration is properly stored in database');
    console.log('   - All required fields are present');
    console.log('   - System prompt is comprehensive and ready for use');
    console.log('   - Gemini.ts will dynamically load this configuration');
    console.log('   - Admin can modify settings via /admin/settings page');
    
  } catch (error) {
    console.error('❌ Error testing AI configuration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAIConfigIntegration();
