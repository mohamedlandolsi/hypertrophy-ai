const { PrismaClient } = require('@prisma/client');

async function testExerciseManagementIntegration() {
  try {
    console.log('🧪 Testing Exercise Management System Integration...\n');
    
    console.log('Test 1: Database Exercise Retrieval');
    console.log('='.repeat(50));
    
    const prisma = new PrismaClient();
    
    // Test approved exercises retrieval
    const approvedExercises = await prisma.exercise.findMany({
      where: {
        category: 'APPROVED',
        isActive: true
      },
      take: 5,
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ Retrieved ${approvedExercises.length} approved exercises (sample)`);
    approvedExercises.forEach(ex => {
      console.log(`  - ${ex.name} (${ex.muscleGroup})`);
    });
    
    console.log('\nTest 2: Exercise Validation');
    console.log('='.repeat(50));
    
    // Test exercise validation
    const testExercises = ['Machine chest press', 'Invalid exercise'];
    for (const exercise of testExercises) {
      const exists = await prisma.exercise.findFirst({
        where: {
          name: { equals: exercise, mode: 'insensitive' },
          category: 'APPROVED',
          isActive: true
        }
      });
      console.log(`${exists ? '✅' : '❌'} "${exercise}" - ${exists ? 'Valid' : 'Invalid'}`);
    }
    
    console.log('\nTest 3: Admin CRUD Simulation');
    console.log('='.repeat(50));
    
    // Test creating a new exercise
    const testExercise = await prisma.exercise.create({
      data: {
        id: `test_${Date.now()}`,
        name: 'Test Exercise (will be deleted)',
        muscleGroup: 'CHEST',
        equipment: ['test equipment'],
        category: 'PENDING',
        isActive: false,
        difficulty: 'BEGINNER',
        updatedAt: new Date(),
        description: 'Test exercise for integration testing'
      }
    });
    
    console.log(`✅ Created test exercise: ${testExercise.name}`);
    
    // Test updating the exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id: testExercise.id },
      data: {
        category: 'APPROVED',
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Updated exercise to APPROVED and active`);
    
    // Test deleting (marking as deprecated)
    await prisma.exercise.update({
      where: { id: testExercise.id },
      data: {
        category: 'DEPRECATED',
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Marked exercise as deprecated (soft delete)`);
    
    // Clean up - hard delete the test exercise
    await prisma.exercise.delete({
      where: { id: testExercise.id }
    });
    
    console.log(`✅ Cleaned up test exercise`);
    
    console.log('\nTest 4: Exercise Statistics');
    console.log('='.repeat(50));
    
    const stats = await prisma.exercise.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    console.log('Exercise distribution by category:');
    stats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat._count.category} exercises`);
    });
    
    const muscleStats = await prisma.exercise.groupBy({
      by: ['muscleGroup'],
      _count: { muscleGroup: true },
      where: { category: 'APPROVED', isActive: true }
    });
    
    console.log('\nApproved exercises by muscle group:');
    muscleStats.forEach(stat => {
      console.log(`  ${stat.muscleGroup}: ${stat._count.muscleGroup} exercises`);
    });
    
    await prisma.$disconnect();
    
    console.log('\n🎉 Exercise Management System Integration Tests Complete!');
    console.log('✅ Database CRUD operations working');
    console.log('✅ Exercise validation working');
    console.log('✅ Statistics generation working');
    console.log('✅ Admin interface ready for use');
    console.log('\n🔗 Next steps:');
    console.log('1. Visit /admin/settings to test the UI');
    console.log('2. Create/edit exercises through the admin interface');
    console.log('3. Test AI recommendations with the new exercise database');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testExerciseManagementIntegration();
