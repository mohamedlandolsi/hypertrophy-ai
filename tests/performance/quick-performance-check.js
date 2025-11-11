/**
 * Performance Test Runner
 * 
 * Quick performance checks for critical paths
 * Run with: node tests/performance/quick-performance-check.js
 */

const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

const prisma = new PrismaClient({
  log: ['query', 'info'],
});

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Performance thresholds (milliseconds)
const THRESHOLDS = {
  PROGRAMS_QUERY: 200,
  WORKOUTS_QUERY: 500,
  TEMPLATE_QUERY: 300,
};

async function measureQuery(label, queryFn, threshold) {
  console.log(`\n${colors.cyan}Running: ${label}${colors.reset}`);
  
  const startTime = performance.now();
  const result = await queryFn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  const status = duration < threshold ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`  ${status} - ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
  
  if (Array.isArray(result)) {
    console.log(`  Records: ${result.length}`);
  }
  
  return { label, duration, threshold, passed: duration < threshold, recordCount: Array.isArray(result) ? result.length : 1 };
}

async function runPerformanceTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Performance Quick Check${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  
  const results = [];
  
  try {
    // Get a test user (or use first available)
    const testUser = await prisma.user.findFirst({
      where: {
        subscriptionTier: { in: ['PRO_MONTHLY', 'PRO_YEARLY'] },
      },
    });
    
    if (!testUser) {
      console.log(`${colors.yellow}⚠ No PRO user found. Creating test user...${colors.reset}`);
      const newUser = await prisma.user.create({
        data: {
          role: 'user',
          subscriptionTier: 'PRO_YEARLY',
          subscriptionStatus: 'active',
          plan: 'PRO',
        },
      });
      console.log(`${colors.green}✓ Test user created${colors.reset}`);
      testUser = newUser;
    }
    
    console.log(`${colors.cyan}Using User ID: ${testUser.id}${colors.reset}`);
    
    // Test 1: Query user programs
    results.push(await measureQuery(
      'Query User Programs',
      async () => {
        return await prisma.customTrainingProgram.findMany({
          where: { userId: testUser.id },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            workoutStructureType: true,
            createdAt: true,
          },
          take: 20, // Paginated
          orderBy: { createdAt: 'desc' },
        });
      },
      THRESHOLDS.PROGRAMS_QUERY
    ));
    
    // Test 2: Query all programs (no pagination)
    results.push(await measureQuery(
      'Query All User Programs (No Pagination)',
      async () => {
        return await prisma.customTrainingProgram.findMany({
          where: { userId: testUser.id },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        });
      },
      THRESHOLDS.PROGRAMS_QUERY * 2
    ));
    
    // Test 3: Query program with workouts
    const program = await prisma.customTrainingProgram.findFirst({
      where: { userId: testUser.id },
    });
    
    if (program) {
      results.push(await measureQuery(
        'Query Program with Workouts & Exercises',
        async () => {
          return await prisma.workout.findMany({
            where: { programId: program.id },
            select: {
              id: true,
              name: true,
              type: true,
              assignedDays: true,
              exercises: {
                select: {
                  id: true,
                  sets: true,
                  reps: true,
                  order: true,
                  exercise: {
                    select: {
                      id: true,
                      name: true,
                      primaryMuscle: true,
                      exerciseType: true,
                    },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
          });
        },
        THRESHOLDS.WORKOUTS_QUERY
      ));
    } else {
      console.log(`${colors.yellow}⚠ No programs found for user${colors.reset}`);
    }
    
    // Test 4: Query templates
    results.push(await measureQuery(
      'Query Program Templates',
      async () => {
        return await prisma.programTemplate.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            difficultyLevel: true,
            popularity: true,
            _count: {
              select: {
                templateWorkouts: true,
              },
            },
          },
          take: 20,
          orderBy: { popularity: 'desc' },
        });
      },
      THRESHOLDS.TEMPLATE_QUERY
    ));
    
    // Test 5: Query single template with full data
    const template = await prisma.programTemplate.findFirst({
      where: { isActive: true },
    });
    
    if (template) {
      results.push(await measureQuery(
        'Query Template with Workouts & Exercises',
        async () => {
          return await prisma.programTemplate.findUnique({
            where: { id: template.id },
            include: {
              trainingSplit: true,
              templateWorkouts: {
                include: {
                  templateExercises: {
                    include: {
                      exercise: {
                        select: {
                          id: true,
                          name: true,
                          primaryMuscle: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        },
        THRESHOLDS.TEMPLATE_QUERY
      ));
    } else {
      console.log(`${colors.yellow}⚠ No templates found${colors.reset}`);
    }
    
    // Test 6: Count queries (should be very fast)
    results.push(await measureQuery(
      'Count User Programs',
      async () => {
        return await prisma.customTrainingProgram.count({
          where: { userId: testUser.id },
        });
      },
      50 // Should be under 50ms
    ));
    
    // Test 7: Exercise library query
    results.push(await measureQuery(
      'Query Exercise Library',
      async () => {
        return await prisma.exercise.findMany({
          select: {
            id: true,
            name: true,
            primaryMuscle: true,
            secondaryMuscles: true,
            exerciseType: true,
          },
          take: 50,
        });
      },
      100 // Should be under 100ms
    ));
    
  } catch (error) {
    console.error(`\n${colors.red}Error running tests:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Performance Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`  Total Tests: ${total}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
  
  console.log(`\n${colors.cyan}Detailed Results:${colors.reset}`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`${'Test Name'.padEnd(45)} ${'Time (ms)'.padEnd(15)} ${'Status'.padEnd(10)}`);
  console.log(`${'─'.repeat(80)}`);
  
  results.forEach(result => {
    const statusIcon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const timeColor = result.passed ? colors.green : colors.red;
    console.log(
      `${result.label.padEnd(45)} ` +
      `${timeColor}${result.duration.toFixed(2).padEnd(13)}${colors.reset} ` +
      `${statusIcon}`
    );
  });
  
  console.log(`${'─'.repeat(80)}\n`);
  
  // Recommendations
  console.log(`${colors.cyan}Recommendations:${colors.reset}\n`);
  
  if (failed > 0) {
    console.log(`${colors.yellow}⚠ Some queries exceeded thresholds. Consider:${colors.reset}`);
    console.log(`  1. Adding database indexes`);
    console.log(`  2. Implementing pagination`);
    console.log(`  3. Using select to fetch only needed fields`);
    console.log(`  4. Adding caching layer (Redis)`);
    console.log(`  5. Optimizing query patterns`);
  } else {
    console.log(`${colors.green}✓ All queries within acceptable thresholds!${colors.reset}`);
    console.log(`  Continue monitoring in production environment`);
  }
  
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
}

// Run tests
runPerformanceTests().catch(console.error);
