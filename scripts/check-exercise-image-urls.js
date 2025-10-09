/**
 * Check if any exercises have image URLs and what they look like
 * Run with: node check-exercise-image-urls.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Exercise Image URLs...\n');

  try {
    // Get all exercises with image URLs
    const exercisesWithImages = await prisma.exercise.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        imageType: true,
      }
    });

    if (exercisesWithImages.length === 0) {
      console.log('⚠️  No exercises have imageUrl set in the database!');
      console.log('\nPossible reasons:');
      console.log('1. Images were uploaded but not saved to database');
      console.log('2. Upload API failed silently');
      console.log('3. Form submission didn\'t include image data\n');
      
      // Check if there are any exercises at all
      const totalCount = await prisma.exercise.count();
      console.log(`Total exercises in database: ${totalCount}\n`);
      
      console.log('🔧 Next steps:');
      console.log('1. Try uploading an image in Exercise Management page');
      console.log('2. Check browser console for errors');
      console.log('3. Check network tab for API responses');
      console.log('4. Run this script again after upload\n');
      
      return;
    }

    console.log(`✅ Found ${exercisesWithImages.length} exercise(s) with images:\n`);

    exercisesWithImages.forEach((ex, idx) => {
      console.log(`${idx + 1}. ${ex.name}`);
      console.log(`   ID: ${ex.id}`);
      console.log(`   Image URL: ${ex.imageUrl}`);
      console.log(`   Image Type: ${ex.imageType}`);
      console.log(`   URL starts with: ${ex.imageUrl?.substring(0, 50)}...`);
      console.log('');
    });

    // Check if URLs are properly formatted
    const hasProperUrls = exercisesWithImages.every(ex => 
      ex.imageUrl?.startsWith('http') || ex.imageUrl?.startsWith('/')
    );

    if (hasProperUrls) {
      console.log('✅ All image URLs appear to be properly formatted\n');
    } else {
      console.error('⚠️  Some image URLs may not be valid URLs!\n');
    }

    // Check if they match the expected Supabase storage pattern
    const supabasePattern = /supabase\.co\/storage\/v1\/object\/public/;
    const hasSupabaseUrls = exercisesWithImages.some(ex => 
      supabasePattern.test(ex.imageUrl || '')
    );

    if (hasSupabaseUrls) {
      console.log('✅ URLs match Supabase storage pattern\n');
    } else {
      console.log('⚠️  URLs don\'t match expected Supabase storage pattern');
      console.log('   Expected: https://[project].supabase.co/storage/v1/object/public/exercise-images/...\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
