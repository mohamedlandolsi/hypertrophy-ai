const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Same mapping as in the component
const muscleGroupMapping = {
  // Chest
  'chest': ['CHEST'],
  
  // Back
  'back': ['BACK'],
  
  // Shoulders - map all shoulder subdivisions to SHOULDERS
  'shoulders': ['SHOULDERS'],
  'side_delts': ['SHOULDERS'],
  'front_delts': ['SHOULDERS'],
  'rear_delts': ['SHOULDERS'],
  
  // Arms - map to specific muscle groups
  'arms': ['BICEPS', 'TRICEPS'], // Generic arms maps to both
  'elbow_flexors': ['BICEPS'], // Biceps, brachialis, brachioradialis
  'triceps': ['TRICEPS'],
  'forearms': ['FOREARMS'],
  
  // Core/Abs
  'core': ['ABS'],
  'abs': ['ABS'],
  'obliques': ['ABS'], // Map obliques to ABS since that's the closest match
  
  // Legs - map to specific leg muscle groups
  'legs': ['GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES'], // Generic legs maps to all leg muscles
  'glutes': ['GLUTES'],
  'quadriceps': ['QUADRICEPS'],
  'hamstrings': ['HAMSTRINGS'],
  'adductors': ['ADDUCTORS'],
  'calves': ['CALVES'],
  
  // Additional mappings
  'hip_flexors': ['GLUTES'], // Map to closest available muscle group
  'erectors': ['BACK'], // Map erectors to back since they're back muscles
};

function getExerciseMuscleGroups(workoutMuscleGroup) {
  const lowerCaseGroup = workoutMuscleGroup.toLowerCase();
  return muscleGroupMapping[lowerCaseGroup] || [];
}

async function testMuscleGroupMapping() {
  try {
    console.log('🔍 Testing muscle group mapping...\n');

    // Get the program workout templates
    const program = await prisma.trainingProgram.findFirst({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!program) {
      console.log('❌ No active programs found');
      return;
    }

    const programName = typeof program.name === 'object' && program.name !== null 
      ? program.name.en || Object.values(program.name)[0] 
      : 'Unnamed Program';

    console.log(`📋 Program: ${programName}\n`);

    for (const template of program.workoutTemplates) {
      const templateName = typeof template.name === 'object' && template.name !== null
        ? template.name.en || Object.values(template.name)[0]
        : `Workout ${template.order}`;

      console.log(`💪 Template: ${templateName}`);
      console.log(`   Required Muscle Groups: ${template.requiredMuscleGroups.join(', ')}\n`);

      for (const workoutMuscleGroup of template.requiredMuscleGroups) {
        console.log(`   🎯 Workout Muscle Group: ${workoutMuscleGroup}`);
        
        // Get mapped exercise muscle groups
        const exerciseMuscleGroups = getExerciseMuscleGroups(workoutMuscleGroup);
        console.log(`      Mapped to Exercise Groups: ${exerciseMuscleGroups.join(', ')}`);
        
        if (exerciseMuscleGroups.length === 0) {
          console.log('      ⚠️  No mapping found!');
          continue;
        }

        // Test fetching exercises for each mapped muscle group
        let totalExercises = 0;
        const exerciseNames = [];
        
        for (const exerciseMuscleGroup of exerciseMuscleGroups) {
          const exercises = await prisma.exercise.findMany({
            where: {
              muscleGroup: exerciseMuscleGroup,
              isActive: true,
              category: 'APPROVED',
            },
            select: {
              id: true,
              name: true,
              muscleGroup: true,
            },
            orderBy: { name: 'asc' },
          });

          totalExercises += exercises.length;
          exerciseNames.push(...exercises.slice(0, 2).map(ex => ex.name)); // Sample first 2
        }

        console.log(`      Total Exercises Found: ${totalExercises}`);
        if (exerciseNames.length > 0) {
          console.log(`      Sample Exercises: ${exerciseNames.join(', ')}${exerciseNames.length >= 4 ? '...' : ''}`);
        } else {
          console.log('      ⚠️  No exercises found!');
        }
        console.log('');
      }
      console.log('='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('❌ Error testing muscle group mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMuscleGroupMapping();