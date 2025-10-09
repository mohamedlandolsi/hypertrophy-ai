const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSpecificExercises() {
  console.log('🏋️ Searching for Specific Exercise Names in Knowledge Base...\n');
  
  try {
    // Search for specific exercise names
    const exerciseTerms = [
      'bench press', 'squat', 'deadlift', 'overhead press', 'row',
      'curl', 'extension', 'pulldown', 'pullup', 'pull-up', 'dip',
      'lateral raise', 'face pull', 'hip thrust', 'leg press',
      'calf raise', 'lunge', 'push-up', 'chin-up', 'shrug'
    ];

    console.log('🔍 Searching for these exercise terms:', exerciseTerms.join(', '), '\n');

    for (const term of exerciseTerms.slice(0, 8)) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          knowledgeItem: { status: 'READY' },
          content: { contains: term, mode: 'insensitive' }
        },
        include: {
          knowledgeItem: { select: { title: true } }
        },
        take: 3
      });

      if (chunks.length > 0) {
        console.log(`✅ Found "${term}" in ${chunks.length} chunks:`);
        chunks.forEach(chunk => {
          const context = chunk.content.toLowerCase();
          const termIndex = context.indexOf(term.toLowerCase());
          const start = Math.max(0, termIndex - 50);
          const end = Math.min(context.length, termIndex + term.length + 50);
          const excerpt = chunk.content.substring(start, end);
          console.log(`   - ${chunk.knowledgeItem.title}: "...${excerpt}..."`);
        });
        console.log('');
      } else {
        console.log(`❌ No content found for "${term}"`);
      }
    }

    // Check for exercise guide documents
    const exerciseGuides = await prisma.knowledgeItem.findMany({
      where: {
        status: 'READY',
        OR: [
          { title: { contains: 'exercise', mode: 'insensitive' } },
          { title: { contains: 'guide', mode: 'insensitive' } },
          { title: { contains: 'training', mode: 'insensitive' } },
          { title: { contains: 'workout', mode: 'insensitive' } }
        ]
      },
      include: {
        chunks: {
          where: { embeddingData: { not: null } },
          take: 2
        }
      }
    });

    console.log(`\n📚 Found ${exerciseGuides.length} potential exercise guide documents:`);
    exerciseGuides.forEach((guide, index) => {
      console.log(`${index + 1}. "${guide.title}" (${guide.chunks.length} chunks)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findSpecificExercises();
