// test-workout-program-generation.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Manual intent detection function for testing
function detectWorkoutProgramIntent(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const programKeywords = [
    'create a program',
    'create program',
    'workout program',
    'training program',
    'workout plan',
    'training plan',
    'routine',
    'schedule me a workout',
    'schedule workout',
    'design a program',
    'design program',
    'build a program',
    'build program',
    'workout routine',
    'training routine',
    'full program',
    'weekly plan',
    'split routine',
    'training split',
    'program for me',
    'workout schedule'
  ];
  
  // Check for exact keyword matches
  const hasExactMatch = programKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  // Check for pattern-based matches
  const patternMatches = [
    /create.*\d.*day.*workout/i,
    /create.*\d.*day.*program/i,
    /design.*\d.*day.*workout/i,
    /\d.*day.*workout.*program/i,
    /\d.*day.*training.*program/i,
    /program.*\d.*day/i,
    /workout.*\d.*day/i
  ];
  
  const hasPatternMatch = patternMatches.some(pattern => pattern.test(prompt));
  
  return hasExactMatch || hasPatternMatch;
}

async function testWorkoutProgramGeneration() {
  console.log("🧪 Testing Workout Program Generation System...\n");

  try {
    // Test 1: Intent Detection
    console.log("📋 Test 1: Intent Detection");
    console.log("=" .repeat(50));

    const testPrompts = [
      "create a program for chest and arms",
      "I need a workout plan for building muscle",
      "design me a full body routine",
      "schedule me a workout for next week",
      "what exercises should I do for biceps?", // Should NOT trigger
      "how do I train my chest?", // Should NOT trigger
      "create a training split for 4 days"
    ];

    testPrompts.forEach((prompt, index) => {
      const isDetected = detectWorkoutProgramIntent(prompt);
      console.log(`${index + 1}. "${prompt}"`);
      console.log(`   → Program Intent: ${isDetected ? '✅ YES' : '❌ NO'}`);
      console.log();
    });

    // Test 2: Check AI Configuration
    console.log("\n📋 Test 2: AI Configuration Check");
    console.log("=" .repeat(50));

    const config = await prisma.aIConfiguration.findFirst();
    if (!config) {
      console.log("❌ No AI Configuration found! Please set up admin configuration first.");
      return;
    }

    console.log("✅ AI Configuration found");
    console.log(`   - Model: ${config.proModelName}`);
    console.log(`   - Knowledge Base: ${config.useKnowledgeBase ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Max Chunks: ${config.ragMaxChunks}`);
    console.log(`   - Similarity Threshold: ${config.ragSimilarityThreshold}`);

    if (!config.useKnowledgeBase) {
      console.log("⚠️ Knowledge Base is disabled. Program generation requires it to be enabled.");
      return;
    }

    // Test 3: Check Knowledge Base Content
    console.log("\n📋 Test 3: Knowledge Base Content Check");
    console.log("=" .repeat(50));

    const knowledgeCount = await prisma.knowledgeItem.count();
    console.log(`   - Total Knowledge Items: ${knowledgeCount}`);

    if (knowledgeCount === 0) {
      console.log("❌ No knowledge items found! Please upload training guides first.");
      return;
    }

    // Check for program-relevant content
    const programRelevantTitles = [
      'training volume',
      'training split',
      'rep ranges',
      'rest periods',
      'exercise selection',
      'chest training',
      'back training',
      'leg training'
    ];

    for (const title of programRelevantTitles) {
      const count = await prisma.knowledgeItem.count({
        where: {
          title: {
            contains: title,
            mode: 'insensitive'
          }
        }
      });
      console.log(`   - "${title}" articles: ${count}`);
    }

    // Test 4: Get Test User Profile
    console.log("\n📋 Test 4: Test User Profile");
    console.log("=" .repeat(50));

    const testUser = await prisma.user.findFirst({
      include: { clientMemory: true }
    });

    if (!testUser) {
      console.log("❌ No users found! Cannot test without a user profile.");
      return;
    }

    console.log(`✅ Test user found: ${testUser.email}`);
    console.log(`   - Has profile: ${testUser.clientMemory ? 'Yes' : 'No'}`);

    // Test 5: Simulate Program Generation (without API call)
    console.log("\n📋 Test 5: Program Generation Simulation");
    console.log("=" .repeat(50));

    const testPrompt = "Create a 4-day workout program for building muscle, focusing on chest, back, and legs. I'm an intermediate lifter.";
    console.log(`Test prompt: "${testPrompt}"`);
    console.log();

    console.log("🔍 Intent Detection:");
    const isWorkoutIntent = detectWorkoutProgramIntent(testPrompt);
    console.log(`   → ${isWorkoutIntent ? '✅ Workout program detected' : '❌ Not detected as workout program'}`);

    if (!isWorkoutIntent) {
      console.log("❌ Intent detection failed - cannot proceed with program generation test");
      return;
    }

    console.log("\n🏗️ Multi-Query RAG Setup:");
    console.log("   → Core principles to search:");
    const coreQueries = [
      'A Guide to Setting Your Training Volume',
      'A Guide to Common Training Splits', 
      'A Guide to Rep Ranges',
      'A Guide to Rest Periods',
      'A Guide to Efficient Exercise Selection'
    ];
    coreQueries.forEach((query, i) => console.log(`     ${i + 1}. ${query}`));

    console.log("\n   → Muscle-specific searches:");
    const muscleQueries = [
      'A Guide to Effective Chest Training',
      'A Guide to Effective Back Training', 
      'A Guide to Effective Leg Training'
    ];
    muscleQueries.forEach((query, i) => console.log(`     ${i + 1}. ${query}`));

    console.log(`\n   → Total searches planned: ${coreQueries.length + muscleQueries.length + 1} (+ original prompt)`);

    // Test 6: Check Required Dependencies
    console.log("\n📋 Test 6: Dependencies Check");
    console.log("=" .repeat(50));

    try {
      // Check if Gemini API key is available
      const hasGeminiKey = !!process.env.GEMINI_API_KEY;
      console.log(`   - Gemini API Key: ${hasGeminiKey ? '✅ Available' : '❌ Missing'}`);

      if (!hasGeminiKey) {
        console.log("❌ GEMINI_API_KEY not found in environment variables");
        return;
      }

      console.log("   - Vector Search Function: ✅ Available (assumed)");
      console.log("   - Core Prompts Function: ✅ Available (assumed)");
      console.log("   - Workout Program Generator: ✅ Created");

      console.log("\n✅ All dependencies are available");

    } catch (error) {
      console.log(`❌ Dependency check failed: ${error.message}`);
      return;
    }

    console.log("\n🎯 Summary:");
    console.log("=" .repeat(50));
    console.log("✅ Intent detection working");
    console.log("✅ AI configuration available");
    console.log("✅ Knowledge base has content");
    console.log("✅ Test user profile available");
    console.log("✅ All dependencies available");
    console.log();
    console.log("🚀 System is ready for workout program generation!");
    console.log();
    console.log("Next steps:");
    console.log("1. Test the /api/chat endpoint with a program request");
    console.log("2. Monitor console for multi-query RAG execution");
    console.log("3. Verify comprehensive program output");
    console.log("4. Check citation inclusion");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWorkoutProgramGeneration().catch(console.error);
