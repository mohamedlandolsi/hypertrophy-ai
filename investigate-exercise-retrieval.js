const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateExerciseRetrieval() {
  try {
    console.log('🔍 Investigating exercise retrieval issue...\n');
    
    // Check for exercise content in knowledge base
    console.log('📋 Searching for exercise content...');
    
    const exerciseKeywords = [
      'chest press', 'bench press', 'incline', 'decline',
      'lat pulldown', 'row', 'pull up', 'pulldown',
      'squat', 'leg press', 'leg extension', 'leg curl',
      'shoulder press', 'lateral raise', 'overhead press',
      'bicep curl', 'tricep', 'triceps', 'extension',
      'deadlift', 'hip thrust', 'calf raise',
      'machine', 'dumbbell', 'barbell', 'cable'
    ];
    
    // Search for chunks containing exercise names
    const exerciseChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: exerciseKeywords.map(keyword => ({
          content: { contains: keyword, mode: 'insensitive' }
        }))
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 20
    });
    
    console.log(`\n📊 Found ${exerciseChunks.length} chunks with exercise content:`);
    
    // Group by source and show examples
    const sourceMap = new Map();
    exerciseChunks.forEach(chunk => {
      const title = chunk.knowledgeItem.title;
      if (!sourceMap.has(title)) {
        sourceMap.set(title, []);
      }
      sourceMap.get(title).push(chunk);
    });
    
    Array.from(sourceMap.entries()).slice(0, 10).forEach(([title, chunks], i) => {
      console.log(`\n${i + 1}. ${title} (${chunks.length} chunks)`);
      
      // Show first chunk content as example
      const firstChunk = chunks[0];
      console.log(`   Example: ${firstChunk.content.substring(0, 150)}...`);
      
      // Check for specific exercise names in this chunk
      const foundExercises = exerciseKeywords.filter(keyword => 
        firstChunk.content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (foundExercises.length > 0) {
        console.log(`   Contains: ${foundExercises.slice(0, 5).join(', ')}`);
      }
    });
    
    // Now check what happens with a program query
    console.log('\n\n🎯 Testing program query simulation...');
    
    const programQuery = 'upper lower program';
    const programChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'upper', mode: 'insensitive' } },
          { content: { contains: 'lower', mode: 'insensitive' } },
          { content: { contains: 'program', mode: 'insensitive' } },
          { content: { contains: 'split', mode: 'insensitive' } },
          { content: { contains: 'workout', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 10
    });
    
    console.log(`\n📋 Program query would find ${programChunks.length} chunks:`);
    programChunks.slice(0, 5).forEach((chunk, i) => {
      console.log(`\n${i + 1}. ${chunk.knowledgeItem.title}`);
      console.log(`   Content: ${chunk.content.substring(0, 120)}...`);
      
      // Check if this chunk contains specific exercises
      const hasExercises = exerciseKeywords.some(keyword => 
        chunk.content.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log(`   Contains exercises: ${hasExercises ? '✅ YES' : '❌ NO'}`);
    });
    
    // Check overlap between exercise content and program content
    const exerciseSources = new Set(exerciseChunks.map(c => c.knowledgeItem.title));
    const programSources = new Set(programChunks.map(c => c.knowledgeItem.title));
    
    const overlap = [...exerciseSources].filter(title => programSources.has(title));
    
    console.log(`\n\n🔄 Content Analysis:`);
    console.log(`- Sources with exercises: ${exerciseSources.size}`);
    console.log(`- Sources with program content: ${programSources.size}`);
    console.log(`- Overlapping sources: ${overlap.length}`);
    
    if (overlap.length > 0) {
      console.log('\n📚 Sources with BOTH exercises AND program content:');
      overlap.forEach(title => console.log(`   - ${title}`));
    }
    
    // Check if there are dedicated exercise guides
    const exerciseGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'exercise', mode: 'insensitive' } },
          { title: { contains: 'movement', mode: 'insensitive' } },
          { title: { contains: 'chest', mode: 'insensitive' } },
          { title: { contains: 'back', mode: 'insensitive' } },
          { title: { contains: 'leg', mode: 'insensitive' } },
          { title: { contains: 'shoulder', mode: 'insensitive' } },
          { title: { contains: 'bicep', mode: 'insensitive' } },
          { title: { contains: 'tricep', mode: 'insensitive' } }
        ]
      },
      select: { title: true, id: true }
    });
    
    console.log(`\n\n💪 Exercise-specific guides in knowledge base:`);
    exerciseGuides.forEach((guide, i) => {
      console.log(`${i + 1}. ${guide.title}`);
    });
    
    if (exerciseGuides.length === 0) {
      console.log('❌ NO exercise-specific guides found!');
      console.log('💡 This might explain why the AI says there are no exercises.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateExerciseRetrieval();
