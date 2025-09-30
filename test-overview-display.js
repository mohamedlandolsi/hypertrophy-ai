const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramOverviewDisplay() {
  try {
    console.log('🔍 Testing Program Overview Display...\n');

    // Get all active programs with their structures
    const programs = await prisma.trainingProgram.findMany({
      where: { isActive: true },
      include: {
        programStructures: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log(`📋 Found ${programs.length} active programs\n`);

    for (const program of programs) {
      const programName = typeof program.name === 'object' && program.name !== null 
        ? program.name.en || Object.values(program.name)[0] 
        : 'Unnamed Program';

      console.log(`🎯 Program: ${programName}`);
      console.log('='.repeat(70) + '\n');

      for (const structure of program.programStructures) {
        const structureName = typeof structure.name === 'object' && structure.name !== null
          ? structure.name.en || Object.values(structure.name)[0]
          : `Structure ${structure.order + 1}`;

        console.log(`📅 Structure: ${structureName}`);
        console.log(`   Type: ${structure.structureType}`);
        console.log(`   Is Default: ${structure.isDefault ? 'Yes (Recommended)' : 'No'}`);
        
        if (structure.structureType === 'weekly') {
          console.log(`   Sessions per week: ${structure.sessionCount}`);
          
          if (structure.weeklySchedule && typeof structure.weeklySchedule === 'object') {
            console.log('\n   ✅ WEEKLY SCHEDULE WILL BE DISPLAYED:');
            console.log('   Weekly Schedule:');
            
            const schedule = Object.entries(structure.weeklySchedule);
            const display = schedule.map(([day, workout], index) => {
              const isRestDay = !workout || workout.trim() === '' || workout.toLowerCase() === 'rest';
              const displayLabel = isRestDay ? 'Rest' : workout;
              return `Day ${index + 1}: ${displayLabel}`;
            }).join(' | ');
            
            console.log(`   ${display}\n`);
          }
        } else {
          // Cyclic structure
          console.log(`   Training days: ${structure.trainingDays}`);
          console.log(`   Rest days: ${structure.restDays}`);
          
          if (structure.weeklySchedule && typeof structure.weeklySchedule === 'object') {
            console.log('\n   ❌ WEEKLY SCHEDULE WILL NOT BE DISPLAYED (cyclic structure)');
          } else {
            console.log('\n   ✅ NO WEEKLY SCHEDULE (as expected for cyclic)');
          }
          console.log('');
        }
        
        console.log('-'.repeat(70));
      }
      
      console.log('\n');
    }

    console.log('='.repeat(70));
    console.log('📊 SUMMARY OF CHANGES:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. ✅ CYCLIC STRUCTURES:');
    console.log('   - Weekly Schedule section is HIDDEN');
    console.log('   - Only shows training/rest day counts');
    console.log('');
    console.log('2. ✅ WEEKLY STRUCTURES:');
    console.log('   - Weekly Schedule section is SHOWN');
    console.log('   - Day labels changed from "Mon, Tue, Wed..." to "Day 1, Day 2, Day 3..."');
    console.log('   - Workout names displayed (Upper Body, Lower Body, Rest)');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error testing program overview display:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgramOverviewDisplay();