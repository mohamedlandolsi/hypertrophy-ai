const { PrismaClient } = require('@prisma/client');

async function testChestContent() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Chest Content Retrieval\n');
    
    // Check for chest-related content in the knowledge base
    console.log('📚 Checking for chest content in knowledge base...');
    
    const chestItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'chest', mode: 'insensitive' } },
          { title: { contains: 'pectorals', mode: 'insensitive' } },
          { title: { contains: 'pec', mode: 'insensitive' } },
          { title: { contains: 'hypertrophy', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        type: true
      }
    });
    
    console.log(`Found ${chestItems.length} chest/hypertrophy related items:`);
    chestItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title} (${item.type}) (ID: ${item.id})`);
    });
    
    // Also check chunk content for chest mentions
    const chestChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'chest', mode: 'insensitive' } },
          { content: { contains: 'pectorals', mode: 'insensitive' } },
          { content: { contains: 'hypertrophy', mode: 'insensitive' } },
          { content: { contains: 'mechanical tension', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: {
            title: true
          }
        }
      },
      take: 15
    });
    
    console.log(`\nFound ${chestChunks.length} chunks with chest/hypertrophy content:`);
    chestChunks.forEach((chunk, i) => {
      console.log(`${i + 1}. From: ${chunk.knowledgeItem.title} (Chunk ID: ${chunk.id})`);
      console.log(`   Content preview: ${chunk.content.substring(0, 150)}...`);
    });
    
    // Test the specific query from the screenshot
    console.log('\n🎯 Testing specific query: "How to effectively train chest for maximum hypertrophy"');
    
    const query = 'How to effectively train chest for maximum hypertrophy';
    const lowerQuery = query.toLowerCase();
    
    // Test our improved keyword search logic
    let searchTerms;
    if (lowerQuery.includes('chest') || lowerQuery.includes('pectorals') || lowerQuery.includes('pec')) {
      // Chest-specific search
      searchTerms = 'chest | pectorals | pec | press | bench | fly | dip | hypertrophy';
      console.log(`💪 Chest query detected - using targeted search: "${searchTerms}"`);
    } else {
      // Fallback
      const stopWords = ['what', 'are', 'the', 'best', 'how', 'to', 'for', 'is', 'and', 'or', 'a', 'an'];
      const terms = lowerQuery
        .replace(/[^\w\s]/g, ' ')
        .split(' ')
        .filter(term => term.length > 2 && !stopWords.includes(term));
      
      searchTerms = terms.length <= 2 ? terms.join(' | ') : terms.join(' & ');
      console.log(`🎯 General search (${terms.length} terms): "${searchTerms}"`);
    }
    
    const searchResults = await prisma.$queryRaw`
      SELECT 
        kc.content,
        kc."chunkIndex",
        ki.id as "knowledgeId",
        ki.title,
        ts_rank(to_tsvector('english', kc.content), to_tsquery('english', ${searchTerms})) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeItem" ki ON kc."knowledgeItemId" = ki.id
      WHERE ki.status = 'READY'
        AND to_tsvector('english', kc.content) @@ to_tsquery('english', ${searchTerms})
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    console.log(`\nKeyword search results for chest query (${searchResults.length} found):`);
    searchResults.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title} (Similarity: ${result.similarity})`);
      console.log(`   Content preview: ${result.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error during chest content test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChestContent();
