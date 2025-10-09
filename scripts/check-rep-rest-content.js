const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRepRangesAndRestPeriods() {
  try {
    console.log('🔍 Searching for rep ranges and rest periods in knowledge base...\n');
    
    // Search for rep range related content
    const repContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'rep', mode: 'insensitive' } },
          { content: { contains: 'repetition', mode: 'insensitive' } },
          { content: { contains: '6-8', mode: 'insensitive' } },
          { content: { contains: '8-12', mode: 'insensitive' } },
          { content: { contains: '12-15', mode: 'insensitive' } },
          { content: { contains: '15-20', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });
    
    console.log(`📊 Found ${repContent.length} chunks with rep-related content:`);
    repContent.forEach((chunk, i) => {
      console.log(`\n${i + 1}. Source: ${chunk.knowledgeItem.title}`);
      console.log(`   Content preview: ${chunk.content.substring(0, 200)}...`);
    });
    
    // Search for rest period related content
    const restContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'rest', mode: 'insensitive' } },
          { content: { contains: 'seconds', mode: 'insensitive' } },
          { content: { contains: 'minutes', mode: 'insensitive' } },
          { content: { contains: '60', mode: 'insensitive' } },
          { content: { contains: '90', mode: 'insensitive' } },
          { content: { contains: '120', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });
    
    console.log(`\n\n🕐 Found ${restContent.length} chunks with rest-related content:`);
    restContent.forEach((chunk, i) => {
      console.log(`\n${i + 1}. Source: ${chunk.knowledgeItem.title}`);
      console.log(`   Content preview: ${chunk.content.substring(0, 200)}...`);
    });
    
    // Search for training methodology content
    const methodologyContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'training', mode: 'insensitive' } },
          { content: { contains: 'hypertrophy', mode: 'insensitive' } },
          { content: { contains: 'muscle growth', mode: 'insensitive' } },
          { content: { contains: 'intensity', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 5
    });
    
    console.log(`\n\n💪 Found ${methodologyContent.length} chunks with methodology content:`);
    methodologyContent.forEach((chunk, i) => {
      console.log(`\n${i + 1}. Source: ${chunk.knowledgeItem.title}`);
      console.log(`   Content preview: ${chunk.content.substring(0, 150)}...`);
    });
    
    // Check total knowledge items
    const totalItems = await prisma.knowledgeItem.count();
    const totalChunks = await prisma.knowledgeChunk.count();
    
    console.log(`\n\n📈 Knowledge Base Summary:`);
    console.log(`- Total Items: ${totalItems}`);
    console.log(`- Total Chunks: ${totalChunks}`);
    
  } catch (error) {
    console.error('❌ Error checking content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRepRangesAndRestPeriods();
