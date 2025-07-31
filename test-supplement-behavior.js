const { PrismaClient } = require('@prisma/client');
const { sendToGeminiWithCitations } = require('./src/lib/gemini');

const prisma = new PrismaClient();

async function testSupplementFallback() {
  try {
    console.log('🧪 TESTING SUPPLEMENT/FALLBACK BEHAVIOR');
    console.log('========================================');
    
    // Test with a question that's unlikely to be in the knowledge base
    const testQuery = "What are the best supplements for muscle growth?";
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba'; // Replace with actual user ID
    
    console.log(`🔍 Query: "${testQuery}"`);
    console.log(`👤 User ID: ${userId}`);
    
    // Create a conversation format
    const conversation = [
      { role: 'user', content: testQuery }
    ];
    
    console.log('\n🤖 Sending to AI...');
    const startTime = Date.now();
    
    const response = await sendToGeminiWithCitations(
      conversation,
      userId,
      'FREE' // Test with free tier
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);
    
    console.log('\n📝 AI Response:');
    console.log('================');
    console.log(response.content);
    
    console.log('\n📚 Citations:');
    console.log('=============');
    if (response.citations && response.citations.length > 0) {
      response.citations.forEach((citation, index) => {
        console.log(`${index + 1}. ${citation.title} (ID: ${citation.id})`);
      });
    } else {
      console.log('No citations provided');
    }
    
    // Analyze the response
    console.log('\n🔍 Response Analysis:');
    console.log('====================');
    
    const responseText = response.content.toLowerCase();
    
    if (responseText.includes('cannot answer') || responseText.includes('unable to answer') || responseText.includes('sorry, but i cannot')) {
      console.log('❌ AI REFUSED to answer (this is the problem!)');
    } else if (responseText.includes('drawing from my general knowledge') || responseText.includes('general expertise')) {
      console.log('✅ AI used fallback to general knowledge (good!)');
    } else if (response.citations && response.citations.length > 0) {
      console.log('✅ AI used knowledge base content');
    } else {
      console.log('🤔 AI provided answer without clear fallback indication');
    }
    
    const hasSupplementInfo = responseText.includes('protein') || responseText.includes('supplement') || responseText.includes('nutrition');
    if (hasSupplementInfo) {
      console.log('✅ Response contains relevant supplement information');
    } else {
      console.log('❌ Response lacks helpful supplement information');
    }
    
  } catch (error) {
    console.error('❌ Error testing supplement fallback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupplementFallback();
