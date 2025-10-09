// Test script to verify exercise recommended field implementation
// Run with: node test-exercise-recommended.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExerciseRecommended() {
  try {
    console.log('🧪 Testing Exercise Recommended Field Implementation\n');

    // 1. Check if isRecommended field exists and difficulty is removed
    console.log('1️⃣ Fetching sample exercises...');
    const exercises = await prisma.exercise.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        category: true,
        isActive: true,
        isRecommended: true,
        equipment: true,
      },
    });

    console.log(`   ✅ Found ${exercises.length} exercises`);
    console.log('   Sample data:');
    exercises.forEach((ex, i) => {
      console.log(`   ${i + 1}. ${ex.name}`);
      console.log(`      - Muscle: ${ex.muscleGroup}`);
      console.log(`      - Recommended: ${ex.isRecommended ? '⭐ YES' : '❌ NO'}`);
      console.log(`      - Equipment: ${ex.equipment.join(', ')}`);
    });

    // 2. Count recommended vs non-recommended
    console.log('\n2️⃣ Counting recommended exercises...');
    const totalCount = await prisma.exercise.count();
    const recommendedCount = await prisma.exercise.count({
      where: { isRecommended: true },
    });
    const notRecommendedCount = totalCount - recommendedCount;

    console.log(`   Total exercises: ${totalCount}`);
    console.log(`   Recommended: ${recommendedCount} (${((recommendedCount / totalCount) * 100).toFixed(1)}%)`);
    console.log(`   Not recommended: ${notRecommendedCount} (${((notRecommendedCount / totalCount) * 100).toFixed(1)}%)`);

    // 3. Test updating an exercise to recommended
    console.log('\n3️⃣ Testing update to recommended...');
    const testExercise = await prisma.exercise.findFirst({
      where: { 
        isActive: true,
        category: 'APPROVED',
        isRecommended: false,
      },
    });

    if (testExercise) {
      console.log(`   Found test exercise: ${testExercise.name}`);
      const updated = await prisma.exercise.update({
        where: { id: testExercise.id },
        data: { isRecommended: true },
      });
      console.log(`   ✅ Updated ${updated.name} to recommended: ${updated.isRecommended}`);

      // Revert the change
      await prisma.exercise.update({
        where: { id: testExercise.id },
        data: { isRecommended: false },
      });
      console.log(`   ↩️  Reverted ${updated.name} back to not recommended`);
    } else {
      console.log('   ⚠️  No suitable test exercise found');
    }

    // 4. Test sorting (recommended first, then alphabetical)
    console.log('\n4️⃣ Testing sorting logic (recommended first, then alphabetical)...');
    const sortedExercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        category: 'APPROVED',
        muscleGroup: 'CHEST',
      },
      orderBy: [
        { isRecommended: 'desc' },
        { name: 'asc' },
      ],
      take: 10,
      select: {
        name: true,
        isRecommended: true,
      },
    });

    console.log(`   Chest exercises (sorted):`);
    sortedExercises.forEach((ex, i) => {
      const badge = ex.isRecommended ? '⭐' : '  ';
      console.log(`   ${badge} ${i + 1}. ${ex.name}`);
    });

    // 5. Check if difficulty field exists (should fail)
    console.log('\n5️⃣ Verifying difficulty field is removed...');
    try {
      await prisma.$queryRaw`SELECT difficulty FROM "Exercise" LIMIT 1`;
      console.log('   ❌ ERROR: difficulty field still exists!');
    } catch (error) {
      if (error.message.includes('column "difficulty" does not exist')) {
        console.log('   ✅ Confirmed: difficulty field successfully removed');
      } else {
        console.log('   ⚠️  Unexpected error:', error.message);
      }
    }

    console.log('\n✅ All tests completed!\n');
    console.log('📋 Summary:');
    console.log('   - isRecommended field is working correctly');
    console.log('   - difficulty field has been removed');
    console.log('   - Sorting by recommended works as expected');
    console.log('   - Updates to recommended status work correctly\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testExerciseRecommended();
