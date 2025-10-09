const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugProgramExercises() {
  try {
    console.log('🔍 Debugging Program Exercise Templates...\n');

    // Get all training programs
    const programs = await prisma.trainingProgram.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            exerciseTemplates: true,
            workoutTemplates: true,
            programStructures: true
          }
        }
      }
    });

    console.log(`📊 Found ${programs.length} training programs:`);
    programs.forEach(program => {
      const name = typeof program.name === 'object' ? program.name.en || program.name.ar || JSON.stringify(program.name) : program.name;
      console.log(`  - ${name} (${program.id})`);
      console.log(`    Active: ${program.isActive}`);
      console.log(`    Exercise Templates: ${program._count.exerciseTemplates}`);
      console.log(`    Workout Templates: ${program._count.workoutTemplates}`);
      console.log(`    Structures: ${program._count.programStructures}`);
      console.log('');
    });

    // Focus on the first active program with exercise templates
    const activeProgram = programs.find(p => p.isActive && p._count.exerciseTemplates > 0);
    
    if (!activeProgram) {
      console.log('❌ No active programs with exercise templates found');
      return;
    }

    console.log(`🎯 Focusing on program: ${typeof activeProgram.name === 'object' ? activeProgram.name.en || activeProgram.name.ar : activeProgram.name}`);
    console.log(`Program ID: ${activeProgram.id}\n`);

    // Get detailed program data with exercise templates
    const detailedProgram = await prisma.trainingProgram.findUnique({
      where: { id: activeProgram.id },
      include: {
        exerciseTemplates: {
          orderBy: { priority: 'asc' }
        },
        workoutTemplates: {
          orderBy: { order: 'asc' }
        },
        programStructures: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!detailedProgram) {
      console.log('❌ Program not found');
      return;
    }

    console.log('📋 Exercise Templates:');
    console.log(`Total: ${detailedProgram.exerciseTemplates.length}\n`);

    // Group by muscle group and category type
    const groupedExercises = {};
    detailedProgram.exerciseTemplates.forEach(exercise => {
      const key = `${exercise.muscleGroup}_${exercise.categoryType}`;
      if (!groupedExercises[key]) {
        groupedExercises[key] = [];
      }
      groupedExercises[key].push(exercise);
    });

    console.log('🏋️ Exercises by Muscle Group and Category:');
    Object.keys(groupedExercises).sort().forEach(key => {
      const [muscleGroup, categoryType] = key.split('_');
      const exercises = groupedExercises[key];
      
      console.log(`\n${muscleGroup.toUpperCase()} - ${categoryType}:`);
      exercises.forEach(exercise => {
        console.log(`  - ID: ${exercise.id}`);
        console.log(`    Type: ${exercise.exerciseType}`);
        console.log(`    Priority: ${exercise.priority}`);
        console.log(`    Volume: ${JSON.stringify(exercise.volume)}`);
        console.log(`    Alternatives: ${exercise.alternatives.length > 0 ? exercise.alternatives.join(', ') : 'None'}`);
        console.log('');
      });
    });

    console.log('📊 Summary by Category Type:');
    ['MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST'].forEach(category => {
      const categoryExercises = detailedProgram.exerciseTemplates.filter(ex => ex.categoryType === category);
      console.log(`\n${category}: ${categoryExercises.length} exercises`);
      
      const muscleGroups = [...new Set(categoryExercises.map(ex => ex.muscleGroup))];
      muscleGroups.forEach(muscle => {
        const muscleExercises = categoryExercises.filter(ex => ex.muscleGroup === muscle);
        console.log(`  ${muscle}: ${muscleExercises.length} exercises`);
      });
    });

    console.log('\n🔧 Workout Templates:');
    detailedProgram.workoutTemplates.forEach(template => {
      console.log(`\nTemplate: ${template.name} (${template.id})`);
      console.log(`Required Muscle Groups: ${template.requiredMuscleGroups.join(', ')}`);
      console.log(`Order: ${template.order}`);
    });

  } catch (error) {
    console.error('❌ Error debugging program exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProgramExercises();