const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function examineSpecificUpperLowerContent() {
  console.log('🔍 Examining Specific Upper/Lower Content');
  console.log('=========================================\n');

  try {
    // 1. Get the most relevant upper/lower guides
    const relevantGuides = [
      'A Guide to Common Training Splits',
      'A Guide to Rating Workout Splits for Muscle Growth', 
      'A Guide to Effective Split Programming',
      'A Guide to Structuring an Effective Upper Body Workout',
      'A Guide to Structuring an Effective Lower Body Workout: An Exercise Recipe'
    ];

    for (const guideTitle of relevantGuides) {
      console.log(`📖 Examining: "${guideTitle}"`);
      console.log('─'.repeat(60));
      
      const guide = await prisma.knowledgeItem.findFirst({
        where: {
          title: guideTitle
        },
        include: {
          chunks: {
            orderBy: { chunkIndex: 'asc' }
          }
        }
      });

      if (guide) {
        console.log(`   Status: ${guide.status}, Chunks: ${guide.chunks.length}`);
        console.log(`   Type: ${guide.type}, Created: ${guide.createdAt.toDateString()}\n`);
        
        // Show first few chunks to see the content structure
        guide.chunks.slice(0, 3).forEach((chunk, index) => {
          console.log(`   📄 Chunk ${chunk.chunkIndex + 1}:`);
          console.log(`      "${chunk.content.substring(0, 200)}..."\n`);
        });
        
        // Look for chunks containing upper/lower specific terms
        const upperLowerChunks = guide.chunks.filter(chunk => 
          chunk.content.toLowerCase().includes('upper') || 
          chunk.content.toLowerCase().includes('lower')
        );
        
        if (upperLowerChunks.length > 0) {
          console.log(`   🎯 Upper/Lower specific chunks (${upperLowerChunks.length}):`);
          upperLowerChunks.forEach((chunk, index) => {
            const preview = chunk.content.substring(0, 150).replace(/\s+/g, ' ');
            console.log(`      ${index + 1}. Chunk ${chunk.chunkIndex}: "${preview}..."`);
          });
        }
        
      } else {
        console.log('   ❌ Guide not found in database');
      }
      console.log('\n' + '='.repeat(80) + '\n');
    }

    // 2. Check if we have any sample workouts or specific programs
    console.log('🏋️ Searching for sample workouts and specific programs...\n');
    
    const sampleContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'sample', mode: 'insensitive' } },
          { content: { contains: 'example', mode: 'insensitive' } },
          { content: { contains: 'workout a', mode: 'insensitive' } },
          { content: { contains: 'workout b', mode: 'insensitive' } },
          { content: { contains: 'day 1', mode: 'insensitive' } },
          { content: { contains: 'day 2', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });

    console.log(`📋 Found ${sampleContent.length} chunks with sample/example content:`);
    sampleContent.forEach((chunk, index) => {
      const preview = chunk.content.substring(0, 120).replace(/\s+/g, ' ');
      console.log(`   ${index + 1}. "${chunk.knowledgeItem.title}"`);
      console.log(`      "${preview}..."\n`);
    });

    // 3. Check current tool enforcement setting
    console.log('⚙️ Checking Tool Enforcement Mode...\n');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (config) {
      console.log(`🔧 Tool Enforcement Mode: ${config.toolEnforcementMode}`);
      console.log(`   - STRICT: AI will only use highly relevant, explicit content`);
      console.log(`   - AUTO: AI can synthesize and connect related information\n`);
      
      if (config.toolEnforcementMode === 'STRICT') {
        console.log('🚨 POTENTIAL ISSUE: STRICT mode may be preventing AI from synthesizing');
        console.log('   available upper/lower information into complete programs.\n');
        
        console.log('💡 RECOMMENDATION: Consider switching to AUTO mode to allow AI to');
        console.log('   combine multiple chunks into comprehensive program guidance.\n');
      }
    }

    // 4. Final assessment
    console.log('📊 CONTENT ASSESSMENT:\n');
    console.log('✅ Available Content:');
    console.log('   - Upper/lower split theory and benefits');
    console.log('   - General scheduling patterns (4x/week, 5x/week, cyclic)');
    console.log('   - Volume guidelines (sets per muscle group)');
    console.log('   - Upper body workout structure guide');
    console.log('   - Lower body workout structure guide\n');
    
    console.log('❌ Missing Content (causing AI to say "insufficient"):');
    console.log('   - Complete upper/lower program examples');
    console.log('   - Specific exercise selection for upper/lower days');
    console.log('   - Detailed rep ranges for upper/lower splits');
    console.log('   - Specific rest periods for upper/lower programming\n');
    
    console.log('🎯 SOLUTIONS:');
    console.log('   1. Change tool enforcement from STRICT to AUTO');
    console.log('   2. Add specific upper/lower program examples to KB');
    console.log('   3. Update system prompt to encourage synthesis of available info');
    console.log('   4. Create dedicated upper/lower program template guides\n');

  } catch (error) {
    console.error('❌ Error examining content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the examination
examineSpecificUpperLowerContent();
