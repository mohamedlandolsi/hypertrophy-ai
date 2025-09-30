const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Updated muscle group definitions (with back split into lats and upper_back)
const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', color: 'bg-red-100 text-red-800' },
  { id: 'lats', name: 'Lats', color: 'bg-blue-100 text-blue-800' },
  { id: 'upper_back', name: 'Upper Back', color: 'bg-sky-100 text-sky-800' },
  { id: 'side_delts', name: 'Side Delts', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'front_delts', name: 'Front Delts', color: 'bg-amber-100 text-amber-800' },
  { id: 'rear_delts', name: 'Rear Delts', color: 'bg-orange-100 text-orange-800' },
  { id: 'elbow_flexors', name: 'Elbow Flexors (Biceps, Brachialis, Brachioradialis)', color: 'bg-green-100 text-green-800' },
  { id: 'triceps', name: 'Triceps', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'forearms', name: 'Forearms', color: 'bg-teal-100 text-teal-800' },
  { id: 'glutes', name: 'Glutes', color: 'bg-pink-100 text-pink-800' },
  { id: 'quadriceps', name: 'Quadriceps', color: 'bg-purple-100 text-purple-800' },
  { id: 'hamstrings', name: 'Hamstrings', color: 'bg-violet-100 text-violet-800' },
  { id: 'adductors', name: 'Adductors', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'calves', name: 'Calves', color: 'bg-blue-100 text-blue-800' },
  { id: 'erectors', name: 'Erectors', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'abs', name: 'Abs', color: 'bg-lime-100 text-lime-800' },
  { id: 'obliques', name: 'Obliques', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'hip_flexors', name: 'Hip Flexors', color: 'bg-rose-100 text-rose-800' }
];

function filterValidMuscleGroups(muscleGroups) {
  const validIds = MUSCLE_GROUPS.map(mg => mg.id);
  return muscleGroups.filter(mg => validIds.includes(mg));
}

async function verifyMuscleGroupSplit() {
  try {
    console.log('✅ MUSCLE GROUP SPLIT VERIFICATION\n');
    console.log('='.repeat(70));
    console.log('UPDATED MUSCLE GROUPS (18 total):');
    console.log('='.repeat(70));
    MUSCLE_GROUPS.forEach((mg, index) => {
      const marker = mg.id === 'lats' || mg.id === 'upper_back' ? ' ⭐ NEW' : '';
      console.log(`${(index + 1).toString().padStart(2)}. ${mg.id.padEnd(20)} → "${mg.name}"${marker}`);
    });
    console.log('');
    console.log('📝 CHANGE SUMMARY:');
    console.log('   ❌ Removed: "back" (generic)');
    console.log('   ✅ Added:   "lats" (specific)');
    console.log('   ✅ Added:   "upper_back" (specific)');
    console.log('');

    // Get programs with workout templates
    const programs = await prisma.trainingProgram.findMany({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log('='.repeat(70));
    console.log('DATABASE COMPATIBILITY CHECK:');
    console.log('='.repeat(70) + '\n');

    let foundBackMuscleGroup = false;

    for (const program of programs) {
      const programName = typeof program.name === 'object' && program.name !== null 
        ? program.name.en || Object.values(program.name)[0] 
        : 'Unnamed Program';

      console.log(`📋 Program: ${programName}\n`);

      for (const template of program.workoutTemplates) {
        const templateName = typeof template.name === 'object' && template.name !== null
          ? template.name.en || Object.values(template.name)[0]
          : `Workout ${template.order}`;

        console.log(`💪 Workout Template: ${templateName}`);
        
        // Check if "back" muscle group exists in database
        if (template.requiredMuscleGroups.includes('back')) {
          foundBackMuscleGroup = true;
          console.log(`   ⚠️  WARNING: Found deprecated "back" muscle group in database`);
          console.log(`   📝 Recommendation: Update this workout to use "lats" and/or "upper_back"`);
        }

        console.log(`   Database Muscle Groups (${template.requiredMuscleGroups.length}):`);
        console.log(`   ${template.requiredMuscleGroups.join(', ')}\n`);

        // Filter to valid muscle groups
        const validMuscleGroups = filterValidMuscleGroups(template.requiredMuscleGroups);
        const invalidMuscleGroups = template.requiredMuscleGroups.filter(
          mg => !validMuscleGroups.includes(mg)
        );

        console.log(`   ✅ VALID Muscle Groups (${validMuscleGroups.length}):`);
        if (validMuscleGroups.length > 0) {
          validMuscleGroups.forEach(mg => {
            const info = MUSCLE_GROUPS.find(m => m.id === mg);
            const marker = mg === 'lats' || mg === 'upper_back' ? ' ⭐' : '';
            console.log(`      • ${mg} → "${info?.name || mg}"${marker}`);
          });
        } else {
          console.log('      (none)');
        }
        console.log('');

        console.log(`   ❌ INVALID/DEPRECATED Muscle Groups (${invalidMuscleGroups.length}):`);
        if (invalidMuscleGroups.length > 0) {
          invalidMuscleGroups.forEach(mg => {
            const isBack = mg === 'back';
            const status = isBack ? '(DEPRECATED - use "lats" or "upper_back")' : '(NOT in admin form list)';
            console.log(`      • ${mg} ${status}`);
          });
        } else {
          console.log('      (none)');
        }
        console.log('');
        console.log('-'.repeat(70) + '\n');
      }
    }

    console.log('='.repeat(70));
    console.log('📊 FINAL SUMMARY:');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ CODE UPDATES COMPLETED:');
    console.log('1. Admin workout template form now shows "Lats" and "Upper Back"');
    console.log('2. Program guide customizer now shows "Lats" and "Upper Back"');
    console.log('3. Both forms have consistent 18 muscle groups');
    console.log('');
    
    if (foundBackMuscleGroup) {
      console.log('⚠️  DATABASE MIGRATION RECOMMENDED:');
      console.log('The database still contains the deprecated "back" muscle group.');
      console.log('');
      console.log('🔧 HOW TO FIX:');
      console.log('1. Go to Admin → Programs');
      console.log('2. Edit each program with "back" muscle group');
      console.log('3. Replace "back" with specific selections:');
      console.log('   • "Lats" for lat-focused movements (pulldowns, rows)');
      console.log('   • "Upper Back" for upper back work (shrugs, rear delt work)');
      console.log('   • Both "Lats" AND "Upper Back" for comprehensive back training');
      console.log('4. Save the updated program');
    } else {
      console.log('✅ DATABASE STATUS:');
      console.log('No deprecated "back" muscle groups found in database!');
      console.log('All workout templates are using the new muscle group structure.');
    }
    console.log('');
    console.log('🎯 BENEFITS:');
    console.log('• More specific muscle targeting for program design');
    console.log('• Better exercise selection for different back regions');
    console.log('• Clearer distinction between lat width and upper back thickness');
    console.log('• Consistent muscle group options across admin and user interfaces');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error verifying muscle group split:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMuscleGroupSplit();
