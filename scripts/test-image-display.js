/**
 * Test script to manually add image URL to an exercise
 * This helps verify that the display logic works correctly
 * Run with: node test-image-display.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Image Display by Adding Image URL to Exercise...\n');

  try {
    // The existing uploaded image in Supabase storage
    const testImageUrl = 'https://kbxqoaeytmuabopwlngy.supabase.co/storage/v1/object/public/exercise-images/exercises/1759830735793-gbww5w.jpeg';
    
    // Get first 5 exercises
    const exercises = await prisma.exercise.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        imageUrl: true
      }
    });

    if (exercises.length === 0) {
      console.error('❌ No exercises found in database!');
      return;
    }

    console.log('📋 Available exercises (first 5):\n');
    exercises.forEach((ex, idx) => {
      console.log(`   ${idx + 1}. ${ex.name} ${ex.imageUrl ? '(already has image)' : ''}`);
    });

    // Update the first exercise that doesn't have an image
    const exerciseToUpdate = exercises.find(ex => !ex.imageUrl) || exercises[0];

    console.log(`\n🎯 Updating exercise: "${exerciseToUpdate.name}"\n`);

    const updated = await prisma.exercise.update({
      where: { id: exerciseToUpdate.id },
      data: {
        imageUrl: testImageUrl,
        imageType: 'image/jpeg'
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        imageType: true
      }
    });

    console.log('✅ Success! Exercise updated:\n');
    console.log(`   Name: ${updated.name}`);
    console.log(`   Image URL: ${updated.imageUrl}`);
    console.log(`   Image Type: ${updated.imageType}\n`);

    console.log('🎨 Next steps:');
    console.log('1. Refresh your Exercise Management page');
    console.log('2. Look for the exercise: "' + updated.name + '"');
    console.log('3. You should see the image in the table!\n');

    console.log('📝 If the image displays correctly:');
    console.log('   ✅ Display logic is working');
    console.log('   ✅ Problem is only in the upload-to-database flow');
    console.log('   ✅ We need to debug the form submission process\n');

    // Count exercises with images now
    const withImagesCount = await prisma.exercise.count({
      where: {
        imageUrl: { not: null }
      }
    });

    console.log(`📊 Total exercises with images: ${withImagesCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P2025') {
      console.error('   Exercise not found!\n');
    } else {
      console.error('   Full error:', error);
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
