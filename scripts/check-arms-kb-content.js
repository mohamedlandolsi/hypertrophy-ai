const { PrismaClient } = require('@prisma/client');

async function checkArmsKnowledgeContent() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Arms Knowledge Base Content...\n');
    
    // Find the arms training documents
    const armsGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'Arm Training', mode: 'insensitive' } },
          { title: { contains: 'Elbow Flexors', mode: 'insensitive' } },
          { title: { contains: 'Forearm Training', mode: 'insensitive' } }
        ],
        status: 'READY'
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });
    
    console.log(`📚 Found ${armsGuides.length} arms training guides:\n`);
    
    armsGuides.forEach((guide, i) => {
      console.log(`${i + 1}. "${guide.title}"`);
      console.log(`   📊 ${guide.chunks.length} chunks`);
      
      // Show the content of first few chunks to see what specific guidance is available
      guide.chunks.slice(0, 3).forEach((chunk, j) => {
        console.log(`   Chunk ${j + 1}: ${chunk.content.substring(0, 200)}...`);
      });
      console.log('');
    });
    
    // Check for specific programming information in arms content
    console.log('🎯 Checking for Specific Programming Information...\n');
    
    const armsChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: {
          OR: [
            { title: { contains: 'Arm Training', mode: 'insensitive' } },
            { title: { contains: 'Elbow Flexors', mode: 'insensitive' } },
            { title: { contains: 'Forearm Training', mode: 'insensitive' } }
          ],
          status: 'READY'
        }
      },
      include: { knowledgeItem: true }
    });
    
    console.log(`📊 Analyzing ${armsChunks.length} arms-related chunks for programming info...\n`);
    
    let hasRepRanges = false;
    let hasSetGuidance = false;
    let hasRestPeriods = false;
    let hasExerciseSelection = false;
    let hasFrequency = false;
    
    armsChunks.forEach((chunk, i) => {
      const content = chunk.content.toLowerCase();
      
      if (content.includes('rep') && (content.includes('range') || content.includes('10') || content.includes('15'))) {
        hasRepRanges = true;
        console.log(`✅ Rep ranges found in "${chunk.knowledgeItem.title}": ${chunk.content.substring(0, 150)}...`);
      }
      
      if (content.includes('set') && (content.includes('3') || content.includes('4') || content.includes('volume'))) {
        hasSetGuidance = true;
        console.log(`✅ Set guidance found in "${chunk.knowledgeItem.title}": ${chunk.content.substring(0, 150)}...`);
      }
      
      if (content.includes('rest') || content.includes('minute')) {
        hasRestPeriods = true;
        console.log(`✅ Rest periods found in "${chunk.knowledgeItem.title}": ${chunk.content.substring(0, 150)}...`);
      }
      
      if (content.includes('curl') || content.includes('extension') || content.includes('press')) {
        hasExerciseSelection = true;
        console.log(`✅ Exercise selection found in "${chunk.knowledgeItem.title}": ${chunk.content.substring(0, 150)}...`);
      }
      
      if (content.includes('frequency') || content.includes('day') || content.includes('week')) {
        hasFrequency = true;
        console.log(`✅ Frequency guidance found in "${chunk.knowledgeItem.title}": ${chunk.content.substring(0, 150)}...`);
      }
    });
    
    console.log('\n📋 Arms Knowledge Base Assessment:');
    console.log(`  Rep ranges: ${hasRepRanges ? '✅' : '❌'}`);
    console.log(`  Set guidance: ${hasSetGuidance ? '✅' : '❌'}`);
    console.log(`  Rest periods: ${hasRestPeriods ? '✅' : '❌'}`);
    console.log(`  Exercise selection: ${hasExerciseSelection ? '✅' : '❌'}`);
    console.log(`  Training frequency: ${hasFrequency ? '✅' : '❌'}`);
    
    if (!hasRepRanges || !hasSetGuidance) {
      console.log('\n⚠️  ISSUE: Arms-specific programming parameters may be limited in KB');
      console.log('   This could explain why AI falls back to generic advice');
    } else {
      console.log('\n✅ Arms KB contains comprehensive programming information');
      console.log('   Issue likely in AI prompt or context processing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkArmsKnowledgeContent();
