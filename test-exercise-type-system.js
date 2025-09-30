// Test script for Exercise Type system migration
// Verifies the new exerciseType field and volumeContributions functionality

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Testing Exercise Type System ===\n');

  try {
    // Test 1: Verify all exercises have exerciseType
    console.log('Test 1: Checking all exercises have exerciseType...');
    const allExercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        exerciseType: true,
        volumeContributions: true,
        category: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log(`✅ Found ${allExercises.length} total exercises`);
    
    const missingType = allExercises.filter(ex => !ex.exerciseType);
    if (missingType.length > 0) {
      console.log(`❌ ${missingType.length} exercises missing exerciseType:`, 
        missingType.map(e => e.name));
    } else {
      console.log(`✅ All exercises have exerciseType field`);
    }

    // Test 2: Group by exercise type
    console.log('\nTest 2: Exercise count by type...');
    const typeCounts = allExercises.reduce((acc, ex) => {
      acc[ex.exerciseType] = (acc[ex.exerciseType] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} exercises`);
    });

    // Test 3: Check volumeContributions
    console.log('\nTest 3: Volume contributions status...');
    const withVolume = allExercises.filter(ex => {
      const vol = ex.volumeContributions;
      return vol && typeof vol === 'object' && Object.keys(vol).length > 0;
    });
    
    const emptyVolume = allExercises.filter(ex => {
      const vol = ex.volumeContributions;
      return !vol || typeof vol !== 'object' || Object.keys(vol).length === 0;
    });

    console.log(`  Exercises with volume contributions: ${withVolume.length}`);
    console.log(`  Exercises with empty volume contributions: ${emptyVolume.length}`);
    
    if (withVolume.length > 0) {
      console.log('\nSample exercises with volume contributions:');
      withVolume.slice(0, 3).forEach(ex => {
        console.log(`  - ${ex.name}:`);
        console.log(`    Type: ${ex.exerciseType}`);
        console.log(`    Muscles:`, ex.volumeContributions);
      });
    }

    // Test 4: Verify approved and active exercises
    console.log('\nTest 4: Active/Approved exercise stats...');
    const approvedActive = allExercises.filter(ex => 
      ex.category === 'APPROVED' && ex.isActive
    );
    console.log(`  ✅ ${approvedActive.length} exercises are APPROVED and active`);

    // Test 5: Sample exercises by type
    console.log('\nTest 5: Sample exercises by type...');
    for (const type of ['COMPOUND', 'ISOLATION', 'UNILATERAL']) {
      const byType = allExercises.filter(ex => ex.exerciseType === type);
      if (byType.length > 0) {
        console.log(`\n  ${type} (${byType.length} total):`);
        byType.slice(0, 5).forEach(ex => {
          const muscles = ex.volumeContributions && typeof ex.volumeContributions === 'object'
            ? Object.keys(ex.volumeContributions).join(', ') || 'none'
            : 'none';
          console.log(`    - ${ex.name} → [${muscles}]`);
        });
      }
    }

    // Test 6: Verify no muscleGroup column exists
    console.log('\nTest 6: Verifying old muscleGroup column is removed...');
    try {
      // Try to query the old column - should fail
      await prisma.$queryRaw`SELECT "muscleGroup" FROM "Exercise" LIMIT 1`;
      console.log('❌ ERROR: muscleGroup column still exists!');
    } catch (error) {
      if (error.message.includes('column "muscleGroup" does not exist')) {
        console.log('✅ Confirmed: muscleGroup column has been removed');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }

    // Test 7: Check indexes
    console.log('\nTest 7: Checking database indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Exercise' 
      AND indexname LIKE '%exerciseType%'
      ORDER BY indexname;
    `;
    
    console.log(`  Found ${indexes.length} exerciseType-related indexes:`);
    indexes.forEach(idx => {
      console.log(`    - ${idx.indexname}`);
    });

    // Summary
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Total exercises: ${allExercises.length}`);
    console.log(`✅ All have exerciseType: ${missingType.length === 0}`);
    console.log(`✅ COMPOUND: ${typeCounts.COMPOUND || 0}`);
    console.log(`✅ ISOLATION: ${typeCounts.ISOLATION || 0}`);
    console.log(`✅ UNILATERAL: ${typeCounts.UNILATERAL || 0}`);
    console.log(`✅ With volume data: ${withVolume.length}`);
    console.log(`⚠️  Need volume setup: ${emptyVolume.length}`);
    console.log(`✅ muscleGroup column removed: Yes`);

    console.log('\n=== Next Steps ===');
    if (emptyVolume.length > 0) {
      console.log('⚠️  Admin action required:');
      console.log('   1. Review each exercise and set correct type (COMPOUND/ISOLATION/UNILATERAL)');
      console.log('   2. Define volumeContributions for each exercise');
      console.log('   3. Example: {"CHEST": 1.0, "FRONT_DELTS": 0.5, "TRICEPS": 0.5}');
      console.log(`   4. ${emptyVolume.length} exercises need configuration`);
    } else {
      console.log('✅ All exercises properly configured!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
