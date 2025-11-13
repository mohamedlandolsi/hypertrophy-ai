/**
 * Check Program Data Script
 * 
 * Verifies that training splits and program templates exist in the database
 * and are properly configured for the program creation wizard.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgramData() {
  console.log('\n🔍 Checking Program Data...\n');

  try {
    // Check Training Splits
    console.log('📊 Checking Training Splits...');
    const splits = await prisma.trainingSplit.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            trainingStructures: true
          }
        }
      }
    });

    console.log(`   ✅ Found ${splits.length} active training splits:`);
    splits.forEach(split => {
      console.log(`      - ${split.name} (${split.difficulty}) - ${split._count.trainingStructures} structures`);
    });

    if (splits.length === 0) {
      console.log('   ⚠️  WARNING: No active training splits found!');
      console.log('   💡 Run: npx prisma db seed');
    }

    // Check Training Structures
    console.log('\n📅 Checking Training Structures...');
    const structures = await prisma.trainingSplitStructure.findMany({
      include: {
        trainingSplit: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            trainingDayAssignments: true
          }
        }
      }
    });

    console.log(`   ✅ Found ${structures.length} training structures:`);
    structures.forEach(structure => {
      console.log(`      - ${structure.trainingSplit.name} (${structure.daysPerWeek} days) - ${structure._count.trainingDayAssignments} day assignments`);
    });

    if (structures.length === 0) {
      console.log('   ⚠️  WARNING: No training structures found!');
      console.log('   💡 Run: npx prisma db seed');
    }

    // Check Program Templates
    console.log('\n📋 Checking Program Templates...');
    const templates = await prisma.programTemplate.findMany({
      where: { isActive: true },
      include: {
        trainingSplit: {
          select: {
            name: true
          }
        },
        splitStructure: {
          select: {
            daysPerWeek: true
          }
        },
        _count: {
          select: {
            templateWorkouts: true,
            trainingPrograms: true
          }
        }
      }
    });

    console.log(`   ✅ Found ${templates.length} active program templates:`);
    templates.forEach(template => {
      console.log(`      - ${template.name} (${template.difficultyLevel})`);
      console.log(`        Split: ${template.trainingSplit.name} (${template.splitStructure.daysPerWeek} days)`);
      console.log(`        Workouts: ${template._count.templateWorkouts}, Used: ${template._count.trainingPrograms} times`);
    });

    if (templates.length === 0) {
      console.log('   ⚠️  WARNING: No active program templates found!');
      console.log('   💡 Run: node scripts/seed-program-templates.js');
    }

    // Check Exercises
    console.log('\n💪 Checking Exercises...');
    const exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        exerciseType: true
      },
      take: 10
    });

    console.log(`   ✅ Found ${exercises.length > 0 ? 'exercises' : 'NO exercises'} (showing first 10):`);
    exercises.slice(0, 10).forEach(exercise => {
      console.log(`      - ${exercise.name} (${exercise.category}, ${exercise.exerciseType})`);
    });

    if (exercises.length === 0) {
      console.log('   ⚠️  WARNING: No exercises found!');
      console.log('   💡 Add exercises via Admin Dashboard > Exercises');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Training Splits:       ${splits.length > 0 ? '✅' : '❌'} (${splits.length} found)`);
    console.log(`Training Structures:   ${structures.length > 0 ? '✅' : '❌'} (${structures.length} found)`);
    console.log(`Program Templates:     ${templates.length > 0 ? '✅' : '❌'} (${templates.length} found)`);
    console.log(`Exercises:             ${exercises.length > 0 ? '✅' : '❌'} (${exercises.length} found)`);
    console.log('='.repeat(60));

    if (splits.length === 0 || structures.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Run: npx prisma db seed');
    }

    if (templates.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Run: node scripts/seed-program-templates.js');
    }

    if (exercises.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Add exercises via Admin Dashboard > Exercises');
      console.log('   Or import from a CSV/JSON file');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error checking program data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgramData();
