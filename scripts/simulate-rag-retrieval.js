const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateRAGRetrieval() {
  try {
    console.log('🔍 Simulating RAG retrieval for upper/lower program...\n');
    
    // Simulate what keywords would be searched for in an upper/lower program request
    const programKeywords = [
      'upper', 'lower', 'program', 'split', 'workout', 'training',
      'chest', 'back', 'shoulders', 'arms', 'legs', 'quads', 'hamstrings'
    ];
    
    console.log('🎯 Searching for program-specific content...');
    
    // Search for chunks that would likely be retrieved for exercise selection
    const exerciseChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: programKeywords.map(keyword => ({
          content: { contains: keyword, mode: 'insensitive' }
        }))
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 10
    });
    
    console.log(`\n📊 Found ${exerciseChunks.length} exercise-related chunks:`);
    exerciseChunks.slice(0, 5).forEach((chunk, i) => {
      console.log(`\n${i + 1}. Source: ${chunk.knowledgeItem.title}`);
      console.log(`   Preview: ${chunk.content.substring(0, 120)}...`);
    });
    
    // Now check if methodology content would be included
    console.log('\n\n🧠 Checking for methodology content...');
    
    const methodologyKeywords = [
      'repetition', 'rep range', 'hypertrophy', 'rest period', 
      'training goals', 'muscle growth', 'intensity'
    ];
    
    const methodologyChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: methodologyKeywords.map(keyword => ({
          content: { contains: keyword, mode: 'insensitive' }
        }))
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 5
    });
    
    console.log(`\n📋 Found ${methodologyChunks.length} methodology chunks:`);
    methodologyChunks.forEach((chunk, i) => {
      console.log(`\n${i + 1}. Source: ${chunk.knowledgeItem.title}`);
      console.log(`   Preview: ${chunk.content.substring(0, 120)}...`);
    });
    
    // Check overlap between exercise and methodology content
    const exerciseTitles = new Set(exerciseChunks.map(c => c.knowledgeItem.title));
    const methodologyTitles = new Set(methodologyChunks.map(c => c.knowledgeItem.title));
    
    const overlap = [...exerciseTitles].filter(title => methodologyTitles.has(title));
    
    console.log(`\n\n🔄 Content Overlap Analysis:`);
    console.log(`- Exercise content sources: ${exerciseTitles.size}`);
    console.log(`- Methodology content sources: ${methodologyTitles.size}`);
    console.log(`- Overlapping sources: ${overlap.length}`);
    
    if (overlap.length > 0) {
      console.log('\n📚 Sources with both exercise and methodology info:');
      overlap.forEach(title => console.log(`   - ${title}`));
    }
    
    // The key insight: check if "program" queries would retrieve methodology
    console.log('\n\n🎯 KEY INSIGHT CHECK:');
    console.log('When user asks for "upper/lower program", would methodology be retrieved?');
    
    const programQuery = await prisma.knowledgeChunk.findMany({
      where: {
        AND: [
          {
            OR: [
              { content: { contains: 'program', mode: 'insensitive' } },
              { content: { contains: 'upper', mode: 'insensitive' } },
              { content: { contains: 'lower', mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { content: { contains: 'rep', mode: 'insensitive' } },
              { content: { contains: 'rest', mode: 'insensitive' } }
            ]
          }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      }
    });
    
    console.log(`\n${programQuery.length > 0 ? '✅' : '❌'} Found ${programQuery.length} chunks with both program AND methodology info`);
    
    if (programQuery.length === 0) {
      console.log('\n🚨 PROBLEM IDENTIFIED:');
      console.log('   - Exercise content is retrieved for program requests');
      console.log('   - Methodology content exists but is in separate chunks');
      console.log('   - Program requests don\'t trigger methodology retrieval');
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('   - Enhance query expansion to include methodology terms');
      console.log('   - Or modify prompt to explicitly request methodology info');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateRAGRetrieval();
