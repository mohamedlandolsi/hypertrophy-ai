const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAISearch() {
  console.log('🔍 Debugging AI Search vs Available Content');
  console.log('==========================================\n');

  try {
    // 1. Check exactly what the AI is asking for
    const aiSearchTerms = [
      'Upper Body Workout Structure',
      'Lower Body Workout Structure',
      'upper body exercises',
      'lower body exercises',
      'specific training parameters',
      'exercise selection',
      'rep ranges',
      'rest periods'
    ];

    console.log('🎯 What the AI is specifically asking for:\n');
    aiSearchTerms.forEach((term, index) => {
      console.log(`   ${index + 1}. "${term}"`);
    });

    console.log('\n📚 Checking if these exist in knowledge base...\n');

    // 2. Search for exact matches to what AI is asking for
    for (const term of aiSearchTerms) {
      console.log(`🔍 Searching for: "${term}"`);
      
      // Check knowledge item titles
      const titleMatches = await prisma.knowledgeItem.findMany({
        where: {
          title: {
            contains: term,
            mode: 'insensitive'
          },
          status: 'READY'
        },
        select: {
          title: true,
          chunks: {
            select: { id: true }
          }
        }
      });

      if (titleMatches.length > 0) {
        console.log(`   ✅ Found ${titleMatches.length} title matches:`);
        titleMatches.forEach(item => {
          console.log(`      - "${item.title}" (${item.chunks.length} chunks)`);
        });
      }

      // Check content matches
      const contentMatches = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: term,
            mode: 'insensitive'
          }
        },
        include: {
          knowledgeItem: {
            select: { title: true }
          }
        },
        take: 3
      });

      if (contentMatches.length > 0) {
        console.log(`   📄 Found ${contentMatches.length} content matches:`);
        contentMatches.forEach((chunk, index) => {
          const preview = chunk.content.substring(0, 100).replace(/\s+/g, ' ');
          console.log(`      ${index + 1}. "${chunk.knowledgeItem.title}": ${preview}...`);
        });
      }

      if (titleMatches.length === 0 && contentMatches.length === 0) {
        console.log('   ❌ No matches found');
      }
      console.log('');
    }

    // 3. Check the exact guides we know exist
    console.log('🎯 Verifying Known Upper/Lower Guides:\n');
    
    const knownGuides = [
      'A Guide to Structuring an Effective Upper Body Workout',
      'A Guide to Structuring an Effective Lower Body Workout: An Exercise Recipe'
    ];

    for (const guide of knownGuides) {
      console.log(`📖 Checking: "${guide}"`);
      
      const item = await prisma.knowledgeItem.findFirst({
        where: {
          title: guide,
          status: 'READY'
        },
        include: {
          chunks: {
            take: 3,
            orderBy: { chunkIndex: 'asc' }
          }
        }
      });

      if (item) {
        console.log(`   ✅ EXISTS: ${item.chunks.length} chunks, Status: ${item.status}`);
        console.log(`   📄 Sample content from first chunk:`);
        if (item.chunks[0]) {
          const preview = item.chunks[0].content.substring(0, 200).replace(/\s+/g, ' ');
          console.log(`      "${preview}..."`);
        }
      } else {
        console.log('   ❌ NOT FOUND OR NOT READY');
      }
      console.log('');
    }

    // 4. Test what the vector search might be finding
    console.log('🔬 Testing Vector Search for AI Query:\n');
    
    const testQuery = 'upper body workout structure exercises rep ranges';
    console.log(`Query: "${testQuery}"`);
    
    const searchResults = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'upper body', mode: 'insensitive' } },
          { content: { contains: 'workout structure', mode: 'insensitive' } },
          { content: { contains: 'exercises', mode: 'insensitive' } },
          { content: { contains: 'rep ranges', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 5
    });

    console.log(`Found ${searchResults.length} potentially relevant chunks:`);
    searchResults.forEach((chunk, index) => {
      const preview = chunk.content.substring(0, 120).replace(/\s+/g, ' ');
      console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}"`);
      console.log(`      Content: "${preview}..."`);
    });

    console.log('\n💡 DIAGNOSIS:\n');
    
    if (knownGuides.every(guide => {
      // Check if guide exists in a simplified search
      return searchResults.some(chunk => 
        chunk.knowledgeItem.title.toLowerCase().includes('upper body') ||
        chunk.knowledgeItem.title.toLowerCase().includes('lower body')
      );
    })) {
      console.log('✅ Upper/Lower guides are available and searchable');
      console.log('🚨 ISSUE: The AI search/retrieval function may not be working properly');
      console.log('🔧 SOLUTION: Check the vector search function or embeddings');
    } else {
      console.log('❌ Upper/Lower guides may not be properly indexed or accessible');
      console.log('🔧 SOLUTION: Check knowledge item status and chunking');
    }

  } catch (error) {
    console.error('❌ Error debugging AI search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAISearch();
