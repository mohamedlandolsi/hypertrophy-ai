const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyProgramStructuresMigration() {
  console.log('🔍 Verifying program structures migration...');
  
  try {
    // Check training programs
    const programs = await prisma.trainingProgram.findMany({
      include: {
        programStructures: true,
      },
    });

    console.log(`📊 Found ${programs.length} training programs`);

    for (const program of programs) {
      console.log(`\n📋 Program: ${JSON.stringify(program.name)}`);
      console.log(`   Structures: ${program.programStructures.length}`);
      
      for (const structure of program.programStructures) {
        console.log(`   - ${JSON.stringify(structure.name)}`);
        console.log(`     Type: ${structure.structureType}`);
        console.log(`     Sessions: ${structure.sessionCount}`);
        console.log(`     Training Days: ${structure.trainingDays}`);
        console.log(`     Rest Days: ${structure.restDays}`);
        console.log(`     Default: ${structure.isDefault}`);
      }
    }

    // Check standalone program structures
    const allStructures = await prisma.programStructure.findMany({
      orderBy: [
        { trainingProgramId: 'asc' },
        { order: 'asc' }
      ]
    });

    console.log(`\n🏗️  Total program structures: ${allStructures.length}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyProgramStructuresMigration()
    .then(() => {
      console.log('\n✅ Verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyProgramStructuresMigration };