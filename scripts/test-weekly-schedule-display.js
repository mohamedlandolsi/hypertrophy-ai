const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWeeklyScheduleDisplay() {
  try {
    console.log('🔍 Testing weekly schedule display...\n');

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
      console.log(`   Program Structures: ${program.programStructures.length}\n`);

      for (const structure of program.programStructures) {
        const structureName = typeof structure.name === 'object' && structure.name !== null
          ? structure.name.en || Object.values(structure.name)[0]
          : `Structure ${structure.order + 1}`;

        console.log(`   📅 Structure: ${structureName}`);
        console.log(`      Type: ${structure.structureType}`);
        console.log(`      Is Default: ${structure.isDefault ? 'Yes' : 'No'}`);
        
        if (structure.structureType === 'weekly') {
          console.log(`      Sessions per week: ${structure.sessionCount}`);
          
          if (structure.weeklySchedule && typeof structure.weeklySchedule === 'object') {
            const schedule = structure.weeklySchedule;
            console.log(`\n      Weekly Schedule:`);
            
            // Display old way (D1, D2, D3...)
            const oldDisplay = Object.entries(schedule)
              .map(([day, workout]) => day.replace('day', 'D'))
              .join(' ');
            console.log(`      OLD: ${oldDisplay}`);
            
            // Display new way (Upper, Lower, Rest...)
            const newDisplay = Object.entries(schedule)
              .map(([day, workout]) => {
                if (!workout || workout.trim() === '' || workout.toLowerCase() === 'rest') {
                  return 'Rest';
                }
                return workout;
              })
              .join(' ');
            console.log(`      NEW: ${newDisplay}`);
            
            // Detailed breakdown
            console.log(`\n      Detailed breakdown:`);
            Object.entries(schedule).forEach(([day, workout]) => {
              const dayNum = day.replace('day', 'Day ');
              const isRestDay = !workout || workout.trim() === '' || workout.toLowerCase() === 'rest';
              const displayLabel = isRestDay ? 'Rest' : workout;
              const badge = isRestDay ? '⚪' : '🔵';
              
              console.log(`        ${badge} ${dayNum}: ${displayLabel}`);
            });
          }
        } else {
          console.log(`      Training days: ${structure.trainingDays}`);
          console.log(`      Rest days: ${structure.restDays}`);
        }
        
        console.log('');
      }
      
      console.log('='.repeat(60) + '\n');
    }

    console.log('✅ Summary:');
    console.log('Users will now see the actual workout names (Upper, Lower, Rest)');
    console.log('instead of generic day labels (D1, D2, D3) in the structure tab.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error testing weekly schedule display:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWeeklyScheduleDisplay();