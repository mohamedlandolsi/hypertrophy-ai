/**
 * Debug Knowledge Base Usage in AI Responses
 * 
 * This script tests whether the AI is actually retrieving and using knowledge base content
 */

const { PrismaClient } = require('@prisma/client');

async function debugKnowledgeBaseUsage() {
  console.log('🔍 Debugging Knowledge Base Usage in AI Responses');
  console.log('==================================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Check AI Configuration
    console.log('1. Checking AI Configuration...');
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!aiConfig) {
      console.log('❌ No AI configuration found!');
      return;
    }
    
    console.log('✅ AI Configuration found:');
    console.log(`   Use Knowledge Base: ${aiConfig.useKnowledgeBase}`);
    console.log(`   Max Chunks: ${aiConfig.ragMaxChunks}`);
    console.log(`   Similarity Threshold: ${aiConfig.ragSimilarityThreshold}`);
    console.log(`   High Relevance Threshold: ${aiConfig.ragHighRelevanceThreshold}`);
    console.log(`   System Prompt Length: ${aiConfig.systemPrompt.length} chars`);
    
    // Test 2: Check knowledge base content
    console.log('\n2. Checking Knowledge Base Content...');
    const totalChunks = await prisma.knowledgeChunk.count();
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: { not: null }
      }
    });
    
    console.log(`✅ Total Knowledge Chunks: ${totalChunks}`);
    console.log(`✅ Chunks with Embeddings: ${chunksWithEmbeddings}`);
    
    // Sample some chunks to see their content
    const sampleChunks = await prisma.knowledgeChunk.findMany({
      take: 3,
      include: {
        knowledgeItem: { select: { title: true } }
      },
      where: {
        embeddingData: { not: null }
      }
    });
    
    console.log('\n📄 Sample Knowledge Chunks:');
    sampleChunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. ${chunk.knowledgeItem.title}`);
      console.log(`      Content: "${chunk.content.slice(0, 150)}..."`);
      console.log(`      Has Embedding: ${chunk.embeddingData ? 'Yes' : 'No'}`);
    });
    
    // Test 3: Check system prompt for knowledge integration
    console.log('\n3. Analyzing System Prompt for Knowledge Integration...');
    const systemPrompt = aiConfig.systemPrompt.toLowerCase();
    
    const knowledgeKeywords = [
      'knowledge base',
      'context', 
      'provided information',
      'retrieved',
      'above information',
      'given content',
      'reference',
      'source',
      'prioritize information',
      'use the context'
    ];
    
    const foundKeywords = knowledgeKeywords.filter(keyword => 
      systemPrompt.includes(keyword.toLowerCase())
    );
    
    console.log(`✅ System prompt analysis:`);
    console.log(`   Total length: ${aiConfig.systemPrompt.length} characters`);
    console.log(`   Knowledge integration keywords found: ${foundKeywords.length}/10`);
    if (foundKeywords.length > 0) {
      console.log(`   Found keywords: ${foundKeywords.join(', ')}`);
    }
    
    // Show a portion of the system prompt
    console.log('\n📋 System Prompt Preview (first 500 chars):');
    console.log('─'.repeat(50));
    console.log(aiConfig.systemPrompt.slice(0, 500) + '...');
    console.log('─'.repeat(50));
    
    // Test 4: Check recent chat messages to see if knowledge is being retrieved
    console.log('\n4. Checking Recent Chat Activity...');
    const recentChats = await prisma.chat.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 2,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log(`✅ Found ${recentChats.length} recent chats:`);
    recentChats.forEach((chat, index) => {
      console.log(`   ${index + 1}. Chat ID: ${chat.id.slice(0, 8)}...`);
      console.log(`      Messages: ${chat.messages.length}`);
      if (chat.messages.length > 0) {
        const lastMessage = chat.messages[0];
        console.log(`      Last message: "${lastMessage.content.slice(0, 100)}..."`);
        console.log(`      Role: ${lastMessage.role}`);
      }
    });
    
    // Test 5: Simple keyword search test
    console.log('\n5. Testing Knowledge Base Search Capability...');
    const testTerms = ['chest', 'hypertrophy', 'training', 'muscle', 'exercise'];
    
    for (const term of testTerms) {
      const matchingChunks = await prisma.knowledgeChunk.count({
        where: {
          content: {
            contains: term,
            mode: 'insensitive'
          },
          embeddingData: { not: null }
        }
      });
      
      console.log(`   "${term}": ${matchingChunks} chunks found`);
    }
    
    // Test 6: Check if the system is configured to block references
    console.log('\n6. Checking for Reference Blocking in System Prompt...');
    const blockingKeywords = [
      'never mention',
      'do not reference',
      'dont mention',
      'avoid mentioning',
      'hide sources',
      'no citations',
      'without mentioning'
    ];
    
    const blockingFound = blockingKeywords.filter(keyword =>
      systemPrompt.includes(keyword.toLowerCase())
    );
    
    if (blockingFound.length > 0) {
      console.log('⚠️  WARNING: System prompt may be blocking references:');
      blockingFound.forEach(keyword => {
        console.log(`   - Contains: "${keyword}"`);
      });
    } else {
      console.log('✅ No obvious reference-blocking instructions found');
    }
    
    // Final assessment
    console.log('\n🎯 Knowledge Base Usage Assessment');
    console.log('===================================');
    
    const issues = [];
    const strengths = [];
    
    if (!aiConfig.useKnowledgeBase) {
      issues.push('Knowledge base is disabled in AI configuration');
    } else {
      strengths.push('Knowledge base is enabled');
    }
    
    if (chunksWithEmbeddings === 0) {
      issues.push('No chunks have embeddings - vector search will fail');
    } else {
      strengths.push(`${chunksWithEmbeddings} chunks have embeddings`);
    }
    
    if (foundKeywords.length < 3) {
      issues.push('System prompt lacks clear knowledge integration instructions');
    } else {
      strengths.push('System prompt contains knowledge integration instructions');
    }
    
    if (blockingFound.length > 0) {
      issues.push('System prompt may be blocking references/citations');
    }
    
    console.log('✅ Strengths:');
    strengths.forEach(strength => console.log(`   • ${strength}`));
    
    if (issues.length > 0) {
      console.log('\n⚠️  Potential Issues:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      
      console.log('\n🔧 Recommendations:');
      if (!aiConfig.useKnowledgeBase) {
        console.log('   1. Enable knowledge base in Admin AI Settings');
      }
      if (foundKeywords.length < 3) {
        console.log('   2. Update system prompt to explicitly instruct AI to use provided context');
      }
      if (blockingFound.length > 0) {
        console.log('   3. Remove reference-blocking instructions from system prompt');
      }
      console.log('   4. Test with specific fitness queries that should have knowledge matches');
    } else {
      console.log('\n✅ Configuration appears correct for knowledge base usage');
      console.log('If AI is still not using knowledge, the issue may be in the prompt integration logic');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  debugKnowledgeBaseUsage()
    .then(() => {
      console.log('\n✅ Knowledge base usage debug complete');
    })
    .catch(error => {
      console.error('💥 Debug script failed:', error);
      process.exit(1);
    });
}
