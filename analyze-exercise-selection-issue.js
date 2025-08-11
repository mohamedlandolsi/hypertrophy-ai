const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeExerciseSelectionIssue() {
  console.log('🔍 Analyzing Exercise Selection Issue...\n');
  
  try {
    // Check what exercises are actually in the knowledge base
    const exerciseChunks = await prisma.knowledgeChunk.findMany({
      where: {
        knowledgeItem: { status: 'READY' },
        OR: [
          { content: { contains: 'exercise', mode: 'insensitive' } },
          { content: { contains: 'movement', mode: 'insensitive' } },
          { content: { contains: 'lift', mode: 'insensitive' } },
          { content: { contains: 'press', mode: 'insensitive' } },
          { content: { contains: 'curl', mode: 'insensitive' } },
          { content: { contains: 'squat', mode: 'insensitive' } },
          { content: { contains: 'deadlift', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 10
    });

    console.log(`📊 Found ${exerciseChunks.length} chunks with exercise-related content\n`);

    if (exerciseChunks.length > 0) {
      console.log('📋 Sample exercise content from knowledge base:');
      exerciseChunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`${index + 1}. From "${chunk.knowledgeItem.title}":`);
        console.log(`   ${chunk.content.substring(0, 150)}...\n`);
      });
    }

    // Check current system prompt for exercise selection guidance
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (config) {
      const hasExerciseGuidance = config.systemPrompt.toLowerCase().includes('exercise selection') ||
                                config.systemPrompt.toLowerCase().includes('specific exercises from') ||
                                config.systemPrompt.toLowerCase().includes('only recommend exercises');

      console.log(`🎯 System prompt has exercise selection guidance: ${hasExerciseGuidance ? 'YES' : 'NO'}\n`);
      
      if (!hasExerciseGuidance) {
        console.log('❌ ISSUE IDENTIFIED: System prompt lacks specific guidance for exercise selection from KB');
        console.log('   The AI is defaulting to generic exercise names instead of KB content\n');
      }
    }

    console.log('🔧 SOLUTION NEEDED:');
    console.log('1. Update system prompt to enforce exercise selection from knowledge base');
    console.log('2. Add explicit instruction: "Only recommend exercises that are specifically mentioned in the knowledge base"');
    console.log('3. Require citations for every exercise recommended');
    console.log('4. Add fallback instruction: "If specific exercises not found, state this clearly and ask for more info"\n');

    console.log('📝 Example of what AI should do:');
    console.log('Instead of: "e.g., Barbell Bench Press, Incline Dumbbell Press"');
    console.log('Should say: "Based on the chest training guide [1], recommend: [specific exercises from KB with citations]"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExerciseSelectionIssue();
