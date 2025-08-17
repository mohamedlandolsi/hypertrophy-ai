// test-program-review-detection.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Inline implementation of detectProgramReviewIntent for testing
function detectProgramReviewIntent(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Keywords that indicate the user is presenting their own program for review
  const reviewKeywords = [
    'review my program',
    'review my workout',
    'review my routine',
    'check my program',
    'check my workout', 
    'check my routine',
    'evaluate my program',
    'evaluate my workout',
    'evaluate my routine',
    'analyze my program',
    'analyze my workout',
    'analyze my routine',
    'feedback on my program',
    'feedback on my workout',
    'feedback on my routine',
    'give me feedback on my',
    'what do you think of my program',
    'what do you think of my workout',
    'what do you think of my routine',
    'thoughts on my program',
    'thoughts on my workout',
    'thoughts on my routine',
    'rate my program',
    'rate my workout',
    'rate my routine',
    'critique my program',
    'critique my workout',
    'critique my routine'
  ];
  
  // Check for exact keyword matches
  const hasExactMatch = reviewKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  // Pattern-based detection for program presentation
  const reviewPatterns = [
    // Common patterns for presenting programs
    /here.*is.*my.*program/i,
    /here.*is.*my.*workout/i,
    /here.*is.*my.*routine/i,
    /this.*is.*my.*program/i,
    /this.*is.*my.*workout/i,
    /this.*is.*my.*routine/i,
    /my.*current.*program/i,
    /my.*current.*workout/i,
    /my.*current.*routine/i,
    /i.*am.*doing.*this.*program/i,
    /i.*am.*doing.*this.*workout/i,
    /i.*am.*following.*this.*program/i,
    /currently.*doing.*this.*program/i,
    /currently.*doing.*this.*workout/i,
    /is.*this.*program.*good/i,
    /is.*this.*workout.*good/i,
    /is.*this.*routine.*good/i,
    /does.*this.*program.*look.*good/i,
    /does.*this.*workout.*look.*good/i
  ];
  
  const hasPatternMatch = reviewPatterns.some(pattern => pattern.test(prompt));
  
  // Additional check: if prompt contains structured workout data (multiple exercises, sets/reps patterns)
  const hasWorkoutStructure = checkForWorkoutStructure(prompt);
  
  return hasExactMatch || hasPatternMatch || hasWorkoutStructure;
}

// Check if the prompt contains structured workout data indicating program presentation
function checkForWorkoutStructure(prompt) {
  // Count exercise-like patterns (exercise names with sets/reps)
  const exercisePatterns = [
    /\d+\s*x\s*\d+/g, // "3x10", "4 x 8", etc.
    /\d+\s*sets?\s*of\s*\d+/gi, // "3 sets of 10"
    /\d+\s*reps?/gi, // "10 reps"
    /\d+\s*sets?/gi, // "3 sets"
  ];
  
  let exerciseIndicators = 0;
  exercisePatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) {
      exerciseIndicators += matches.length;
    }
  });
  
  // Check for common exercise names (basic detection)
  const commonExercises = [
    'squat', 'deadlift', 'bench press', 'row', 'pull up', 'pullup', 'push up', 'pushup',
    'curl', 'extension', 'raise', 'press', 'fly', 'dip', 'lunge', 'calf raise',
    'lat pulldown', 'overhead press', 'shoulder press', 'chest press', 'leg press'
  ];
  
  const exerciseCount = commonExercises.filter(exercise => 
    prompt.toLowerCase().includes(exercise)
  ).length;
  
  // If we have multiple set/rep patterns AND multiple exercises, likely a program
  return exerciseIndicators >= 3 && exerciseCount >= 2;
}

async function testProgramReviewDetection() {
  console.log('🎯 TESTING PROGRAM REVIEW DETECTION');
  console.log('====================================\n');

  // Test cases for program review detection
  const testCases = [
    // Explicit review requests
    {
      input: "Can you review my current workout program?",
      expected: true,
      category: "Explicit review request"
    },
    {
      input: "What do you think of my routine?",
      expected: true,
      category: "Explicit review request"
    },
    {
      input: "Please analyze my workout program",
      expected: true,
      category: "Explicit review request"
    },
    {
      input: "Rate my workout routine",
      expected: true,
      category: "Explicit review request"
    },
    {
      input: "Give me feedback on my training program",
      expected: true,
      category: "Explicit review request"
    },

    // Program presentation patterns
    {
      input: "Here is my current program: Day 1: Squats 3x10, Bench Press 3x8, Rows 3x10",
      expected: true,
      category: "Program presentation"
    },
    {
      input: "This is my workout: Deadlifts 5x5, Pull-ups 3x12, Overhead Press 3x8",
      expected: true,
      category: "Program presentation"
    },
    {
      input: "I am doing this routine: Monday - Chest and Triceps: Bench Press 4x8, Incline Press 3x10, Tricep Extensions 3x12",
      expected: true,
      category: "Program presentation"
    },
    {
      input: "Is this program good? Squats 4x6, Romanian Deadlifts 3x8, Leg Press 3x12, Leg Extensions 3x15",
      expected: true,
      category: "Program presentation with question"
    },

    // Structured workout data
    {
      input: "Monday: Bench Press 4x8, Incline Dumbbell Press 3x10, Dips 3x12. Tuesday: Squats 4x6, Leg Press 3x12, Leg Extensions 3x15. Wednesday: Deadlifts 5x5, Pull-ups 3x8, Barbell Rows 3x10",
      expected: true,
      category: "Multiple exercises with sets/reps"
    },

    // Negative test cases (should NOT be detected as program review)
    {
      input: "Create a workout program for me",
      expected: false,
      category: "Program creation request (not review)"
    },
    {
      input: "What exercises should I do for chest?",
      expected: false,
      category: "Exercise recommendation"
    },
    {
      input: "How many sets should I do for squats?",
      expected: false,
      category: "Programming question"
    },
    {
      input: "What is the best way to train shoulders?",
      expected: false,
      category: "General training question"
    },
    {
      input: "I want to build muscle in my arms",
      expected: false,
      category: "Goal statement"
    },

    // Edge cases
    {
      input: "I've been doing squats and bench press, but I want to add more exercises",
      expected: false,
      category: "Current activity mention (not structured program)"
    },
    {
      input: "My program includes squats 3x8, bench 3x8, rows 3x8, and overhead press 3x8. What do you think?",
      expected: true,
      category: "Structured program with direct question"
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log('🔍 Testing Program Review Detection Logic...\n');

  for (const testCase of testCases) {
    try {
      const result = detectProgramReviewIntent(testCase.input);
      const success = result === testCase.expected;
      
      if (success) {
        console.log(`✅ PASS: ${testCase.category}`);
        console.log(`   Input: "${testCase.input.substring(0, 80)}${testCase.input.length > 80 ? '...' : ''}"`);
        console.log(`   Expected: ${testCase.expected}, Got: ${result}\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.category}`);
        console.log(`   Input: "${testCase.input.substring(0, 80)}${testCase.input.length > 80 ? '...' : ''}"`);
        console.log(`   Expected: ${testCase.expected}, Got: ${result}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${testCase.category}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  // Test category existence in database
  console.log('📋 Checking hypertrophy_programs_review category in database...');
  try {
    const category = await prisma.knowledgeCategory.findFirst({
      where: { name: 'hypertrophy_programs_review' },
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (category) {
      console.log(`✅ Category found: "${category.name}"`);
      console.log(`   Description: ${category.description || 'No description'}`);
      console.log(`   Knowledge items: ${category.KnowledgeItemCategory.length}`);
      
      if (category.KnowledgeItemCategory.length > 0) {
        console.log('   📄 Sample items:');
        category.KnowledgeItemCategory.slice(0, 3).forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.KnowledgeItem.title} (${item.KnowledgeItem.status})`);
        });
      }
    } else {
      console.log('❌ Category "hypertrophy_programs_review" not found in database!');
      console.log('   This category needs to be created for program review functionality to work.');
    }
  } catch (error) {
    console.log(`💥 Error checking category: ${error.message}`);
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Program review detection is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the detection logic for improvements.');
  }

  await prisma.$disconnect();
}

testProgramReviewDetection().catch(console.error);
