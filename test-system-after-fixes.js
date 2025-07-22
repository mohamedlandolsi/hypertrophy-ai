const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCurrentSystemAfterFixes() {
  try {
    console.log('🧪 TESTING SYSTEM AFTER ALL FIXES');
    console.log('=================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    const testQuery = 'What are the best chest exercises for muscle growth?';
    
    console.log(`🔍 Query: "${testQuery}"`);
    console.log('⏱️  Simulating the actual getRelevantContext flow...\n');
    
    // Check current configuration
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
      select: {
        ragSimilarityThreshold: true,
        ragMaxChunks: true,
        ragHighRelevanceThreshold: true
      }
    });
    
    console.log('⚙️  Current RAG Config:');
    console.log(`   Similarity Threshold: ${(config.ragSimilarityThreshold * 100).toFixed(1)}%`);
    console.log(`   Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   High Relevance: ${(config.ragHighRelevanceThreshold * 100).toFixed(1)}%`);
    
    // Test enhanced keyword search (which should now dominate with 70% weight)
    console.log('\n🔍 Testing keyword search (70% weight in hybrid):');
    
    // Search for chest-specific content using keyword matching
    const chestKeywordResults = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { 
          userId: userId,
          OR: [
            { title: { contains: 'chest', mode: 'insensitive' } },
            { title: { contains: 'pectoral', mode: 'insensitive' } }
          ]
        }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: config.ragMaxChunks
    });
    
    console.log(`   Found ${chestKeywordResults.length} chest-specific chunks via keyword search`);
    chestKeywordResults.forEach((chunk, index) => {
      console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
    });
    
    // Also test general keyword matching in content
    console.log('\n🔍 Testing content keyword search:');
    
    const contentKeywordResults = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { userId: userId },
        content: {
          contains: 'chest',
          mode: 'insensitive'
        }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: config.ragMaxChunks,
      orderBy: {
        knowledgeItem: { title: 'asc' }
      }
    });
    
    console.log(`   Found ${contentKeywordResults.length} chunks containing "chest" in content`);
    
    // Group by knowledge item to see diversity
    const itemGroups = {};
    contentKeywordResults.forEach(chunk => {
      const title = chunk.knowledgeItem.title;
      if (!itemGroups[title]) {
        itemGroups[title] = 0;
      }
      itemGroups[title]++;
    });
    
    console.log('\n📚 Content diversity:');
    Object.entries(itemGroups).slice(0, 5).forEach(([title, count]) => {
      console.log(`   • "${title}": ${count} chunks`);
    });
    
    // Expected behavior analysis
    console.log('\n📊 EXPECTED BEHAVIOR WITH CURRENT SETTINGS:');
    console.log('==========================================');
    
    if (chestKeywordResults.length >= 3) {
      console.log('✅ SUCCESS INDICATORS:');
      console.log('   • Keyword search finds chest-specific content');
      console.log('   • With 70% weight, keyword results should dominate');
      console.log('   • Chest queries should return chest-specific guides');
    } else {
      console.log('❌ POTENTIAL ISSUES:');
      console.log('   • Limited chest-specific title matches');
      console.log('   • May need to rely more on content keyword matching');
    }
    
    console.log('\n🔧 IF ISSUE PERSISTS:');
    console.log('====================');
    console.log('The problem might be:');
    console.log('1. Query transformation is changing "chest" to more general terms');
    console.log('2. Hybrid search combination logic needs debugging');
    console.log('3. Re-ranking is overriding keyword preferences');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('• Test the actual chat interface with a chest query');
    console.log('• Check what sources are returned in the UI');
    console.log('• If still generic, we may need to disable query transformation');
    console.log('• Or increase keyword weight to 80-90%');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentSystemAfterFixes();
