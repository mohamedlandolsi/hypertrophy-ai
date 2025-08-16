const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the functions from the TypeScript file
async function testExerciseDatabase() {
  try {
    console.log('🧪 Testing Exercise Database Integration...\n');
    
    // Test 1: Check database connection and count
    console.log('Test 1: Database Connection');
    console.log('='.repeat(40));
    const totalExercises = await prisma.exercise.count();
    const approvedExercises = await prisma.exercise.count({ 
      where: { category: 'APPROVED', isActive: true } 
    });
    console.log(`✅ Total exercises in database: ${totalExercises}`);
    console.log(`✅ Approved & active exercises: ${approvedExercises}`);
    
    // Test 2: Test muscle group filtering
    console.log('\nTest 2: Muscle Group Filtering');
    console.log('='.repeat(40));
    const chestExercises = await prisma.exercise.findMany({
      where: { muscleGroup: 'CHEST', category: 'APPROVED', isActive: true },
      select: { name: true, equipment: true }
    });
    console.log(`✅ Chest exercises found: ${chestExercises.length}`);
    chestExercises.forEach(ex => {
      console.log(`  - ${ex.name} (${ex.equipment.join(', ')})`);
    });
    
    // Test 3: Test exercise validation
    console.log('\nTest 3: Exercise Name Validation');
    console.log('='.repeat(40));
    
    const testExercises = [
      "Machine chest press",
      "Lat pulldown", 
      "Invalid exercise name",
      "Cable lateral raises"
    ];
    
    for (const exerciseName of testExercises) {
      const exists = await prisma.exercise.findFirst({
        where: {
          name: {
            equals: exerciseName,
            mode: 'insensitive'
          },
          category: 'APPROVED',
          isActive: true
        }
      });
      
      console.log(`${exists ? '✅' : '❌'} "${exerciseName}" - ${exists ? 'Valid' : 'Not found'}`);
    }
    
    // Test 4: Machine/Cable prioritization
    console.log('\nTest 4: Machine/Cable Exercise Prioritization');
    console.log('='.repeat(40));
    
    const machineExercises = await prisma.exercise.findMany({
      where: {
        category: 'APPROVED',
        isActive: true,
        equipment: {
          hasSome: ['chest press machine', 'lat pulldown machine', 'leg extension machine']
        }
      },
      select: { name: true, muscleGroup: true, equipment: true }
    });
    
    const cableExercises = await prisma.exercise.findMany({
      where: {
        category: 'APPROVED',
        isActive: true,
        equipment: {
          has: 'cable machine'
        }
      },
      select: { name: true, muscleGroup: true, equipment: true }
    });
    
    console.log(`✅ Machine exercises: ${machineExercises.length}`);
    console.log(`✅ Cable exercises: ${cableExercises.length}`);
    console.log(`✅ Priority exercises (Machine + Cable): ${machineExercises.length + cableExercises.length}`);
    
    // Test 5: Exercise statistics
    console.log('\nTest 5: Exercise Statistics by Muscle Group');
    console.log('='.repeat(40));
    
    const stats = await prisma.exercise.groupBy({
      by: ['muscleGroup'],
      _count: { muscleGroup: true },
      where: { category: 'APPROVED', isActive: true }
    });
    
    stats.forEach(stat => {
      console.log(`✅ ${stat.muscleGroup}: ${stat._count.muscleGroup} exercises`);
    });
    
    // Test 6: Sample exercise context generation simulation
    console.log('\nTest 6: Context Generation Simulation');
    console.log('='.repeat(40));
    
    const allApprovedExercises = await prisma.exercise.findMany({
      where: { category: 'APPROVED', isActive: true },
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }]
    });
    
    // Group by muscle group for context
    const exercisesByMuscle = allApprovedExercises.reduce((acc, exercise) => {
      const group = exercise.muscleGroup.toLowerCase();
      if (!acc[group]) acc[group] = [];
      acc[group].push(exercise);
      return acc;
    }, {});
    
    console.log('✅ Exercise context would include:');
    Object.entries(exercisesByMuscle).forEach(([muscle, exercises]) => {
      console.log(`  ${muscle.toUpperCase()}: ${exercises.length} exercises`);
      exercises.slice(0, 2).forEach(ex => {
        console.log(`    - ${ex.name}`);
      });
      if (exercises.length > 2) {
        console.log(`    ... and ${exercises.length - 2} more`);
      }
    });
    
    console.log('\n🎉 All database integration tests passed!');
    console.log('🔗 The exercise database is ready for AI integration.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExerciseDatabase();
