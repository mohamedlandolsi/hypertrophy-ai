// Debug script to check current AI configuration and system prompt
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkCurrentAIConfig() {
  try {
    console.log('🔍 Checking Current AI Configuration...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ No AI configuration found!');
      return;
    }
    
    console.log('📊 Current AI Configuration:');
    console.log('='.repeat(50));
    console.log(`System Prompt Length: ${config.systemPrompt.length} characters`);
    console.log(`Temperature: ${config.temperature}`);
    console.log(`Max Tokens: ${config.maxTokens}`);
    console.log(`Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`RAG Similarity Threshold: ${config.ragSimilarityThreshold}`);
    console.log(`RAG Max Chunks: ${config.ragMaxChunks}`);
    console.log(`RAG High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
    
    console.log('\n📝 Current System Prompt:');
    console.log('='.repeat(50));
    console.log(config.systemPrompt);
    console.log('='.repeat(50));
    
    // Check knowledge base status
    console.log('\n📚 Knowledge Base Status:');
    const knowledgeItems = await prisma.knowledgeItem.count({
      where: { status: 'READY' }
    });
    
    const knowledgeChunks = await prisma.knowledgeChunk.count({
      where: {
        knowledgeItem: { status: 'READY' },
        embeddingData: { not: null }
      }
    });
    
    console.log(`Knowledge Items: ${knowledgeItems}`);
    console.log(`Knowledge Chunks with Embeddings: ${knowledgeChunks}`);
    
    // Check for leg exercise content specifically
    console.log('\n🦵 Checking for Leg Exercise Content:');
    const legRelatedChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { status: 'READY' },
        OR: [
          { content: { contains: 'leg', mode: 'insensitive' } },
          { content: { contains: 'squat', mode: 'insensitive' } },
          { content: { contains: 'deadlift', mode: 'insensitive' } },
          { content: { contains: 'quad', mode: 'insensitive' } },
          { content: { contains: 'hamstring', mode: 'insensitive' } },
          { content: { contains: 'glute', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 5
    });
    
    console.log(`Found ${legRelatedChunks.length} chunks with leg-related content`);
    legRelatedChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. From "${chunk.knowledgeItem.title}"`);
      console.log(`   Preview: ${chunk.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error checking AI config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentAIConfig();
