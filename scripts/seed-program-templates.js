/**
 * Seed Program Templates Script
 * 
 * Creates sample program templates with workouts and exercises
 * for the Browse Templates section.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProgramTemplates() {
  console.log('\n🌱 Seeding Program Templates...\n');

  try {
    // Get training splits and structures
    const upperLowerSplit = await prisma.trainingSplit.findFirst({
      where: { name: 'Upper/Lower' },
      include: {
        trainingStructures: {
          where: { daysPerWeek: 4 }
        }
      }
    });

    const pplSplit = await prisma.trainingSplit.findFirst({
      where: { name: 'Push/Pull/Legs' },
      include: {
        trainingStructures: {
          where: { daysPerWeek: 6 }
        }
      }
    });

    const fullBodySplit = await prisma.trainingSplit.findFirst({
      where: { name: 'Full Body' },
      include: {
        trainingStructures: {
          where: { daysPerWeek: 3 }
        }
      }
    });

    if (!upperLowerSplit || !pplSplit || !fullBodySplit) {
      console.log('❌ Required training splits not found. Please run: npx prisma db seed');
      return;
    }

    // Get some exercises for the templates
    const exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      take: 20
    });

    if (exercises.length === 0) {
      console.log('❌ No exercises found. Please add exercises via Admin Dashboard.');
      return;
    }

    console.log(`✅ Found ${exercises.length} exercises to use in templates`);

    // Helper function to get exercises by type
    const getExercisesByType = (type) => {
      return exercises.filter(ex => ex.exerciseType === type);
    };

    const compoundExercises = getExercisesByType('COMPOUND');
    const isolationExercises = getExercisesByType('ISOLATION');

    // Template 1: Beginner Upper/Lower 4-Day Split
    console.log('\n📋 Creating: Beginner Upper/Lower 4-Day Split...');
    const beginnerUL = await prisma.programTemplate.upsert({
      where: { name: 'Beginner Upper/Lower 4-Day Split' },
      update: {},
      create: {
        name: 'Beginner Upper/Lower 4-Day Split',
        description: 'Perfect for beginners focusing on fundamental movement patterns. Train upper body twice and lower body twice per week with progressive overload.',
        difficultyLevel: 'BEGINNER',
        splitId: upperLowerSplit.id,
        structureId: upperLowerSplit.trainingStructures[0].id,
        workoutStructureType: 'AB',
        estimatedDurationWeeks: 12,
        targetAudience: 'Beginners looking to build strength and muscle',
        popularity: 150,
        isActive: true
      }
    });

    // Add workouts for Beginner UL
    const ulWorkouts = [
      {
        name: 'Upper Body A',
        type: 'Upper',
        assignedDays: ['Monday'],
        order: 1
      },
      {
        name: 'Lower Body A',
        type: 'Lower',
        assignedDays: ['Tuesday'],
        order: 2
      },
      {
        name: 'Upper Body B',
        type: 'Upper',
        assignedDays: ['Thursday'],
        order: 3
      },
      {
        name: 'Lower Body B',
        type: 'Lower',
        assignedDays: ['Friday'],
        order: 4
      }
    ];

    for (const workout of ulWorkouts) {
      const createdWorkout = await prisma.templateWorkout.create({
        data: {
          templateId: beginnerUL.id,
          name: workout.name,
          type: workout.type,
          assignedDays: workout.assignedDays,
          order: workout.order
        }
      });

      // Add 4-5 exercises per workout
      const exercisesToAdd = workout.type === 'Upper' 
        ? compoundExercises.slice(0, 3).concat(isolationExercises.slice(0, 2))
        : compoundExercises.slice(3, 6).concat(isolationExercises.slice(2, 4));

      for (let i = 0; i < Math.min(5, exercisesToAdd.length); i++) {
        await prisma.templateExercise.create({
          data: {
            workoutId: createdWorkout.id,
            exerciseId: exercisesToAdd[i].id,
            sets: 3,
            reps: '8-12',
            isUnilateral: false,
            order: i + 1
          }
        });
      }
    }

    console.log('   ✅ Created Beginner Upper/Lower template with 4 workouts');

    // Template 2: Intermediate PPL 6-Day Split
    console.log('\n📋 Creating: Intermediate PPL 6-Day Split...');
    const intermediatePPL = await prisma.programTemplate.upsert({
      where: { name: 'Intermediate PPL 6-Day Split' },
      update: {},
      create: {
        name: 'Intermediate PPL 6-Day Split',
        description: 'High-volume push/pull/legs split for intermediate lifters. Train each muscle group twice per week with optimal recovery.',
        difficultyLevel: 'INTERMEDIATE',
        splitId: pplSplit.id,
        structureId: pplSplit.trainingStructures[0].id,
        workoutStructureType: 'ABC',
        estimatedDurationWeeks: 8,
        targetAudience: 'Intermediate lifters seeking muscle growth',
        popularity: 230,
        isActive: true
      }
    });

    const pplWorkouts = [
      { name: 'Push A', type: 'Push', assignedDays: ['Monday'], order: 1 },
      { name: 'Pull A', type: 'Pull', assignedDays: ['Tuesday'], order: 2 },
      { name: 'Legs A', type: 'Legs', assignedDays: ['Wednesday'], order: 3 },
      { name: 'Push B', type: 'Push', assignedDays: ['Thursday'], order: 4 },
      { name: 'Pull B', type: 'Pull', assignedDays: ['Friday'], order: 5 },
      { name: 'Legs B', type: 'Legs', assignedDays: ['Saturday'], order: 6 }
    ];

    for (const workout of pplWorkouts) {
      const createdWorkout = await prisma.templateWorkout.create({
        data: {
          templateId: intermediatePPL.id,
          name: workout.name,
          type: workout.type,
          assignedDays: workout.assignedDays,
          order: workout.order
        }
      });

      // Add 5-6 exercises per workout
      const startIdx = (workout.order - 1) * 2;
      const exercisesToAdd = exercises.slice(startIdx, startIdx + 6);

      for (let i = 0; i < Math.min(6, exercisesToAdd.length); i++) {
        await prisma.templateExercise.create({
          data: {
            workoutId: createdWorkout.id,
            exerciseId: exercisesToAdd[i].id,
            sets: workout.type === 'Legs' ? 4 : 3,
            reps: workout.type === 'Legs' ? '10-15' : '8-12',
            isUnilateral: false,
            order: i + 1
          }
        });
      }
    }

    console.log('   ✅ Created Intermediate PPL template with 6 workouts');

    // Template 3: Beginner Full Body 3-Day
    console.log('\n📋 Creating: Beginner Full Body 3-Day...');
    const beginnerFB = await prisma.programTemplate.upsert({
      where: { name: 'Beginner Full Body 3-Day' },
      update: {},
      create: {
        name: 'Beginner Full Body 3-Day',
        description: 'Efficient full-body workouts three times per week. Perfect for beginners or those with limited time. Focus on compound movements.',
        difficultyLevel: 'BEGINNER',
        splitId: fullBodySplit.id,
        structureId: fullBodySplit.trainingStructures[0].id,
        workoutStructureType: 'REPEATING',
        estimatedDurationWeeks: 12,
        targetAudience: 'Beginners or time-constrained lifters',
        popularity: 180,
        isActive: true
      }
    });

    const fbWorkouts = [
      { name: 'Full Body A', type: 'Full Body', assignedDays: ['Monday'], order: 1 },
      { name: 'Full Body B', type: 'Full Body', assignedDays: ['Wednesday'], order: 2 },
      { name: 'Full Body C', type: 'Full Body', assignedDays: ['Friday'], order: 3 }
    ];

    for (const workout of fbWorkouts) {
      const createdWorkout = await prisma.templateWorkout.create({
        data: {
          templateId: beginnerFB.id,
          name: workout.name,
          type: workout.type,
          assignedDays: workout.assignedDays,
          order: workout.order
        }
      });

      // Add 6-7 compound exercises per workout
      const startIdx = (workout.order - 1) * 3;
      const exercisesToAdd = compoundExercises.length > 0 
        ? compoundExercises.slice(startIdx, startIdx + 6)
        : exercises.slice(startIdx, startIdx + 6);

      for (let i = 0; i < Math.min(6, exercisesToAdd.length); i++) {
        await prisma.templateExercise.create({
          data: {
            workoutId: createdWorkout.id,
            exerciseId: exercisesToAdd[i].id,
            sets: 3,
            reps: '8-12',
            isUnilateral: false,
            order: i + 1
          }
        });
      }
    }

    console.log('   ✅ Created Beginner Full Body template with 3 workouts');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Program Templates Seeded Successfully!');
    console.log('='.repeat(60));
    console.log('Created 3 program templates:');
    console.log('  1. Beginner Upper/Lower 4-Day Split (4 workouts)');
    console.log('  2. Intermediate PPL 6-Day Split (6 workouts)');
    console.log('  3. Beginner Full Body 3-Day (3 workouts)');
    console.log('\n💡 Templates are now available in the Browse Templates section!');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding program templates:', error);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProgramTemplates();
