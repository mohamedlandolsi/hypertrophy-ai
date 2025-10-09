const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramCustomizerData() {
  try {
    console.log('🔍 Testing program customizer data flow...\n');

    // Get the program as the customizer would
    const program = await prisma.trainingProgram.findFirst({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
        programStructures: {
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

    console.log(`📋 Program: ${programName}`);
    console.log(`   ID: ${program.id}`);
    console.log(`   Workout Templates: ${program.workoutTemplates.length}\n`);

    // Test what the customizer sees
    for (const template of program.workoutTemplates) {
      const templateName = typeof template.name === 'object' && template.name !== null
        ? template.name.en || Object.values(template.name)[0]
        : `Workout ${template.order}`;

      console.log(`💪 Template: ${templateName}`);
      console.log(`   Required Muscle Groups: ${JSON.stringify(template.requiredMuscleGroups)}`);
      console.log(`   Count: ${template.requiredMuscleGroups.length}`);
      
      // Test exercise fetching for each muscle group
      for (const muscleGroup of template.requiredMuscleGroups) {
        console.log(`\n   🔍 Testing exercises for muscle group: ${muscleGroup}`);
        
        // This simulates the API call the customizer makes
        const exercises = await prisma.exercise.findMany({
          where: {
            muscleGroup: muscleGroup.toUpperCase(),
            isActive: true,
            category: 'APPROVED',
          },
          select: {
            id: true,
            name: true,
            muscleGroup: true,
            equipment: true,
            difficulty: true,
          },
          orderBy: { name: 'asc' },
        });

        console.log(`      Found ${exercises.length} exercises`);
        if (exercises.length > 0) {
          console.log(`      Sample: ${exercises.slice(0, 3).map(ex => ex.name).join(', ')}`);
        } else {
          console.log(`      ⚠️  No exercises found for muscle group: ${muscleGroup}`);
          
          // Let's check if the muscle group name format is causing issues
          const allMuscleGroups = await prisma.exercise.findMany({
            select: { muscleGroup: true },
            distinct: ['muscleGroup'],
          });
          
          console.log(`      Available muscle groups in DB: ${allMuscleGroups.map(mg => mg.muscleGroup).join(', ')}`);
        }
      }
      console.log('\n' + '='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('❌ Error testing program customizer data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgramCustomizerData();