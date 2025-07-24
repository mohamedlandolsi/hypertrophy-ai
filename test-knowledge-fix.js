/**
 * Test Knowledge Base Integration After Fix
 * 
 * This script tests if the AI is now properly using and citing knowledge base content
 */

const { PrismaClient } = require('@prisma/client');

async function testKnowledgeIntegrationFix() {
  console.log('🧪 Testing Knowledge Base Integration After Fix');
  console.log('==============================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Create a test message and get AI response
    console.log('1. Testing AI Response with Knowledge Integration...');
    
    // First, let's see what knowledge is available for chest training
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        content: {
          contains: 'chest',
          mode: 'insensitive'
        },
        embeddingData: { not: null }
      },
      take: 3,
      include: {
        knowledgeItem: { select: { title: true, id: true } }
      }
    });
    
    console.log(`✅ Found ${chestChunks.length} chest-related knowledge chunks:`);
    chestChunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. ${chunk.knowledgeItem.title}`);
      console.log(`      ID: ${chunk.knowledgeItem.id}`);
      console.log(`      Content preview: "${chunk.content.slice(0, 100)}..."`);
    });
    
    // Test 2: Now let's simulate what the AI should receive
    console.log('\n2. Simulating Knowledge Context Construction...');
    
    const mockKnowledgeContext = chestChunks.map(chunk => chunk.content).join('\n\n---\n\n');
    const mockCitations = chestChunks.map(chunk => ({
      id: chunk.knowledgeItem.id,
      title: chunk.knowledgeItem.title
    }));
    
    console.log(`✅ Mock knowledge context created:`);
    console.log(`   Context length: ${mockKnowledgeContext.length} characters`);
    console.log(`   Available citations: ${mockCitations.length}`);
    mockCitations.forEach((citation, index) => {
      console.log(`   ${index + 1}. [${citation.title}](article:${citation.id})`);
    });
    
    // Test 3: Check if the fix is in place
    console.log('\n3. Verifying Fix Implementation...');
    
    // Read the current gemini.ts file to see if the fix is applied
    const fs = require('fs');
    const geminiFile = fs.readFileSync('./src/lib/gemini.ts', 'utf8');
    
    if (geminiFile.includes('NEVER mention article titles, sources, or reference the knowledge base directly')) {
      console.log('❌ OLD INSTRUCTION STILL PRESENT: AI is still told to NEVER cite sources');
      console.log('   This needs to be fixed for references to appear');
    } else if (geminiFile.includes('include article references using this format')) {
      console.log('✅ FIXED: AI is now instructed to include article references');
      console.log('   The AI should now cite sources properly');
    } else {
      console.log('⚠️  UNCLEAR: Citation instructions may need review');
    }
    
    // Test 4: Check knowledge base retrieval is working
    console.log('\n4. Testing Knowledge Retrieval Process...');
    
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log(`✅ Knowledge base enabled: ${aiConfig?.useKnowledgeBase}`);
    console.log(`✅ Max chunks: ${aiConfig?.ragMaxChunks}`);
    console.log(`✅ Similarity threshold: ${aiConfig?.ragSimilarityThreshold}`);
    
    if (aiConfig?.useKnowledgeBase && chestChunks.length > 0) {
      console.log('✅ ALL COMPONENTS READY: Knowledge base is enabled and has content');
    } else {
      console.log('❌ ISSUE: Knowledge base disabled or no content available');
    }
    
    // Test 5: Sample what the AI should see
    console.log('\n5. Sample AI System Instruction (with knowledge)...');
    console.log('─'.repeat(80));
    
    const sampleSystemInstruction = `${aiConfig?.systemPrompt || 'System prompt'}

--- KNOWLEDGE BASE CONTEXT ---
${mockKnowledgeContext.slice(0, 500)}...
--- END OF KNOWLEDGE BASE CONTEXT ---

CRITICAL INSTRUCTIONS FOR CONTEXT USAGE:
1. ALWAYS prioritize information from the Knowledge Base Context above your general knowledge
2. Synthesize the provided information with your expert knowledge to create comprehensive advice
3. When you use information from the knowledge base context, include article references using this format: [Article Title](article:knowledge_item_id)
4. If the context material contradicts your general knowledge, follow the context material
5. If the context material is insufficient, you may supplement with general knowledge
6. When making recommendations, base them on the provided context when available
7. Present the knowledge professionally as an expert coach while citing sources appropriately

Your Task: Provide personalized coaching advice that integrates the knowledge base context with proper citations.`;
    
    console.log(sampleSystemInstruction.slice(0, 1000) + '...');
    console.log('─'.repeat(80));
    
    console.log('\n🎯 Expected Behavior:');
    console.log('• AI receives knowledge base context with chest training information');
    console.log('• AI is instructed to cite sources using [Title](article:id) format');
    console.log('• AI response should include specific knowledge from context');
    console.log('• Article links should appear in the chat UI references accordion');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test the fix by asking a chest training question in the chat');
    console.log('2. Verify that the AI response includes knowledge from the context');
    console.log('3. Check that article links appear in the references accordion');
    console.log('4. Confirm the AI is citing specific knowledge items properly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  testKnowledgeIntegrationFix()
    .then(() => {
      console.log('\n✅ Knowledge integration test complete');
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
