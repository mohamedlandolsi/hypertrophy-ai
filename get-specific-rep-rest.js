const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSpecificRepAndRestContent() {
  try {
    console.log('🔍 Getting specific rep ranges and rest periods content...\n');
    
    // Get the rep range content from strength/hypertrophy guide
    const repRangeChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        AND: [
          { content: { contains: 'Repetition Range', mode: 'insensitive' } },
          { content: { contains: 'For Strength', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });
    
    if (repRangeChunk) {
      console.log('📊 REP RANGES CONTENT:');
      console.log(`Source: ${repRangeChunk.knowledgeItem.title}`);
      console.log(`Content:\n${repRangeChunk.content}\n`);
      console.log('=' * 80);
    }
    
    // Get the rest periods content
    const restPeriodsChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        AND: [
          { content: { contains: 'General Timeframe', mode: 'insensitive' } },
          { content: { contains: '2 and 5 minutes', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });
    
    if (restPeriodsChunk) {
      console.log('\n🕐 REST PERIODS CONTENT:');
      console.log(`Source: ${restPeriodsChunk.knowledgeItem.title}`);
      console.log(`Content:\n${restPeriodsChunk.content}\n`);
      console.log('=' * 80);
    }
    
    // Search for hypertrophy-specific rep ranges
    const hypertrophyRepChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        AND: [
          { content: { contains: 'For Hypertrophy', mode: 'insensitive' } },
          { content: { contains: 'rep', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });
    
    if (hypertrophyRepChunk) {
      console.log('\n💪 HYPERTROPHY REP RANGES:');
      console.log(`Source: ${hypertrophyRepChunk.knowledgeItem.title}`);
      console.log(`Content:\n${hypertrophyRepChunk.content}\n`);
    }
    
    // Search for any chunk with specific rep numbers
    const specificRepChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        OR: [
          { content: { contains: '6-12', mode: 'insensitive' } },
          { content: { contains: '8-15', mode: 'insensitive' } },
          { content: { contains: '10-15', mode: 'insensitive' } },
          { content: { contains: '12-20', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });
    
    if (specificRepChunk) {
      console.log('\n🎯 SPECIFIC REP NUMBERS:');
      console.log(`Source: ${specificRepChunk.knowledgeItem.title}`);
      console.log(`Content:\n${specificRepChunk.content}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error getting content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSpecificRepAndRestContent();
