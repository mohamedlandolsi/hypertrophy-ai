const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingProgramStructures() {
  console.log('🔄 Starting migration of existing program structures...');
  
  try {
    // Use raw SQL to get existing programs with their structure data from the database
    // before the schema changes are applied
    const existingPrograms = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        "structureType",
        "sessionCount",
        "trainingDays",
        "restDays",
        "weeklySchedule"
      FROM "TrainingProgram"
      WHERE "structureType" IS NOT NULL
    `;

    console.log(`📊 Found ${existingPrograms.length} programs to migrate`);

    if (existingPrograms.length === 0) {
      console.log('ℹ️  No programs found with existing structure data to migrate');
      return;
    }

    for (const program of existingPrograms) {
      console.log(`🔄 Migrating program: ${JSON.stringify(program.name)}`);
      
      // Create a new ProgramStructure record for each existing program
      const structureName = {
        en: `${program.structureType === 'weekly' ? 'Weekly' : 'Cyclic'} Structure`,
        ar: program.structureType === 'weekly' ? 'هيكل أسبوعي' : 'هيكل دوري',
        fr: program.structureType === 'weekly' ? 'Structure Hebdomadaire' : 'Structure Cyclique',
      };

      await prisma.$executeRaw`
        INSERT INTO "ProgramStructure" (
          id,
          "trainingProgramId",
          name,
          "structureType",
          "sessionCount",
          "trainingDays",
          "restDays",
          "weeklySchedule",
          "order",
          "isDefault",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${`ps_${program.id.slice(0, 20)}_${Date.now()}`},
          ${program.id},
          ${JSON.stringify(structureName)},
          ${program.structureType || 'weekly'},
          ${program.sessionCount || 4},
          ${program.trainingDays || 3},
          ${program.restDays || 1},
          ${program.weeklySchedule ? JSON.stringify(program.weeklySchedule) : null},
          0,
          true,
          NOW(),
          NOW()
        )
      `;

      console.log(`✅ Created structure for program ${program.id}`);
    }

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateExistingProgramStructures()
    .then(() => {
      console.log('🎉 Program structure migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingProgramStructures };