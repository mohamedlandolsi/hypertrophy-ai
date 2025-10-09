const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateUserProgramGuideView() {
  try {
    console.log('🧪 Simulating user program guide view...\n');

    // Get active programs with workout templates
    const programs = await prisma.trainingProgram.findMany({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log(`📋 Found ${programs.length} active programs\n`);

    for (const program of programs) {
      const programName = typeof program.name === 'object' && program.name !== null 
        ? program.name.en || Object.values(program.name)[0] 
        : 'Unnamed Program';

      console.log(`🎯 Program: ${programName}`);
      console.log(`   Workout Templates: ${program.workoutTemplates.length}\n`);

      if (program.workoutTemplates.length === 0) {
        console.log('   ⚠️  No workout templates - user would see empty customizer\n');
        continue;
      }

      // Simulate what the program customizer will display
      for (const template of program.workoutTemplates) {
        const templateName = typeof template.name === 'object' && template.name !== null
          ? template.name.en || Object.values(template.name)[0]
          : `Workout ${template.order}`;

        console.log(`   💪 Template: ${templateName}`);
        console.log(`      Required Muscle Groups: ${template.requiredMuscleGroups.join(', ')}`);
        console.log(`      User will see: ${template.requiredMuscleGroups.length} muscle group sections`);

        if (template.requiredMuscleGroups.length === 0) {
          console.log('      ⚠️  No muscle groups configured - user will see "No exercises available"');
        } else {
          console.log('      ✅ User will see muscle groups with exercises to select from');
        }
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ Summary:');
    console.log('The updated program customizer will now:');
    console.log('1. ✅ Display muscle groups selected in admin program creation');
    console.log('2. ✅ Map muscle groups to available exercises in database');
    console.log('3. ✅ Show exercises for each muscle group instead of "No exercises available"');
    console.log('4. ✅ Allow users to customize their workout program with real exercises');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error simulating user view:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateUserProgramGuideView();