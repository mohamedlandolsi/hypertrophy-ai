const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugKeywordRanking() {
  try {
    console.log('🔍 DEBUG: Why foundational content ranks higher than chest content');
    console.log('=============================================================');
    
    const userId = '3e9ab191-e4e9-4eb4-a8eb-e95cbc39c7ba';
    
    // Test the exact same query from the keyword search
    console.log('Testing keyword search ranking...');
    
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
      take: 15 // Get more results to see the pattern
    });
    
    console.log(`\nFound ${keywordResults.length} chunks. Analyzing ranking...`);
    
    // Group by knowledge item
    const itemGroups = {};
    keywordResults.forEach(chunk => {
      const title = chunk.knowledgeItem.title;
      if (!itemGroups[title]) {
        itemGroups[title] = [];
      }
      itemGroups[title].push(chunk);
    });
    
    console.log('\n📊 Results by knowledge item:');
    Object.entries(itemGroups).forEach(([title, chunks]) => {
      console.log(`\n"${title}": ${chunks.length} chunks`);
      
      // Show first chunk from each item
      const firstChunk = chunks[0];
      console.log(`   First chunk: "${firstChunk.content.substring(0, 120)}..."`);
      
      // Count "chest" occurrences
      const chestCount = (firstChunk.content.toLowerCase().match(/chest/g) || []).length;
      console.log(`   "chest" mentions: ${chestCount}`);
      
      if (title.toLowerCase().includes('chest')) {
        console.log(`   ✅ This IS chest-specific content!`);
      } else {
        console.log(`   ❓ This is NOT chest-specific - why is it ranking high?`);
      }
    });
    
    // Now test a more targeted query
    console.log('\n🎯 Testing chest-specific query...');
    
    const chestSpecificResults = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { 
          userId: userId,
          status: 'READY',
          title: { contains: 'chest', mode: 'insensitive' }
        }
      },
      include: { knowledgeItem: { select: { title: true } } },
      take: 8,
      orderBy: { chunkIndex: 'asc' }
    });
    
    console.log(`\nChest-specific items found: ${chestSpecificResults.length} chunks`);
    chestSpecificResults.slice(0, 5).forEach((chunk, index) => {
      console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}" - Chunk ${chunk.chunkIndex}`);
      console.log(`      Content: "${chunk.content.substring(0, 100)}..."`);
    });
    
    console.log('\n💡 ANALYSIS:');
    console.log('=============');
    
    const foundationalCount = keywordResults.filter(r => 
      r.knowledgeItem.title.toLowerCase().includes('foundational')
    ).length;
    
    const chestTitleCount = keywordResults.filter(r => 
      r.knowledgeItem.title.toLowerCase().includes('chest')
    ).length;
    
    console.log(`Foundational training chunks in results: ${foundationalCount}`);
    console.log(`Chest-specific chunks in results: ${chestTitleCount}`);
    
    if (foundationalCount > chestTitleCount) {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      console.log('   Foundational content has more "chest" mentions in content than');
      console.log('   chest-specific guides have in their titles + content combined.');
      console.log('   Need to prioritize TITLE matches over content matches.');
    }
    
    console.log('\n🔧 SOLUTION:');
    console.log('   Modify keyword search to strongly prefer title matches');
    console.log('   over content matches for muscle-specific queries.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugKeywordRanking();
