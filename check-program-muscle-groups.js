const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgramWorkoutTemplates() {
  try {
    console.log('🔍 Checking training programs and their workout templates...\n');

    const programs = await prisma.trainingProgram.findMany({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log(`Found ${programs.length} active training programs:\n`);

    for (const program of programs) {
      const programName = typeof program.name === 'object' && program.name !== null 
        ? program.name.en || Object.values(program.name)[0] 
        : 'Unnamed Program';

      console.log(`📋 Program: ${programName} (ID: ${program.id})`);
      console.log(`   Workout Templates: ${program.workoutTemplates.length}`);
      
      if (program.workoutTemplates.length === 0) {
        console.log('   ⚠️  No workout templates found\n');
        continue;
      }

      for (const template of program.workoutTemplates) {
        const templateName = typeof template.name === 'object' && template.name !== null
          ? template.name.en || Object.values(template.name)[0]
          : `Workout ${template.order}`;

        console.log(`   💪 ${templateName} (Order: ${template.order})`);
        console.log(`      Required Muscle Groups: ${template.requiredMuscleGroups.length > 0 ? template.requiredMuscleGroups.join(', ') : 'None set'}`);
        
        if (template.requiredMuscleGroups.length === 0) {
          console.log('      ⚠️  No muscle groups configured for this workout');
        }
      }
      console.log('');
    }

    // Check for muscle group patterns
    const allMuscleGroups = programs
      .flatMap(p => p.workoutTemplates)
      .flatMap(wt => wt.requiredMuscleGroups);

    const uniqueMuscleGroups = [...new Set(allMuscleGroups)];
    
    console.log('📊 Summary:');
    console.log(`   Unique muscle groups used: ${uniqueMuscleGroups.length}`);
    if (uniqueMuscleGroups.length > 0) {
      console.log(`   Muscle groups: ${uniqueMuscleGroups.join(', ')}`);
    } else {
      console.log('   ⚠️  No muscle groups found in any workout templates!');
    }

  } catch (error) {
    console.error('❌ Error checking programs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgramWorkoutTemplates();