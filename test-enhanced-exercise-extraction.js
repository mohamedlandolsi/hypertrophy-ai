/**
 * CRITICAL FIX: Enhanced Exercise Extraction for RAG System
 * This addresses the core issue where AI claims no exercises exist despite KB containing them
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced exercise patterns - more comprehensive and specific
const ENHANCED_EXERCISE_PATTERNS = [
  // Specific compound movements
  /\b(?:squat|hack squat|pendulum squat|leg press|deadlift|romanian deadlift|stiff leg deadlift)\b/gi,
  // Isolation movements  
  /\b(?:leg extension|leg curl|hip thrust|hip adduction|hip abduction|calf raise)\b/gi,
  // Machine exercises
  /\b(?:machine|smith machine)\s+[\w\s]*(?:squat|press|curl|extension|raise|fly|row)\b/gi,
  // Cable/dumbbell/barbell exercises
  /\b(?:cable|dumbbell|barbell)\s+[\w\s]*(?:curl|press|extension|raise|fly|row)\b/gi,
  // Generic patterns (keep existing)
  /\b(?:chest press|shoulder press|lat pulldown|pull-up|push-up|lunge)\b/gi,
];

// Comprehensive exercise database based on KB content
const COMPREHENSIVE_EXERCISE_LIST = [
  // LEG EXERCISES (based on KB analysis)
  "squat", "hack squat", "pendulum squat", "leg press", "smith machine squat",
  "leg extension", "leg curl", "seated leg curl", "lying leg curl",
  "hip thrust", "hip adduction machine", "hip abduction machine",
  "romanian deadlift", "stiff leg deadlift", "hyperextension",
  "standing calf raises", "seated calf raises", "calf press",
  "walking lunges", "bulgarian split squat", "step ups",

  // CHEST EXERCISES
  "bench press", "incline bench press", "decline bench press",
  "machine chest press", "incline machine press", "decline machine press",
  "chest fly", "machine chest fly", "cable fly", "pec deck",
  "dips", "push ups", "incline push ups",

  // BACK EXERCISES  
  "lat pulldown", "wide grip lat pulldown", "close grip lat pulldown",
  "seated cable row", "chest supported row", "t-bar row",
  "pull ups", "chin ups", "assisted pull ups",
  "machine row", "single arm dumbbell row",

  // SHOULDER EXERCISES
  "shoulder press", "machine shoulder press", "dumbbell shoulder press",
  "lateral raises", "machine lateral raises", "cable lateral raises", 
  "rear delt fly", "machine reverse fly", "cable reverse fly",
  "front raises", "upright rows", "face pulls",

  // ARM EXERCISES
  "bicep curl", "hammer curl", "preacher curl", "cable curl",
  "tricep extension", "overhead tricep extension", "tricep pushdown",
  "close grip bench press", "tricep dips", "skull crushers"
];

// Enhanced muscle group classification with more precise keywords
const ENHANCED_MUSCLE_GROUPS = {
  legs: {
    keywords: ["leg", "squat", "deadlift", "quad", "hamstring", "glute", "calf", "hip", "lunge"],
    exercises: COMPREHENSIVE_EXERCISE_LIST.filter(ex => 
      ["squat", "leg", "hip", "calf", "deadlift", "lunge"].some(kw => ex.includes(kw))
    )
  },
  chest: {
    keywords: ["chest", "pec", "bench", "press", "fly", "dip"],
    exercises: COMPREHENSIVE_EXERCISE_LIST.filter(ex => 
      ["bench", "chest", "press", "fly", "pec", "dip"].some(kw => ex.includes(kw)) &&
      !ex.includes("leg") && !ex.includes("shoulder")
    )
  },
  back: {
    keywords: ["back", "lat", "row", "pull"],
    exercises: COMPREHENSIVE_EXERCISE_LIST.filter(ex => 
      ["lat", "row", "pull"].some(kw => ex.includes(kw))
    )
  },
  shoulders: {
    keywords: ["shoulder", "delt", "lateral", "rear", "front", "raise"],
    exercises: COMPREHENSIVE_EXERCISE_LIST.filter(ex => 
      ["shoulder", "lateral", "rear", "front", "raise"].some(kw => ex.includes(kw)) &&
      !ex.includes("calf")
    )
  },
  arms: {
    keywords: ["arm", "bicep", "tricep", "curl", "extension"],
    exercises: COMPREHENSIVE_EXERCISE_LIST.filter(ex => 
      ["bicep", "tricep", "curl"].some(kw => ex.includes(kw)) ||
      (ex.includes("extension") && (ex.includes("tricep") || ex.includes("overhead")))
    )
  }
};

function enhancedExerciseExtraction(knowledgeContext) {
  console.log(`\n🔍 Enhanced Exercise Extraction for ${knowledgeContext.length} chunks\n`);

  if (knowledgeContext.length === 0) {
    return { 
      summary: "No exercise information currently available in knowledge base.",
      exercisesByGroup: {},
      detailedAnalysis: "Empty knowledge base"
    };
  }

  const availableExercisesByGroup = {};
  const detailedFindings = {};

  // Initialize all muscle groups
  Object.keys(ENHANCED_MUSCLE_GROUPS).forEach((group) => {
    availableExercisesByGroup[group] = new Set();
    detailedFindings[group] = { chunks: [], patterns: [], direct: [] };
  });

  // Process each chunk with enhanced extraction
  for (const chunk of knowledgeContext) {
    const chunkText = (chunk.content + " " + chunk.title).toLowerCase();
    
    console.log(`📄 Analyzing: "${chunk.title}"`);
    console.log(`   Score: ${chunk.score?.toFixed(3) || 'N/A'}`);
    console.log(`   Length: ${chunk.content.length} chars`);

    // Method 1: Enhanced pattern matching
    const patternMatches = new Set();
    for (const pattern of ENHANCED_EXERCISE_PATTERNS) {
      const matches = chunk.content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.toLowerCase().trim();
          patternMatches.add(cleaned);
          console.log(`   🎯 Pattern match: "${cleaned}"`);
        });
      }
    }

    // Method 2: Direct exercise name matching (most reliable)
    const directMatches = new Set();
    COMPREHENSIVE_EXERCISE_LIST.forEach(exercise => {
      if (chunkText.includes(exercise.toLowerCase())) {
        directMatches.add(exercise);
        console.log(`   ✅ Direct match: "${exercise}"`);
      }
    });

    // Method 3: Contextual extraction (find exercises mentioned in context)
    const contextualMatches = new Set();
    const sentences = chunk.content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      // Look for exercise-indicating context
      if (sentenceLower.includes('exercise') || sentenceLower.includes('movement') || 
          sentenceLower.includes('perform') || sentenceLower.includes('train')) {
        COMPREHENSIVE_EXERCISE_LIST.forEach(exercise => {
          if (sentenceLower.includes(exercise.toLowerCase())) {
            contextualMatches.add(exercise);
            console.log(`   🎯 Contextual: "${exercise}" in: "${sentence.trim().substring(0, 100)}..."`);
          }
        });
      }
    });

    // Combine all matches
    const allMatches = new Set([...patternMatches, ...directMatches, ...contextualMatches]);
    
    console.log(`   📊 Total unique exercises found: ${allMatches.size}`);
    if (allMatches.size > 0) {
      console.log(`   🏋️ Exercises: ${Array.from(allMatches).join(', ')}`);
    }

    // Categorize by muscle group with enhanced logic
    for (const [groupName, groupData] of Object.entries(ENHANCED_MUSCLE_GROUPS)) {
      const groupMatches = new Set();
      
      // Check direct exercise matches first (most reliable)
      groupData.exercises.forEach(exercise => {
        if (allMatches.has(exercise) || allMatches.has(exercise.toLowerCase())) {
          groupMatches.add(exercise);
          availableExercisesByGroup[groupName].add(exercise);
        }
      });

      // Check keyword-based matches
      allMatches.forEach(exerciseName => {
        const matchesKeywords = groupData.keywords.some(keyword => 
          exerciseName.includes(keyword) || 
          chunkText.includes(`${keyword} `) ||
          chunkText.includes(`${exerciseName} `)
        );
        
        if (matchesKeywords) {
          groupMatches.add(exerciseName);
          availableExercisesByGroup[groupName].add(exerciseName);
        }
      });

      if (groupMatches.size > 0) {
        console.log(`   🎯 ${groupName.toUpperCase()}: ${Array.from(groupMatches).join(', ')}`);
        detailedFindings[groupName].chunks.push(chunk.title);
        detailedFindings[groupName].patterns.push(...patternMatches);
        detailedFindings[groupName].direct.push(...directMatches);
      }
    }

    console.log('   ' + '─'.repeat(80));
  }

  // Generate comprehensive summary
  let summary = "\n<exercise_availability>\n";
  summary += "🔍 COMPREHENSIVE EXERCISE ANALYSIS (Enhanced Detection):\n\n";

  Object.entries(availableExercisesByGroup).forEach(([group, exercises]) => {
    const exerciseList = Array.from(exercises);
    if (exerciseList.length > 0) {
      summary += `✅ ${group.toUpperCase()}: ${exerciseList.length} exercises found\n`;
      summary += `   Primary exercises: ${exerciseList.slice(0, 5).join(', ')}${exerciseList.length > 5 ? ', +more' : ''}\n`;
      summary += `   KB sources: ${detailedFindings[group].chunks.slice(0, 2).join(', ')}${detailedFindings[group].chunks.length > 2 ? ', +more' : ''}\n\n`;
    } else {
      summary += `❌ ${group.toUpperCase()}: No exercises detected in current KB context\n\n`;
    }
  });

  summary += "🎯 IMPORTANT FOR AI: Only claim exercise limitations for muscle groups marked with ❌ above.\n";
  summary += "📚 For groups marked with ✅, you have comprehensive exercise options available.\n";
  summary += "</exercise_availability>\n";

  return {
    summary,
    exercisesByGroup: availableExercisesByGroup,
    detailedAnalysis: detailedFindings
  };
}

async function testEnhancedExtractionWithVectorResults() {
  try {
    console.log('🧪 Testing Enhanced Exercise Extraction with Vector Search Results...\n');

    // Test with actual vector search results (simulate the real RAG pipeline)
    const testQueries = [
      "leg exercises quadriceps hamstrings glutes",
      "complete leg workout routine", 
      "lower body training guide"
    ];

    for (const query of testQueries) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 TESTING QUERY: "${query}"`);
      console.log(`${'='.repeat(80)}`);

      // Get chunks like vector search would (simulate vector search with keyword filtering)
      const relevantChunks = await prisma.knowledgeChunk.findMany({
        where: {
          OR: [
            { content: { contains: 'leg', mode: 'insensitive' } },
            { content: { contains: 'squat', mode: 'insensitive' } },
            { content: { contains: 'quadriceps', mode: 'insensitive' } },
            { content: { contains: 'lower body', mode: 'insensitive' } },
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
          knowledgeItem: { select: { title: true } }
        },
        take: 15, // Get more chunks like a real vector search
        orderBy: { createdAt: 'desc' }
      });

      // Format like RAG system
      const formattedChunks = relevantChunks.map((chunk, index) => ({
        title: chunk.knowledgeItem.title,
        content: chunk.content,
        score: 0.8 - (index * 0.05) // Mock decreasing relevance scores
      }));

      console.log(`📚 Retrieved ${formattedChunks.length} chunks for analysis`);

      // Apply enhanced extraction
      const result = enhancedExerciseExtraction(formattedChunks);
      
      console.log('\n📋 EXTRACTION RESULTS:');
      console.log(result.summary);

      // Test specific exercise availability
      const testExercises = ['leg press', 'squat', 'leg extension', 'leg curl', 'hack squat'];
      console.log('\n🎯 SPECIFIC EXERCISE VERIFICATION:');
      testExercises.forEach(exercise => {
        const found = result.exercisesByGroup.legs?.has(exercise) || 
                     result.exercisesByGroup.legs?.has(exercise.toLowerCase());
        console.log(`   ${found ? '✅' : '❌'} ${exercise}: ${found ? 'FOUND' : 'NOT FOUND'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedExtractionWithVectorResults();
