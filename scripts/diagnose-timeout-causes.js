const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseTimeoutCauses() {
  console.log('🔍 Diagnosing Potential Timeout Causes...\n');
  
  try {
    // 1. Check AI Configuration settings
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.error('❌ No AI configuration found - this will cause errors!');
      return;
    }

    console.log('🤖 AI Configuration:');
    console.log(`- Free Model: ${config.freeModelName}`);
    console.log(`- Pro Model: ${config.proModelName}`);
    console.log(`- Temperature: ${config.temperature}`);
    console.log(`- Max Tokens: ${config.maxTokens || 'default'}`);
    console.log(`- Top K: ${config.topK}`);
    console.log(`- Top P: ${config.topP}`);
    console.log(`- Max Chunks: ${config.maxChunks}`);
    console.log(`- System Prompt Length: ${config.systemPrompt.length} chars\n`);

    // 2. Check for potential timeout causes
    console.log('⚠️ Potential Timeout Causes:');
    
    // Very long system prompt
    if (config.systemPrompt.length > 5000) {
      console.log('❌ System prompt is very long (>5000 chars) - may cause delays');
    } else {
      console.log('✅ System prompt length is reasonable');
    }

    // High chunk count
    if (config.maxChunks > 25) {
      console.log('❌ Max chunks is high (>25) - may cause processing delays');
    } else {
      console.log('✅ Max chunks setting is reasonable');
    }

    // Check knowledge base size
    const totalChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: { status: 'READY' },
        embeddingData: { not: null }
      }
    });

    console.log(`\n📊 Knowledge Base Statistics:`);
    console.log(`- Total ready chunks: ${totalChunks}`);
    console.log(`- Max chunks per query: ${config.maxChunks}`);
    console.log(`- Percentage used per query: ${((config.maxChunks / totalChunks) * 100).toFixed(1)}%`);

    if (totalChunks > 1000) {
      console.log('⚠️ Large knowledge base - vector search may be slower');
    }

    // 3. Check timeout settings in gemini.ts
    console.log('\n⏱️ Current Timeout Settings (from gemini.ts):');
    console.log('- Flash models (gemini-2.5-flash): 20 seconds');
    console.log('- Pro models (gemini-pro): 30 seconds');
    
    // 4. Common timeout triggers
    console.log('\n🚨 Common Timeout Triggers:');
    console.log('1. Complex queries requiring extensive RAG processing');
    console.log('2. High similarity threshold causing multiple fallback searches');
    console.log('3. Large context window with many knowledge chunks');
    console.log('4. Network latency to Google Gemini API');
    console.log('5. Function calling for client memory updates');

    // 5. Solutions
    console.log('\n🔧 Timeout Prevention Solutions:');
    console.log('1. ✅ Already implemented: Progressive timeout handling');
    console.log('2. ✅ Already implemented: Fallback message for timeouts');
    console.log('3. 💡 Potential improvement: Reduce maxChunks for complex queries');
    console.log('4. 💡 Potential improvement: Implement query complexity detection');
    console.log('5. 💡 Potential improvement: Increase timeout for complex queries');

    // 6. Check recent errors
    console.log('\n📋 To check for timeout patterns:');
    console.log('1. Monitor the development server console for "🚨 Gemini API timed out" messages');
    console.log('2. Check if specific types of queries consistently timeout');
    console.log('3. Test with simpler queries to isolate the issue');
    
    console.log('\n🧪 Test Timeout Scenarios:');
    console.log('- Simple query: "What is muscle hypertrophy?"');
    console.log('- Complex query: "Create a detailed 6-day program with periodization"');
    console.log('- Image query: Upload an image with a complex question');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseTimeoutCauses();
