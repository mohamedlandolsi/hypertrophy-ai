/**
 * Direct test of the Gemini integration with debug logging
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_CONFIG = {
  userId: '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba',
  testQuery: 'What are the best exercises for muscle hypertrophy?'
};

async function testGeminiIntegrationDirectly() {
  console.log('🤖 Testing Gemini Integration with RAG');
  console.log('=====================================\n');

  try {
    // Step 1: Check AI Configuration
    console.log('1️⃣ Loading AI Configuration...');
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }

    console.log('✅ AI Configuration loaded:');
    console.log(`   Model: ${config.modelName}`);
    console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`   System Prompt Preview: ${config.systemPrompt.substring(0, 100)}...`);

    // Step 2: Test the getRelevantContext function manually
    console.log('\n2️⃣ Testing getRelevantContext function...');
    
    // Simulate what getRelevantContext does
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        userId: TEST_CONFIG.userId,
        status: 'READY'
      },
      select: {
        title: true,
        content: true,
        type: true
      },
      take: 3
    });

    let knowledgeContext = '';
    if (knowledgeItems.length > 0) {
      knowledgeContext = knowledgeItems.map((item) => 
        `=== ${item.title} ===\n${item.content || '[Content not available for text analysis]'}`
      ).join('\n\n');
    }

    console.log(`   Found ${knowledgeItems.length} knowledge items`);
    console.log(`   Context length: ${knowledgeContext.length} characters`);
    
    if (knowledgeContext.length > 0) {
      console.log(`   Context preview: ${knowledgeContext.substring(0, 300)}...`);
    }

    // Step 3: Construct the system instruction
    console.log('\n3️⃣ Constructing System Instruction...');
    
    const systemInstruction = `${config.systemPrompt}

${knowledgeContext ? 
`SCIENTIFIC REFERENCE MATERIAL (Your Primary Source of Truth):
${knowledgeContext}

CRITICAL INSTRUCTIONS FOR CONTEXT USAGE:
1. ALWAYS prioritize information from the Scientific Reference Material above
2. If the reference material contains information relevant to the user's question, cite it explicitly
3. If the reference material contradicts your general knowledge, follow the reference material
4. If the reference material is insufficient, clearly state what additional information might be needed
5. When making recommendations, directly connect them to specific points in the reference material
6. If you cannot find relevant information in the reference material, explicitly state this limitation

RESPONSE STRUCTURE:
- Start with the most relevant information from the reference material
- Clearly distinguish between reference-based information and general knowledge
- Provide specific citations when referencing the material (e.g., "According to [Document Title]...")
- End with actionable recommendations based on the available evidence

Your Task: Provide personalized coaching advice that integrates the scientific evidence from the reference material with the client's specific circumstances and question.` 

: 

`IMPORTANT: No specific knowledge base content is currently available for this query. 

FALLBACK INSTRUCTIONS:
- You are authorized to draw upon your general, pre-trained knowledge base
- Provide evidence-based fitness guidance using established scientific principles
- Clearly indicate when information is from general knowledge vs. specific studies
- Recommend that the user consider uploading relevant research papers or documents for more personalized advice
- Focus on well-established, broadly accepted fitness and nutrition principles`}

RESPONSE QUALITY REQUIREMENTS:
- Be specific and actionable
- Avoid generic advice that could apply to anyone
- Connect recommendations to the client's specific situation
- Use scientific terminology appropriately
- Provide reasoning for your recommendations
- Acknowledge any limitations in the available information`;

    console.log('✅ System instruction constructed');
    console.log(`   Total length: ${systemInstruction.length} characters`);
    console.log(`   Uses knowledge context: ${knowledgeContext.length > 0 ? 'YES' : 'NO'}`);
    console.log(`   Contains fallback: ${systemInstruction.includes('FALLBACK INSTRUCTIONS') ? 'YES' : 'NO'}`);

    // Step 4: Show what would be sent to Gemini
    console.log('\n4️⃣ Final Prompt Analysis...');
    
    if (knowledgeContext.length > 0) {
      console.log('✅ RAG system should work correctly');
      console.log('   - Knowledge context is present');
      console.log('   - Grounding instructions are included');
      console.log('   - The AI should use the fitness content');
      
      // Check relevance
      const queryLower = TEST_CONFIG.testQuery.toLowerCase();
      const contextLower = knowledgeContext.toLowerCase();
      
      const relevantTerms = ['exercise', 'muscle', 'hypertrophy', 'training', 'sets'];
      const foundTerms = relevantTerms.filter(term => contextLower.includes(term));
      
      console.log(`   - Query relevance: Found ${foundTerms.length}/${relevantTerms.length} relevant terms`);
      console.log(`   - Relevant terms: ${foundTerms.join(', ')}`);
      
    } else {
      console.log('❌ RAG system will not work');
      console.log('   - No knowledge context found');
      console.log('   - AI will use fallback mode');
    }

    // Step 5: Save the prompt for inspection
    console.log('\n5️⃣ Saving prompt for inspection...');
    
    const fs = require('fs');
    const promptData = {
      timestamp: new Date().toISOString(),
      query: TEST_CONFIG.testQuery,
      userId: TEST_CONFIG.userId,
      systemInstruction: systemInstruction,
      knowledgeContext: knowledgeContext,
      hasKnowledge: knowledgeContext.length > 0,
      knowledgeLength: knowledgeContext.length
    };
    
    fs.writeFileSync('debug-prompt-analysis.json', JSON.stringify(promptData, null, 2));
    console.log('✅ Prompt saved to debug-prompt-analysis.json');

  } catch (error) {
    console.error('❌ Error in Gemini integration test:', error.message);
  }
}

// Run the test
async function runGeminiTest() {
  try {
    await testGeminiIntegrationDirectly();
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runGeminiTest();
