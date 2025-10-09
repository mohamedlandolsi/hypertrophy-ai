/**
 * Debug script to check exercise image fields and data
 * Run with: node debug-exercise-images.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🔍 Checking Exercise Image Fields...\n');

  try {
    // Check if we can query the fields
    console.log('1️⃣ Testing database schema...');
    const exercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        imageType: true,
      },
      take: 5,
    });

    console.log('✅ Schema check passed! Fields exist in database.\n');

    // Count exercises with images
    const totalExercises = await prisma.exercise.count();
    const exercisesWithImages = await prisma.exercise.count({
      where: {
        imageUrl: {
          not: null,
        },
      },
    });

    console.log(`📊 Statistics:`);
    console.log(`   Total exercises: ${totalExercises}`);
    console.log(`   Exercises with images: ${exercisesWithImages}`);
    console.log(`   Exercises without images: ${totalExercises - exercisesWithImages}\n`);

    // Show sample exercises
    if (exercises.length > 0) {
      console.log('📋 Sample exercises (first 5):');
      exercises.forEach((ex, idx) => {
        console.log(`   ${idx + 1}. ${ex.name}`);
        console.log(`      - imageUrl: ${ex.imageUrl || '(null)'}`);
        console.log(`      - imageType: ${ex.imageType || '(null)'}`);
      });
    } else {
      console.log('⚠️  No exercises found in database!');
    }

    // If there are exercises with images, show them
    if (exercisesWithImages > 0) {
      console.log('\n🖼️  Exercises WITH images:');
      const withImages = await prisma.exercise.findMany({
        where: {
          imageUrl: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          imageType: true,
        },
        take: 10,
      });

      withImages.forEach((ex, idx) => {
        console.log(`   ${idx + 1}. ${ex.name}`);
        console.log(`      URL: ${ex.imageUrl}`);
        console.log(`      Type: ${ex.imageType}`);
      });
    } else {
      console.log('\n⚠️  No exercises have images uploaded yet.');
      console.log('   To test the feature:');
      console.log('   1. Go to Admin > Exercise Management');
      console.log('   2. Create or edit an exercise');
      console.log('   3. Upload an image');
      console.log('   4. Run this script again\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Unknown field')) {
      console.error('\n🔧 Solution: The database migration has not been applied!');
      console.error('   Run this SQL on your database:');
      console.error('   File: add-exercise-image-fields.sql\n');
    } else if (error.code === 'P2021') {
      console.error('\n🔧 Solution: The table does not exist!');
      console.error('   Run: npx prisma migrate dev\n');
    } else {
      console.error('\n🔧 Check your database connection and schema.\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
