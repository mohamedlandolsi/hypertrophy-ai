const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgrammingChunkDetails() {
  try {
    console.log('🔍 Examining Programming Chunk Content in Detail...\n');
    
    // Find the hypertrophy programming chunk
    const hypertrophyChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        content: {
          contains: "Repetition Range"
        }
      },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    if (hypertrophyChunk) {
      console.log('📊 Hypertrophy Programming Chunk:');
      console.log(`Title: ${hypertrophyChunk.knowledgeItem.title}`);
      console.log(`Content:\n${hypertrophyChunk.content}\n`);
    }
    
    // Find the rest periods chunk
    const restChunk = await prisma.knowledgeChunk.findFirst({
      where: {
        content: {
          contains: "rest periods"
        }
      },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    if (restChunk) {
      console.log('⏱️ Rest Periods Chunk:');
      console.log(`Title: ${restChunk.knowledgeItem.title}`);
      console.log(`Content:\n${restChunk.content}\n`);
    }
    
    // Check for any chunks with specific hypertrophy rep ranges
    const repRangeChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: "6-10" } },
          { content: { contains: "5-10" } },
          { content: { contains: "8-12" } },
          { content: { contains: "hypertrophy" } }
        ]
      },
      include: { knowledgeItem: { select: { title: true } } }
    });
    
    console.log(`\n🎯 Found ${repRangeChunks.length} chunks with hypertrophy rep ranges:`);
    repRangeChunks.forEach((chunk, i) => {
      console.log(`\n${i + 1}. ${chunk.knowledgeItem.title}`);
      console.log(`Content: ${chunk.content.substring(0, 200)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgrammingChunkDetails();
