/**
 * Script to debug the exact prompt being sent to Gemini
 * This will help us see if the context is being properly injected
 */

const { PrismaClient } = require('@prisma/client');
const { getRelevantContext } = require('./src/lib/vector-search');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  userId: 'user_2q9ZGQMZkNkqLdpgwPpVYv5bXkH', // Update with your actual user ID
  testQuery: 'What are the best exercises for muscle hypertrophy?'
};

async function debugPromptConstruction() {
  console.log('🔍 Debugging Prompt Construction...');
  console.log('=====================================\n');

  try {
    // Step 1: Get AI configuration
    console.log('1️⃣ Getting AI Configuration...');
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
    console.log(`   System Prompt Length: ${config.systemPrompt.length} characters`);

    // Step 2: Get knowledge context
    console.log('\n2️⃣ Retrieving Knowledge Context...');
    let knowledgeContext = '';
    
    if (config.useKnowledgeBase) {
      knowledgeContext = await getRelevantContext(
        TEST_CONFIG.userId,
        TEST_CONFIG.testQuery,
        7,
        0.5,
        []
      );
      
      console.log(`✅ Knowledge context retrieved: ${knowledgeContext.length} characters`);
      
      if (knowledgeContext.length > 0) {
        console.log('\n📚 Knowledge Context Preview:');
        console.log('─'.repeat(50));
        console.log(knowledgeContext.substring(0, 500) + '...');
        console.log('─'.repeat(50));
      } else {
        console.log('❌ No knowledge context retrieved');
      }
    } else {
      console.log('❌ Knowledge base disabled in configuration');
    }

    // Step 3: Construct the system instruction (simulate what sendToGemini does)
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

    console.log('\n📝 Final System Instruction:');
    console.log('═'.repeat(80));
    console.log(systemInstruction);
    console.log('═'.repeat(80));
    
    console.log(`\n📊 System Instruction Stats:`);
    console.log(`   Total length: ${systemInstruction.length} characters`);
    console.log(`   Word count: ${systemInstruction.split(' ').length} words`);
    console.log(`   Contains knowledge context: ${knowledgeContext.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contains fallback instructions: ${systemInstruction.includes('FALLBACK INSTRUCTIONS') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Contains grounding instructions: ${systemInstruction.includes('CRITICAL INSTRUCTIONS') ? '✅ YES' : '❌ NO'}`);

    // Step 4: Test the prompt structure
    console.log('\n4️⃣ Testing Prompt Structure...');
    
    if (knowledgeContext.length > 0) {
      console.log('✅ RAG prompt structure is CORRECT');
      console.log('   - Retrieved context is present');
      console.log('   - Grounding instructions are included');
      console.log('   - Citation requirements are specified');
      
      // Check for potential issues
      if (systemInstruction.length > 30000) {
        console.log('⚠️ WARNING: System instruction is very long, might hit token limits');
      }
      
      if (knowledgeContext.length < 100) {
        console.log('⚠️ WARNING: Knowledge context is very short, might not be useful');
      }
    } else {
      console.log('❌ RAG prompt structure has ISSUES');
      console.log('   - No retrieved context found');
      console.log('   - Will use fallback instructions');
      console.log('   - AI will use general knowledge instead');
    }

    // Step 5: Check if context contains relevant information
    console.log('\n5️⃣ Analyzing Context Relevance...');
    
    if (knowledgeContext.length > 0) {
      const queryKeywords = TEST_CONFIG.testQuery.toLowerCase().split(' ').filter(w => w.length > 2);
      const contextLower = knowledgeContext.toLowerCase();
      
      console.log(`Query keywords: ${queryKeywords.join(', ')}`);
      
      const foundKeywords = queryKeywords.filter(keyword => contextLower.includes(keyword));
      console.log(`Keywords found in context: ${foundKeywords.join(', ')}`);
      
      if (foundKeywords.length === 0) {
        console.log('⚠️ WARNING: No query keywords found in context - relevance might be low');
      } else {
        console.log(`✅ Context relevance: ${foundKeywords.length}/${queryKeywords.length} keywords matched`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging prompt construction:', error.message);
  }
}

// Run the debug session
async function runPromptDebug() {
  try {
    await debugPromptConstruction();
  } catch (error) {
    console.error('❌ Prompt debug failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the debug session
runPromptDebug();
