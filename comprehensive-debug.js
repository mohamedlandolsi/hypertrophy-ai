const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSystemFlow() {
  try {
    console.log('🔍 COMPREHENSIVE SYSTEM DEBUG');
    console.log('==============================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const testQuery = 'What are the best chest exercises for muscle growth?';
    
    console.log(`Query: "${testQuery}"`);
    console.log(`User ID: ${userId}`);
    
    // 1. Check if user exists and has knowledge
    console.log('\n1️⃣ Checking user and knowledge base...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        knowledgeItems: {
          select: {
            id: true,
            title: true,
            status: true,
            _count: { select: { chunks: true } }
          }
        },
        _count: { select: { knowledgeItems: true } }
      }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ User found with ${user._count.knowledgeItems} knowledge items`);
    
    // Check for chest-specific items
    const chestItems = user.knowledgeItems.filter(item => 
      item.title.toLowerCase().includes('chest')
    );
    console.log(`📚 Chest-specific items: ${chestItems.length}`);
    chestItems.forEach(item => {
      console.log(`   • "${item.title}" (${item._count.chunks} chunks, status: ${item.status})`);
    });
    
    // 2. Check RAG configuration
    console.log('\n2️⃣ Checking RAG configuration...');
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!config) {
      console.log('❌ AI Configuration not found!');
      return;
    }
    
    console.log(`✅ AI Config found:`);
    console.log(`   Model: ${config.modelName}`);
    console.log(`   Use Knowledge Base: ${config.useKnowledgeBase}`);
    console.log(`   Similarity Threshold: ${(config.ragSimilarityThreshold * 100).toFixed(1)}%`);
    console.log(`   Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   High Relevance: ${(config.ragHighRelevanceThreshold * 100).toFixed(1)}%`);
    
    // 3. Test direct keyword search
    console.log('\n3️⃣ Testing direct keyword search...');
    console.time('Keyword search timing');
    
    const keywordResults = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { 
          userId: userId,
          status: 'READY'
        },
        OR: [
          { content: { contains: 'chest', mode: 'insensitive' } },
          { knowledgeItem: { title: { contains: 'chest', mode: 'insensitive' } } }
        ]
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: config.ragMaxChunks
    });
    
    console.timeEnd('Keyword search timing');
    console.log(`📊 Found ${keywordResults.length} chunks via keyword search`);
    
    if (keywordResults.length > 0) {
      console.log('Top keyword matches:');
      keywordResults.slice(0, 3).forEach((chunk, index) => {
        console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
        console.log(`      "${chunk.content.substring(0, 100)}..."`);
      });
    }
    
    // 4. Check embedding availability
    console.log('\n4️⃣ Checking embedding availability...');
    const embeddingStats = await prisma.knowledgeChunk.groupBy({
      by: ['knowledgeItemId'],
      where: {
        knowledgeItem: { userId: userId },
        embeddingData: { not: null }
      },
      _count: { id: true }
    });
    
    console.log(`📊 ${embeddingStats.length} knowledge items have embeddings`);
    
    const totalChunks = await prisma.knowledgeChunk.count({
      where: { knowledgeItem: { userId: userId } }
    });
    
    const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
      where: { 
        knowledgeItem: { userId: userId },
        embeddingData: { not: null }
      }
    });
    
    const embeddingCoverage = totalChunks > 0 ? (chunksWithEmbeddings / totalChunks * 100).toFixed(1) : 0;
    console.log(`📊 Embedding coverage: ${chunksWithEmbeddings}/${totalChunks} (${embeddingCoverage}%)`);
    
    // 5. Test the actual flow
    console.log('\n5️⃣ Testing retrieval flow...');
    
    if (keywordResults.length === 0) {
      console.log('❌ CRITICAL ISSUE: No keyword matches found!');
      console.log('   This means either:');
      console.log('   • No chest content exists in the knowledge base');
      console.log('   • Knowledge items are not in READY status');
      console.log('   • Database query is not working correctly');
    } else if (chunksWithEmbeddings === 0) {
      console.log('❌ CRITICAL ISSUE: No embeddings found!');
      console.log('   This means vector search will fail completely');
      console.log('   • Need to reprocess knowledge base');
      console.log('   • Or switch to keyword-only search');
    } else {
      console.log('✅ Both keyword and vector search should work');
      console.log('   Issue might be in:');
      console.log('   • Hybrid search combination logic');
      console.log('   • Query processing in getRelevantContext');
      console.log('   • Gemini API calls taking too long');
    }
    
    // 6. Performance analysis
    console.log('\n6️⃣ Performance analysis...');
    console.log('Expected timing breakdown:');
    console.log('   • Keyword search: <1 second');
    console.log('   • Embedding generation: 0.5-1 second');  
    console.log('   • Vector similarity calc: 1-2 seconds for 2800 chunks');
    console.log('   • Total should be: 3-5 seconds');
    console.log('');
    console.log('If responses are 10+ seconds, likely causes:');
    console.log('   • Multiple fallback attempts (threshold too high)');
    console.log('   • Gemini API rate limiting or timeouts');
    console.log('   • Query transformation API calls (now disabled)');
    console.log('   • Database connection issues');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSystemFlow();
