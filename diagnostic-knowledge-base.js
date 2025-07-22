const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDiagnostics() {
  try {
    console.log('📊 KNOWLEDGE BASE DIAGNOSTIC');
    console.log('============================');
    
    // 1. Chunks per knowledge item
    console.log('\n📚 Chunks per knowledge item:');
    const chunkCounts = await prisma.knowledgeChunk.groupBy({
      by: ['knowledgeItemId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });
    
    for (let i = 0; i < Math.min(10, chunkCounts.length); i++) {
      const item = await prisma.knowledgeItem.findUnique({
        where: { id: chunkCounts[i].knowledgeItemId },
        select: { title: true }
      });
      console.log(`   ${i+1}. "${item?.title}" - ${chunkCounts[i]._count.id} chunks`);
    }
    
    // 2. Items with missing embeddings
    console.log('\n⚠️  Checking for missing embeddings...');
    const missingEmbeddings = await prisma.knowledgeChunk.groupBy({
      by: ['knowledgeItemId'],
      where: { embeddingData: null },
      _count: { id: true }
    });
    
    console.log(`   Items with missing embeddings: ${missingEmbeddings.length}`);
    
    // 3. Current AI configuration
    console.log('\n🔧 Current AI Configuration:');
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true,
        maxTokens: true,
        modelName: true,
        temperature: true
      }
    });
    
    if (config) {
      console.log(`   Similarity Threshold: ${config.ragSimilarityThreshold}`);
      console.log(`   Max Chunks: ${config.ragMaxChunks}`);
      console.log(`   High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
      console.log(`   Max Tokens: ${config.maxTokens}`);
      console.log(`   Model: ${config.modelName}`);
      console.log(`   Temperature: ${config.temperature}`);
    }
    
    // 4. Identify dominating documents
    console.log('\n🎯 ANALYSIS:');
    if (chunkCounts.length > 0) {
      const topItem = chunkCounts[0];
      const topItemDetails = await prisma.knowledgeItem.findUnique({
        where: { id: topItem.knowledgeItemId },
        select: { title: true }
      });
      
      const avgChunks = chunkCounts.reduce((sum, item) => sum + item._count.id, 0) / chunkCounts.length;
      
      console.log(`   📈 Largest item: "${topItemDetails?.title}" (${topItem._count.id} chunks)`);
      console.log(`   📊 Average chunks per item: ${avgChunks.toFixed(1)}`);
      
      if (topItem._count.id > avgChunks * 3) {
        console.log(`   ⚠️  WARNING: "${topItemDetails?.title}" is dominating (${topItem._count.id} vs ${avgChunks.toFixed(1)} avg)`);
        console.log(`      This could explain why it appears in most search results`);
      }
    }
    
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();
