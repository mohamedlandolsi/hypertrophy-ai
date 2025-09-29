const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExerciseTableOnly() {
  try {
    console.log('🔍 Checking Exercise table...\n');

    // Check exercise table
    const exercises = await prisma.exercise.findMany();
    console.log(`📋 Exercises in database: ${exercises.length}`);
    
    if (exercises.length > 0) {
      console.log('First few exercises:');
      exercises.slice(0, 5).forEach(exercise => {
        console.log(`  - ${exercise.name} (${exercise.muscleGroup}) - ${exercise.category}`);
      });

      // Group by muscle group
      const byMuscleGroup = exercises.reduce((acc, ex) => {
        acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Exercises by muscle group:');
      Object.entries(byMuscleGroup).forEach(([muscle, count]) => {
        console.log(`  ${muscle}: ${count} exercises`);
      });

      // Check approved and active
      const approved = exercises.filter(ex => ex.category === 'APPROVED' && ex.isActive);
      console.log(`\n✅ Approved and active exercises: ${approved.length}`);
    } else {
      console.log('❌ No exercises found in database');
      console.log('💡 You may need to run the seed script: node seed-exercises.js');
    }

  } catch (error) {
    console.error('❌ Error checking exercise data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExerciseTableOnly();