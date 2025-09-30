const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Muscle group definitions (matching admin form)
const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest' },
  { id: 'back', name: 'Back' },
  { id: 'side_delts', name: 'Side Delts' },
  { id: 'front_delts', name: 'Front Delts' },
  { id: 'rear_delts', name: 'Rear Delts' },
  { id: 'elbow_flexors', name: 'Elbow Flexors (Biceps, Brachialis, Brachioradialis)' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'quadriceps', name: 'Quadriceps' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'adductors', name: 'Adductors' },
  { id: 'calves', name: 'Calves' },
  { id: 'erectors', name: 'Erectors' },
  { id: 'abs', name: 'Abs' },
  { id: 'obliques', name: 'Obliques' },
  { id: 'hip_flexors', name: 'Hip Flexors' }
];

function getMuscleGroupInfo(muscleGroupId) {
  return MUSCLE_GROUPS.find(mg => mg.id === muscleGroupId) || {
    id: muscleGroupId,
    name: muscleGroupId.charAt(0).toUpperCase() + muscleGroupId.slice(1).replace(/_/g, ' ')
  };
}

function filterValidMuscleGroups(muscleGroups) {
  const validIds = MUSCLE_GROUPS.map(mg => mg.id);
  return muscleGroups.filter(mg => validIds.includes(mg));
}

async function testMuscleGroupFiltering() {
  try {
    console.log('🔍 Testing Muscle Group Filtering...\n');
    console.log('='.repeat(70));
    console.log('VALID MUSCLE GROUPS FROM ADMIN FORM:');
    console.log('='.repeat(70));
    MUSCLE_GROUPS.forEach((mg, index) => {
      console.log(`${index + 1}. ${mg.id} → "${mg.name}"`);
    });
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
    console.log('PROGRAM ANALYSIS:');
    console.log('='.repeat(70) + '\n');

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
        console.log(`   Database Muscle Groups (${template.requiredMuscleGroups.length}):`)
        console.log(`   ${template.requiredMuscleGroups.join(', ')}\n`);

        // Filter to valid muscle groups
        const validMuscleGroups = filterValidMuscleGroups(template.requiredMuscleGroups);
        const invalidMuscleGroups = template.requiredMuscleGroups.filter(
          mg => !validMuscleGroups.includes(mg)
        );

        console.log(`   ✅ VALID Muscle Groups (${validMuscleGroups.length}):`);
        if (validMuscleGroups.length > 0) {
          validMuscleGroups.forEach(mg => {
            const info = getMuscleGroupInfo(mg);
            console.log(`      • ${mg} → "${info.name}"`);
          });
        } else {
          console.log('      (none)');
        }
        console.log('');

        console.log(`   ❌ INVALID Muscle Groups (${invalidMuscleGroups.length}):`);
        if (invalidMuscleGroups.length > 0) {
          invalidMuscleGroups.forEach(mg => {
            console.log(`      • ${mg} (NOT in admin form list - WILL BE FILTERED OUT)`);
          });
        } else {
          console.log('      (none)');
        }
        console.log('');

        console.log(`   📊 What User Will See in Guide:`);
        if (validMuscleGroups.length > 0) {
          const display = validMuscleGroups.map(mg => {
            const info = getMuscleGroupInfo(mg);
            return `[${info.name}]`;
          }).join(' ');
          console.log(`      ${display}`);
        } else {
          console.log('      "No muscle groups configured"');
        }
        console.log('');
        console.log('-'.repeat(70) + '\n');
      }
    }

    console.log('='.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ BENEFITS:');
    console.log('1. Only muscle groups from the admin selection list are displayed');
    console.log('2. Invalid/generic muscle groups (shoulders, arms, legs, core) are filtered out');
    console.log('3. Muscle groups shown with proper names and colored badges');
    console.log('4. Consistent experience between admin creation and user customization');
    console.log('');
    console.log('⚠️  ACTION REQUIRED:');
    console.log('If invalid muscle groups were found, the admin should:');
    console.log('1. Edit the program in the admin panel');
    console.log('2. Remove generic groupings (shoulders, arms, legs, core)');
    console.log('3. Select specific muscle groups from the predefined list');
    console.log('4. Save the program to update the database');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error testing muscle group filtering:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMuscleGroupFiltering();