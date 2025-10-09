const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deepAnalyzeUpperLowerContent() {
  console.log('🔍 Deep Analysis: Upper/Lower Program Content in Knowledge Base');
  console.log('===============================================================\n');

  try {
    // 1. Search for all chunks containing specific upper/lower program terms
    console.log('📋 1. Searching for specific upper/lower program content...\n');

    const searchTerms = [
      'upper lower',
      'upper/lower', 
      'upper body',
      'lower body',
      'upper lower split',
      'upper lower program',
      'upper lower routine',
      'upper day',
      'lower day'
    ];

    for (const term of searchTerms) {
      console.log(`🔍 Searching for "${term}":`);
      
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: term,
            mode: 'insensitive'
          }
        },
        include: {
          knowledgeItem: {
            select: { title: true, type: true }
          }
        },
        take: 5
      });

      if (chunks.length > 0) {
        console.log(`   ✅ Found ${chunks.length} chunks`);
        chunks.forEach((chunk, index) => {
          const preview = chunk.content.substring(0, 150).replace(/\s+/g, ' ');
          console.log(`      ${index + 1}. "${chunk.knowledgeItem.title}"`);
          console.log(`         Content: "${preview}..."`);
        });
      } else {
        console.log('   ❌ No chunks found');
      }
      console.log('');
    }

    // 2. Look for knowledge items with titles containing upper/lower
    console.log('📚 2. Knowledge items with upper/lower in titles...\n');
    
    const upperLowerItems = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'upper', mode: 'insensitive' } },
          { title: { contains: 'lower', mode: 'insensitive' } },
          { title: { contains: 'split', mode: 'insensitive' } }
        ]
      },
      include: {
        chunks: {
          select: { id: true, content: true },
          take: 3
        }
      }
    });

    console.log(`📖 Found ${upperLowerItems.length} knowledge items with relevant titles:`);
    upperLowerItems.forEach((item, index) => {
      console.log(`\n   ${index + 1}. "${item.title}" (${item.chunks.length} chunks)`);
      console.log(`      Type: ${item.type}, Status: ${item.status}`);
      
      if (item.chunks.length > 0) {
        item.chunks.forEach((chunk, chunkIndex) => {
          const preview = chunk.content.substring(0, 100).replace(/\s+/g, ' ');
          console.log(`         Chunk ${chunkIndex + 1}: "${preview}..."`);
        });
      }
    });

    // 3. Search for program/routine examples specifically
    console.log('\n📋 3. Searching for program examples and routines...\n');
    
    const programTerms = [
      'program',
      'routine',
      'example',
      'sample',
      'workout',
      'template',
      'schedule'
    ];

    for (const term of programTerms) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          AND: [
            { content: { contains: term, mode: 'insensitive' } },
            {
              OR: [
                { content: { contains: 'upper', mode: 'insensitive' } },
                { content: { contains: 'lower', mode: 'insensitive' } }
              ]
            }
          ]
        },
        include: {
          knowledgeItem: {
            select: { title: true }
          }
        },
        take: 3
      });

      if (chunks.length > 0) {
        console.log(`🎯 "${term}" + upper/lower content: ${chunks.length} chunks found`);
        chunks.forEach((chunk, index) => {
          const preview = chunk.content.substring(0, 120).replace(/\s+/g, ' ');
          console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}": "${preview}..."`);
        });
        console.log('');
      }
    }

    // 4. Check for specific exercise recommendations
    console.log('💪 4. Searching for specific exercise recommendations...\n');
    
    const exerciseKeywords = [
      'bench press',
      'squat',
      'deadlift',
      'row',
      'pull up',
      'overhead press',
      'leg press',
      'curl',
      'extension'
    ];

    let exerciseCount = 0;
    for (const exercise of exerciseKeywords.slice(0, 5)) { // Check first 5
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: exercise,
            mode: 'insensitive'
          }
        },
        take: 1
      });
      
      if (chunks.length > 0) {
        exerciseCount++;
      }
    }

    console.log(`💪 Found exercise content for ${exerciseCount}/${exerciseKeywords.slice(0, 5).length} sample exercises`);

    // 5. Check current AI configuration again
    console.log('\n⚙️ 5. Current AI Configuration Check...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (config) {
      console.log('📊 Current RAG Settings:');
      console.log(`   - Similarity Threshold: ${config.ragSimilarityThreshold}`);
      console.log(`   - Max Chunks: ${config.ragMaxChunks}`);
      console.log(`   - High Relevance Threshold: ${config.ragHighRelevanceThreshold}`);
      console.log(`   - Use Knowledge Base: ${config.useKnowledgeBase}`);
      console.log(`   - Tool Enforcement: ${config.toolEnforcementMode}\n`);
    }

    // 6. Recommendations
    console.log('💡 Analysis Summary & Recommendations:\n');
    
    console.log('🔧 If content exists but AI still says "insufficient information":');
    console.log('   1. The embeddings might not be capturing the relationships properly');
    console.log('   2. The system prompt might be too strict in evaluation');
    console.log('   3. The retrieval function might not be finding the right chunks');
    console.log('   4. Consider re-processing key upper/lower guides with better chunking\n');

    console.log('🎯 Next Steps:');
    console.log('   1. If rich content found → Check embedding quality and retrieval logic');
    console.log('   2. If sparse content → Need to add more specific upper/lower programs');
    console.log('   3. Test with manual embedding generation for "upper lower program"');
    console.log('   4. Adjust system prompt to be more permissive with available content');

  } catch (error) {
    console.error('❌ Error in deep analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deep analysis
deepAnalyzeUpperLowerContent();
