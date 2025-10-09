/**
 * Exercise Volume Tracking Demo Script
 * 
 * This script demonstrates the new volume tracking feature for exercises.
 * Run this script to see how volume contributions work.
 */

const { PrismaClient } = require('@prisma/client');

async function demoVolumeTracking() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏋️  Exercise Volume Tracking Demo\n');

    // Example 1: Chest Press Machine
    const chestPressVolume = {
      MIDDLE_CHEST: 1.0,           // Direct chest volume
      FRONT_DELTS: 0.5,            // Indirect front deltoid volume  
      TRICEPS_MEDIAL_HEAD: 0.5,    // Indirect tricep medial head volume
      TRICEPS_LATERAL_HEAD: 0.5    // Indirect tricep lateral head volume
    };

    console.log('📋 Example: Chest Press Machine Volume Contributions:');
    Object.entries(chestPressVolume).forEach(([muscle, volume]) => {
      const type = volume === 1.0 ? 'Direct' : 'Indirect';
      console.log(`   ${muscle}: ${volume} (${type})`);
    });

    // Example 2: Lat Pulldown
    const latPulldownVolume = {
      UPPER_LATS: 0.5,             // Indirect upper lat volume
      MIDDLE_LATS: 1.0,            // Direct middle lat volume
      LOWER_LATS: 0.5,             // Indirect lower lat volume
      RHOMBOIDS: 0.5,              // Indirect rhomboid volume
      TRAPEZIUS: 0.5,              // Indirect trapezius volume
      REAR_DELTS: 0.5,             // Indirect rear deltoid volume
      BICEPS: 0.5                  // Indirect bicep volume
    };

    console.log('\n📋 Example: Lat Pulldown Volume Contributions:');
    Object.entries(latPulldownVolume).forEach(([muscle, volume]) => {
      const type = volume === 1.0 ? 'Direct' : 'Indirect';
      console.log(`   ${muscle}: ${volume} (${type})`);
    });

    // Example 3: Squat
    const squatVolume = {
      RECTUS_FEMORIS: 1.0,         // Direct quad volume
      VASTUS_LATERALIS: 1.0,       // Direct quad volume
      VASTUS_MEDIALIS: 1.0,        // Direct quad volume
      VASTUS_INTERMEDIUS: 1.0,     // Direct quad volume
      GLUTEUS_MAXIMUS: 1.0,        // Direct glute volume
      HAMSTRINGS: 0.5,             // Indirect hamstring volume
      ABS: 0.5                     // Indirect core stabilization
    };

    console.log('\n📋 Example: Squat Volume Contributions:');
    Object.entries(squatVolume).forEach(([muscle, volume]) => {
      const type = volume === 1.0 ? 'Direct' : 'Indirect';
      console.log(`   ${muscle}: ${volume} (${type})`);
    });

    console.log('\n✨ Volume Tracking Benefits:');
    console.log('   • Track direct (1.0) vs indirect (0.5) muscle involvement');
    console.log('   • Better program design by understanding total muscle volume');
    console.log('   • More precise hypertrophy recommendations');
    console.log('   • AI can optimize muscle group distribution across workouts');

    console.log('\n🎯 How to Use in Admin Dashboard:');
    console.log('   1. Go to /admin/exercises');
    console.log('   2. Create or edit an exercise');
    console.log('   3. Set volume contributions using the dropdown selects');
    console.log('   4. Use preset buttons for common exercises');
    console.log('   5. View volume contributions in the exercises table');

    console.log('\n✅ Volume tracking feature is now ready to use!');
    
  } catch (error) {
    console.error('❌ Error running demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
demoVolumeTracking().catch(console.error);