const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSourceAnonymityFix() {
  console.log('🔍 Testing Source Citation Anonymity Fix');
  console.log('=======================================\n');

  try {
    // Test 1: Verify AI Configuration has been updated
    console.log('1. Checking Updated AI Configuration...');
    const aiConfig = await prisma.aIConfiguration.findFirst();
    if (aiConfig && aiConfig.systemPrompt.includes('Source Anonymity is Mandatory')) {
      console.log('✅ System prompt includes strict source anonymity rules');
      console.log('   - Found: "Source Anonymity is Mandatory" instruction');
    } else {
      console.log('❌ System prompt does not include source anonymity rules');
      return;
    }

    // Test 2: Check knowledge base has content
    console.log('\n2. Checking Knowledge Base Content...');
    const totalChunks = await prisma.knowledgeChunk.count();
    if (totalChunks > 0) {
      console.log(`✅ Knowledge base has ${totalChunks} chunks available for testing`);
    } else {
      console.log('⚠️  No knowledge chunks found - citations won\'t be generated');
    }

    // Test 3: Test Chat API with a question that would trigger citations
    console.log('\n3. Testing Chat API Response (Source Anonymity)...');
    const testQuery = "What are the best exercises for chest development?";
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        isGuest: true // Use guest mode for quick testing
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat API responded successfully');
      
      // Check if response mentions article titles or sources
      const aiResponse = data.assistantReply || '';
      const hasForbiddenMentions = [
        'Guide to', 'Article:', 'According to', 'Source:', 'Document:',
        'research paper', 'study shows', 'article mentions', 'guide states'
      ].some(phrase => aiResponse.toLowerCase().includes(phrase.toLowerCase()));
      
      if (hasForbiddenMentions) {
        console.log('❌ AI response contains forbidden source mentions');
        console.log('   Response preview:', aiResponse.substring(0, 200) + '...');
      } else {
        console.log('✅ AI response properly avoids mentioning sources');
        console.log('   Response preview:', aiResponse.substring(0, 200) + '...');
      }
      
      // Check if citations are returned separately
      if (data.citations && Array.isArray(data.citations)) {
        console.log(`✅ Citations returned separately: ${data.citations.length} sources`);
        data.citations.forEach((citation, index) => {
          console.log(`   ${index + 1}. ${citation.title} (ID: ${citation.id})`);
        });
      } else {
        console.log('ℹ️  No citations returned (may be expected if no relevant knowledge found)');
      }
      
    } else {
      console.log(`❌ Chat API failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText.substring(0, 200));
    }

    console.log('\n🎉 Source Citation Anonymity Test Complete!');
    console.log('✅ The AI should now:');
    console.log('   - Never mention article titles in responses');
    console.log('   - Synthesize knowledge seamlessly as expert advice');
    console.log('   - Return citations separately for UI display');
    console.log('   - Follow strict source anonymity rules');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSourceAnonymityFix();
