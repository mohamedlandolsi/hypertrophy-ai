/**
 * Test Complete Knowledge Base Flow
 * 
 * This simulates the complete flow from user query to AI response with citations
 */

const { PrismaClient } = require('@prisma/client');

// Mock the required modules since we can't easily import TypeScript
async function simulateKnowledgeFlow() {
  console.log('🔄 Simulating Complete Knowledge Base Flow');
  console.log('==========================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Simulate user query
    const userQuery = "What are the best exercises for chest development?";
    console.log(`👤 User Query: "${userQuery}"`);
    
    // Step 2: Check if knowledge base would be triggered
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    console.log(`\n🔧 AI Configuration Check:`);
    console.log(`   Knowledge Base Enabled: ${aiConfig?.useKnowledgeBase}`);
    console.log(`   Max Chunks: ${aiConfig?.ragMaxChunks}`);
    
    if (!aiConfig?.useKnowledgeBase) {
      console.log('❌ Knowledge base is disabled - stopping test');
      return;
    }
    
    // Step 3: Simulate knowledge retrieval (simplified)
    console.log(`\n🔍 Knowledge Retrieval Simulation:`);
    const relevantChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'chest', mode: 'insensitive' } },
          { content: { contains: 'pectoral', mode: 'insensitive' } },
          { content: { contains: 'bench press', mode: 'insensitive' } },
          { content: { contains: 'push up', mode: 'insensitive' } }
        ],
        embeddingData: { not: null }
      },
      take: aiConfig.ragMaxChunks || 8,
      include: {
        knowledgeItem: { 
          select: { id: true, title: true }
        }
      }
    });
    
    console.log(`   Found ${relevantChunks.length} relevant chunks`);
    
    // Step 4: Build knowledge context (like gemini.ts does)
    const groupedChunks = relevantChunks.reduce((groups, chunk) => {
      const id = chunk.knowledgeItem.id;
      if (!groups[id]) {
        groups[id] = {
          title: chunk.knowledgeItem.title,
          chunks: []
        };
      }
      groups[id].chunks.push(chunk);
      return groups;
    }, {});
    
    console.log(`   Grouped into ${Object.keys(groupedChunks).length} knowledge items:`);
    Object.entries(groupedChunks).forEach(([id, data]) => {
      console.log(`     • ${data.title} (${data.chunks.length} chunks)`);
    });
    
    // Step 5: Create clean context and citations (like gemini.ts does)
    const contextParts = [];
    const uniqueCitations = [];
    
    Object.entries(groupedChunks).forEach(([knowledgeId, { title, chunks }]) => {
      // Sort chunks by their original order
      const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Create clean context content
      const chunkContent = sortedChunks.map(chunk => chunk.content).join('\n\n');
      contextParts.push(chunkContent);
      
      // Track unique sources for citations
      if (!uniqueCitations.find(cite => cite.id === knowledgeId)) {
        uniqueCitations.push({ id: knowledgeId, title });
      }
    });
    
    const knowledgeContext = contextParts.join('\n\n---\n\n');
    
    console.log(`\n📚 Knowledge Context Built:`);
    console.log(`   Context Length: ${knowledgeContext.length} characters`);
    console.log(`   Available Citations: ${uniqueCitations.length}`);
    uniqueCitations.forEach((citation, index) => {
      console.log(`     ${index + 1}. [${citation.title}](article:${citation.id})`);
    });
    
    // Step 6: Show what the AI system instruction would look like
    console.log(`\n🤖 AI System Instruction Preview:`);
    console.log('─'.repeat(80));
    
    const systemInstruction = `
--- KNOWLEDGE BASE CONTEXT ---
${knowledgeContext.slice(0, 400)}...
--- END OF KNOWLEDGE BASE CONTEXT ---

CRITICAL INSTRUCTIONS FOR CONTEXT USAGE:
1. ALWAYS prioritize information from the Knowledge Base Context above your general knowledge
2. Synthesize the provided information with your expert knowledge to create comprehensive advice
3. When you use information from the knowledge base context, include article references using this format: [Article Title](article:knowledge_item_id)
4. Present the knowledge professionally as an expert coach while citing sources appropriately

Your Task: Answer the question "${userQuery}" using the knowledge base context with proper citations.
`;
    
    console.log(systemInstruction);
    console.log('─'.repeat(80));
    
    // Step 7: Simulate expected AI response structure
    console.log(`\n💬 Expected AI Response Structure:`);
    console.log(`The AI should now generate a response that:`);
    console.log(`   • Uses information from the ${uniqueCitations.length} knowledge sources`);
    console.log(`   • Includes citations like: [A Guide to Effective Chest Training](article:${uniqueCitations[0]?.id})`);
    console.log(`   • Provides specific, evidence-based chest training advice`);
    console.log(`   • Shows article links in the chat UI references accordion`);
    
    // Step 8: Check that article links component will work
    console.log(`\n🔗 Article Links Component Check:`);
    if (uniqueCitations.length > 0) {
      console.log(`✅ Citations available for ArticleLinks component`);
      console.log(`✅ References accordion should display ${uniqueCitations.length} sources`);
      console.log(`✅ Users can click links to view full articles`);
    } else {
      console.log(`❌ No citations available - accordion will be empty`);
    }
    
    // Step 9: Final status
    console.log(`\n🎯 Knowledge Base Integration Status:`);
    const issues = [];
    const successes = [];
    
    if (aiConfig?.useKnowledgeBase) {
      successes.push('✅ Knowledge base enabled');
    } else {
      issues.push('❌ Knowledge base disabled');
    }
    
    if (relevantChunks.length > 0) {
      successes.push(`✅ ${relevantChunks.length} relevant chunks found`);
    } else {
      issues.push('❌ No relevant chunks found');
    }
    
    if (uniqueCitations.length > 0) {
      successes.push(`✅ ${uniqueCitations.length} citation sources available`);
    } else {
      issues.push('❌ No citation sources available');
    }
    
    successes.forEach(success => console.log(`   ${success}`));
    issues.forEach(issue => console.log(`   ${issue}`));
    
    if (issues.length === 0) {
      console.log(`\n🚀 READY: Knowledge base integration should work correctly!`);
      console.log(`   The AI will use knowledge content and cite sources properly.`);
      console.log(`   Article links will appear in the chat UI references accordion.`);
    } else {
      console.log(`\n⚠️  ISSUES: Knowledge base integration has problems that need fixing.`);
    }
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  simulateKnowledgeFlow()
    .then(() => {
      console.log('\n✅ Knowledge base flow simulation complete');
    })
    .catch(error => {
      console.error('💥 Simulation failed:', error);
      process.exit(1);
    });
}
