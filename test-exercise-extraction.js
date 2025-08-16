/**
 * Test Exercise Extraction from Knowledge Base Content
 * This will help us understand why the AI claims no leg exercises exist
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Copy the patterns and logic from gemini.ts
const EXERCISE_PATTERNS = [
  /\b(?:squat|deadlift|chest press|row|pull-up|push-up|lunge|curl|press|extension|fly|raise|hip|thrust|adduction|abduction|pushdown|machine)\b/gi,
  /\b(?:barbell|dumbbell|cable|machine|bodyweight)\s+\w+/gi,
  /\b\w+\s+(?:squat|deadlift|chest press|row|curl|extension|fly|raise)\b/gi,
];

const commonExercises = [
  "hack squat",
  "pendulum squat", 
  "leg press",
  "smith machine squat",
  "hip thrust",
  "leg extension",
  "leg curl",
  "seated leg curl",
  "standing calf raises",
  "hip adduction machine",
  "hip abduction machine",
  "stiff leg deadlift",
  "hyperextension",
  "kickback",
  // ... (truncated for brevity)
];

function analyzeKnowledgeBaseExercises(knowledgeContext) {
  if (knowledgeContext.length === 0) {
    return "No exercise information currently available in knowledge base.";
  }

  const muscleGroups = {
    chest: ["chest", "pec", "bench"],
    back: ["back", "lat", "row", "pull"],
    legs: ["leg", "squat", "deadlift", "quad", "hamstring", "glute", "calf"],
    shoulders: ["shoulder", "delt", "press", "raise"],
    arms: ["arm", "bicep", "tricep", "curl", "extension"],
    core: ["core", "abs", "abdominal", "plank"],
  };

  const availableExercisesByGroup = {};

  // Initialize all muscle groups
  Object.keys(muscleGroups).forEach((group) => {
    availableExercisesByGroup[group] = new Set();
  });

  // Extract exercises from KB and categorize by muscle group
  for (const chunk of knowledgeContext) {
    const chunkText = (chunk.content + " " + chunk.title).toLowerCase();

    console.log(`\n🔍 Analyzing Chunk: "${chunk.title}"`);
    console.log(`📄 Content preview: ${chunk.content.substring(0, 200)}...`);

    // First, extract exercises using patterns
    const foundExercises = new Set();
    for (const pattern of EXERCISE_PATTERNS) {
      const matches = chunk.content.match(pattern);
      if (matches) {
        matches.forEach((match) =>
          foundExercises.add(match.toLowerCase().trim())
        );
      }
    }

    console.log(`🎯 Pattern matches found: ${Array.from(foundExercises).join(', ') || 'None'}`);

    // Also look for common exercise names directly in text
    commonExercises.forEach((exercise) => {
      if (chunkText.includes(exercise)) {
        foundExercises.add(exercise);
        console.log(`✅ Found common exercise: ${exercise}`);
      }
    });

    console.log(`📋 Total exercises found in chunk: ${foundExercises.size}`);
    console.log(`🏋️ Exercises: ${Array.from(foundExercises).join(', ') || 'None'}`);

    // Categorize each found exercise by muscle group
    foundExercises.forEach((exerciseName) => {
      for (const [group, keywords] of Object.entries(muscleGroups)) {
        if (
          keywords.some(
            (keyword) =>
              exerciseName.includes(keyword) ||
              chunkText.includes(keyword + " ") // More precise matching
          )
        ) {
          availableExercisesByGroup[group].add(exerciseName);
          console.log(`🎯 Categorized "${exerciseName}" as ${group.toUpperCase()}`);
        }
      }
    });
  }

  // Build summary for the AI
  console.log('\n📊 FINAL EXERCISE ANALYSIS:');
  console.log('='.repeat(50));

  Object.entries(availableExercisesByGroup).forEach(([group, exercises]) => {
    const exerciseList = Array.from(exercises);
    if (exerciseList.length > 0) {
      console.log(`\n${group.toUpperCase()}: ${exerciseList.length} exercises available`);
      console.log(`Examples: ${exerciseList.slice(0, 5).join(', ')}${exerciseList.length > 5 ? ', and more...' : ''}`);
      console.log(`Full list: ${exerciseList.join(', ')}`);
    } else {
      console.log(`\n${group.toUpperCase()}: ❌ No specific exercises found`);
    }
  });

  return availableExercisesByGroup;
}

async function testExerciseExtraction() {
  try {
    console.log('🧪 Testing Exercise Extraction Logic...\n');

    // Get leg-related chunks
    const legChunks = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'leg', mode: 'insensitive' } },
          { content: { contains: 'squat', mode: 'insensitive' } },
          { content: { contains: 'quadriceps', mode: 'insensitive' } },
          { content: { contains: 'hamstring', mode: 'insensitive' } },
          { content: { contains: 'glute', mode: 'insensitive' } },
          { 
            knowledgeItem: { 
              title: { contains: 'Lower Body', mode: 'insensitive' } 
            } 
          },
          { 
            knowledgeItem: { 
              title: { contains: 'Quadriceps', mode: 'insensitive' } 
            } 
          }
        ]
      },
      include: {
        knowledgeItem: {
          select: { title: true }
        }
      },
      take: 10
    });

    console.log(`📚 Found ${legChunks.length} leg-related chunks\n`);

    if (legChunks.length === 0) {
      console.log('❌ No leg-related chunks found in database!');
      return;
    }

    // Format chunks like the RAG system does
    const formattedChunks = legChunks.map(chunk => ({
      title: chunk.knowledgeItem.title,
      content: chunk.content,
      score: 0.7 // Mock score
    }));

    // Test the exercise extraction
    const exercisesByGroup = analyzeKnowledgeBaseExercises(formattedChunks);

    // Test specific exercises in chunks
    console.log('\n🔍 DIRECT EXERCISE SEARCH IN CHUNKS:');
    console.log('='.repeat(50));

    const testExercises = ['leg press', 'squat', 'leg extension', 'leg curl', 'hack squat'];
    
    testExercises.forEach(exercise => {
      console.log(`\n🔍 Searching for "${exercise}":`);
      formattedChunks.forEach((chunk, i) => {
        if (chunk.content.toLowerCase().includes(exercise)) {
          console.log(`  ✅ Found in chunk ${i + 1}: "${chunk.title}"`);
          const lines = chunk.content.split('\n');
          const relevantLines = lines.filter(line => 
            line.toLowerCase().includes(exercise)
          );
          relevantLines.forEach(line => {
            console.log(`     📄 "${line.trim()}"`);
          });
        }
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExerciseExtraction();
