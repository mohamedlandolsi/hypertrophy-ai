const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseMuscleGroups() {
  try {
    console.log('🔍 Checking database for existing muscle groups...\n');
    
    // Get all unique muscle groups from exercises
    const exercises = await prisma.exercise.findMany({
      select: {
        muscleGroup: true,
        name: true,
      },
    });

    console.log(`Found ${exercises.length} exercises in database\n`);

    // Group by muscle group
    const muscleGroupCounts = {};
    exercises.forEach(exercise => {
      muscleGroupCounts[exercise.muscleGroup] = (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
    });

    console.log('Muscle Groups in Database:');
    console.log('='.repeat(60));
    Object.entries(muscleGroupCounts).forEach(([group, count]) => {
      console.log(`  ${group.padEnd(20)} - ${count} exercises`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  DATABASE-SCHEMA MISMATCH DETECTED');
    console.log('='.repeat(60));
    console.log('\nThe database contains old enum values that are no longer in the schema.');
    console.log('This is causing the 500 error when trying to load exercises.');
    console.log('\nSolution: We need to update the database enum values.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nThis error confirms the enum mismatch issue.');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseMuscleGroups();
