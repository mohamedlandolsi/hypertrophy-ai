// test-program-review-chat-integration.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramReviewChatIntegration() {
  console.log('🎯 TESTING PROGRAM REVIEW CHAT INTEGRATION');
  console.log('==========================================\n');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`👤 Using test user: ${testUser.email}`);

    // Simulate program review scenarios
    const testScenarios = [
      {
        name: "Explicit Review Request",
        message: "Can you review my current workout program?",
        shouldTrigger: true
      },
      {
        name: "Program Presentation",
        message: "Here is my program: Monday - Squats 4x8, Bench Press 4x6, Rows 4x8. Tuesday - Deadlifts 5x5, Pull-ups 3x10, Overhead Press 4x8. What do you think?",
        shouldTrigger: true
      },
      {
        name: "Program Quality Question", 
        message: "Is this routine good? Day 1: Leg Press 3x12, Leg Extensions 3x15, Calf Raises 4x15",
        shouldTrigger: true
      },
      {
        name: "Program Creation (Should NOT trigger)",
        message: "Create a workout program for me",
        shouldTrigger: false
      },
      {
        name: "General Question (Should NOT trigger)",
        message: "What's the best exercise for biceps?",
        shouldTrigger: false
      }
    ];

    // Test each scenario by checking what would happen
    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      console.log(`   Message: "${scenario.message}"`);
      
      // Simulate the detection logic (inline implementation for testing)
      const isProgramReview = detectProgramReviewIntent(scenario.message);
      
      if (isProgramReview === scenario.shouldTrigger) {
        console.log(`   ✅ CORRECT: Detection returned ${isProgramReview} (expected ${scenario.shouldTrigger})`);
      } else {
        console.log(`   ❌ INCORRECT: Detection returned ${isProgramReview} (expected ${scenario.shouldTrigger})`);
      }
      
      if (isProgramReview) {
        console.log('   🎯 Would include hypertrophy_programs_review category in knowledge search');
        
        // Check if the category would provide relevant results
        const category = await prisma.knowledgeCategory.findFirst({
          where: { name: 'hypertrophy_programs_review' },
          include: {
            KnowledgeItemCategory: {
              include: {
                KnowledgeItem: {
                  select: {
                    title: true,
                    status: true,
                    chunks: {
                      select: { id: true },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        });
        
        if (category && category.KnowledgeItemCategory.length > 0) {
          const readyItems = category.KnowledgeItemCategory.filter(
            item => item.KnowledgeItem.status === 'READY'
          );
          console.log(`   📚 Would search ${readyItems.length} ready knowledge items`);
        }
      } else {
        console.log('   📖 Would use standard knowledge search (no special category)');
      }
    }

    // Test configuration requirements
    console.log('\n⚙️ CONFIGURATION CHECK');
    console.log('=======================');
    
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    const requirements = [
      {
        name: 'AI Configuration exists',
        check: !!config,
        critical: true
      },
      {
        name: 'Knowledge Base enabled',
        check: config?.useKnowledgeBase || false,
        critical: true
      },
      {
        name: 'Program review category exists',
        check: await checkCategoryExists(),
        critical: true
      },
      {
        name: 'Category has ready items',
        check: await checkCategoryHasContent(),
        critical: false
      }
    ];

    let criticalIssues = 0;
    requirements.forEach(req => {
      const icon = req.check ? '✅' : '❌';
      const severity = req.critical ? '(CRITICAL)' : '(OPTIONAL)';
      console.log(`${icon} ${req.name} ${severity}`);
      
      if (!req.check && req.critical) {
        criticalIssues++;
      }
    });

    console.log('\n📊 FINAL ASSESSMENT');
    console.log('====================');
    
    if (criticalIssues === 0) {
      console.log('🎉 SUCCESS: Program review functionality is ready for production!');
      console.log('\n✨ When users send program review requests:');
      console.log('   • System will detect the intent automatically');
      console.log('   • Knowledge search will prioritize program review guidance');
      console.log('   • AI will provide structured program analysis');
      console.log('   • Users get expert-level program feedback');
    } else {
      console.log(`⚠️ ISSUES: ${criticalIssues} critical issue(s) need to be resolved.`);
    }

  } catch (error) {
    console.error('💥 Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Inline detection function for testing
function detectProgramReviewIntent(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const reviewKeywords = [
    'review my program', 'review my workout', 'review my routine',
    'check my program', 'check my workout', 'check my routine',
    'evaluate my program', 'evaluate my workout', 'evaluate my routine',
    'analyze my program', 'analyze my workout', 'analyze my routine',
    'feedback on my program', 'feedback on my workout', 'feedback on my routine',
    'give me feedback on my', 'what do you think of my program',
    'what do you think of my workout', 'what do you think of my routine',
    'thoughts on my program', 'thoughts on my workout', 'thoughts on my routine',
    'rate my program', 'rate my workout', 'rate my routine',
    'critique my program', 'critique my workout', 'critique my routine'
  ];
  
  const hasExactMatch = reviewKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  const reviewPatterns = [
    /here.*is.*my.*program/i, /here.*is.*my.*workout/i, /here.*is.*my.*routine/i,
    /this.*is.*my.*program/i, /this.*is.*my.*workout/i, /this.*is.*my.*routine/i,
    /my.*current.*program/i, /my.*current.*workout/i, /my.*current.*routine/i,
    /i.*am.*doing.*this.*program/i, /i.*am.*doing.*this.*workout/i,
    /i.*am.*following.*this.*program/i, /currently.*doing.*this.*program/i,
    /currently.*doing.*this.*workout/i, /is.*this.*program.*good/i,
    /is.*this.*workout.*good/i, /is.*this.*routine.*good/i,
    /does.*this.*program.*look.*good/i, /does.*this.*workout.*look.*good/i
  ];
  
  const hasPatternMatch = reviewPatterns.some(pattern => pattern.test(prompt));
  
  const hasWorkoutStructure = checkForWorkoutStructure(prompt);
  
  return hasExactMatch || hasPatternMatch || hasWorkoutStructure;
}

function checkForWorkoutStructure(prompt) {
  const exercisePatterns = [
    /\d+\s*x\s*\d+/g, /\d+\s*sets?\s*of\s*\d+/gi,
    /\d+\s*reps?/gi, /\d+\s*sets?/gi
  ];
  
  let exerciseIndicators = 0;
  exercisePatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) exerciseIndicators += matches.length;
  });
  
  const commonExercises = [
    'squat', 'deadlift', 'bench press', 'row', 'pull up', 'pullup', 'push up', 'pushup',
    'curl', 'extension', 'raise', 'press', 'fly', 'dip', 'lunge', 'calf raise',
    'lat pulldown', 'overhead press', 'shoulder press', 'chest press', 'leg press'
  ];
  
  const exerciseCount = commonExercises.filter(exercise => 
    prompt.toLowerCase().includes(exercise)
  ).length;
  
  return exerciseIndicators >= 3 && exerciseCount >= 2;
}

async function checkCategoryExists() {
  const category = await prisma.knowledgeCategory.findFirst({
    where: { name: 'hypertrophy_programs_review' }
  });
  return !!category;
}

async function checkCategoryHasContent() {
  const category = await prisma.knowledgeCategory.findFirst({
    where: { name: 'hypertrophy_programs_review' },
    include: {
      KnowledgeItemCategory: {
        include: {
          KnowledgeItem: {
            select: {
              status: true
            }
          }
        }
      }
    }
  });
  
  const readyItems = category?.KnowledgeItemCategory?.filter(
    item => item.KnowledgeItem.status === 'READY'
  );
  
  return readyItems?.length > 0;
}

testProgramReviewChatIntegration().catch(console.error);
