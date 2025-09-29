const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedExerciseTemplates() {
  try {
    console.log('🏋️ Seeding Exercise Templates for Training Programs...\n');

    // Get the training program
    const program = await prisma.trainingProgram.findFirst({
      where: { isActive: true }
    });

    if (!program) {
      console.log('❌ No active training program found');
      return;
    }

    console.log(`🎯 Adding exercise templates to program: ${program.id}`);
    console.log(`Program name: ${typeof program.name === 'object' ? program.name.en || program.name.ar : program.name}\n`);

    // Exercise templates for different muscle groups and categories
    const exerciseTemplates = [
      // CHEST exercises
      {
        muscleGroup: 'chest',
        exerciseType: 'COMPOUND',
        categoryType: 'MINIMALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'chest',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'chest',
        exerciseType: 'COMPOUND',
        categoryType: 'ESSENTIALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'chest',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 1,
        volume: { sets: [3, 5], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'chest',
        exerciseType: 'COMPOUND',
        categoryType: 'MAXIMALIST',
        priority: 2,
        volume: { sets: [4, 5], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'chest',
        exerciseType: 'UNILATERAL',
        categoryType: 'MAXIMALIST',
        priority: 3,
        volume: { sets: [2, 3], reps: [12, 15], restPeriod: 90 },
        alternatives: []
      },

      // BACK exercises
      {
        muscleGroup: 'back',
        exerciseType: 'COMPOUND',
        categoryType: 'MINIMALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'back',
        exerciseType: 'COMPOUND',
        categoryType: 'ESSENTIALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'back',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'back',
        exerciseType: 'COMPOUND',
        categoryType: 'MAXIMALIST',
        priority: 1,
        volume: { sets: [4, 5], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'back',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'back',
        exerciseType: 'UNILATERAL',
        categoryType: 'MAXIMALIST',
        priority: 3,
        volume: { sets: [2, 3], reps: [12, 15], restPeriod: 90 },
        alternatives: []
      },

      // SHOULDERS exercises
      {
        muscleGroup: 'shoulders',
        exerciseType: 'COMPOUND',
        categoryType: 'MINIMALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'shoulders',
        exerciseType: 'COMPOUND',
        categoryType: 'ESSENTIALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'shoulders',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [12, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'shoulders',
        exerciseType: 'COMPOUND',
        categoryType: 'MAXIMALIST',
        priority: 1,
        volume: { sets: [4, 5], reps: [8, 12], restPeriod: 120 },
        alternatives: []
      },
      {
        muscleGroup: 'shoulders',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [12, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'shoulders',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 3,
        volume: { sets: [2, 3], reps: [15, 20], restPeriod: 60 },
        alternatives: []
      },

      // ARMS exercises (biceps and triceps)
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'MINIMALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 1,
        volume: { sets: [3, 5], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [10, 15], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'arms',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 3,
        volume: { sets: [2, 3], reps: [12, 20], restPeriod: 60 },
        alternatives: []
      },

      // LEGS exercises
      {
        muscleGroup: 'legs',
        exerciseType: 'COMPOUND',
        categoryType: 'MINIMALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 15], restPeriod: 150 },
        alternatives: []
      },
      {
        muscleGroup: 'legs',
        exerciseType: 'COMPOUND',
        categoryType: 'ESSENTIALIST',
        priority: 1,
        volume: { sets: [3, 4], reps: [8, 15], restPeriod: 150 },
        alternatives: []
      },
      {
        muscleGroup: 'legs',
        exerciseType: 'ISOLATION',
        categoryType: 'ESSENTIALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [12, 20], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'legs',
        exerciseType: 'COMPOUND',
        categoryType: 'MAXIMALIST',
        priority: 1,
        volume: { sets: [4, 5], reps: [8, 15], restPeriod: 150 },
        alternatives: []
      },
      {
        muscleGroup: 'legs',
        exerciseType: 'ISOLATION',
        categoryType: 'MAXIMALIST',
        priority: 2,
        volume: { sets: [3, 4], reps: [12, 20], restPeriod: 90 },
        alternatives: []
      },
      {
        muscleGroup: 'legs',
        exerciseType: 'UNILATERAL',
        categoryType: 'MAXIMALIST',
        priority: 3,
        volume: { sets: [2, 3], reps: [12, 15], restPeriod: 90 },
        alternatives: []
      }
    ];

    // Create exercise templates
    console.log('🏗️ Creating exercise templates...');
    const createdTemplates = [];

    for (const template of exerciseTemplates) {
      const created = await prisma.exerciseTemplate.create({
        data: {
          trainingProgramId: program.id,
          muscleGroup: template.muscleGroup,
          exerciseType: template.exerciseType,
          categoryType: template.categoryType,
          priority: template.priority,
          volume: template.volume,
          alternatives: template.alternatives
        }
      });
      createdTemplates.push(created);
    }

    console.log(`✅ Successfully created ${createdTemplates.length} exercise templates!\n`);

    // Summary by muscle group and category
    console.log('📊 Exercise Templates Summary:');
    const summary = {};
    createdTemplates.forEach(template => {
      const key = `${template.muscleGroup}_${template.categoryType}`;
      if (!summary[key]) {
        summary[key] = 0;
      }
      summary[key]++;
    });

    ['MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST'].forEach(category => {
      console.log(`\n${category}:`);
      ['chest', 'back', 'shoulders', 'arms', 'legs'].forEach(muscle => {
        const count = summary[`${muscle}_${category}`] || 0;
        console.log(`  ${muscle}: ${count} templates`);
      });
    });

    console.log('\n🎯 Exercise templates are now available for the program customizer!');

  } catch (error) {
    console.error('❌ Error seeding exercise templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExerciseTemplates();