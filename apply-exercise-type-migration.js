// Apply exercise type migration without resetting database
// Run with: node apply-exercise-type-migration.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Starting Exercise Type Migration...\n');
  
  try {
    // Step 1: Add exerciseType column
    console.log('Step 1: Adding exerciseType column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Exercise" 
      ADD COLUMN IF NOT EXISTS "exerciseType" "ExerciseType" DEFAULT 'COMPOUND'
    `);
    console.log('✅ exerciseType column added\n');

    // Step 2: Update NULL volumeContributions
    console.log('Step 2: Updating NULL volumeContributions...');
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE "Exercise" 
      SET "volumeContributions" = '{}'::jsonb 
      WHERE "volumeContributions" IS NULL
    `);
    console.log(`✅ Updated ${updateResult} exercises with empty volumeContributions\n`);

    // Step 3: Drop muscleGroup column
    console.log('Step 3: Dropping muscleGroup column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Exercise" 
      DROP COLUMN IF EXISTS "muscleGroup"
    `);
    console.log('✅ muscleGroup column dropped\n');

    // Step 4: Drop old indexes
    console.log('Step 4: Dropping old indexes...');
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Exercise_muscleGroup_category_idx"`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Exercise_muscleGroup_idx"`);
    console.log('✅ Old indexes dropped\n');

    // Step 5: Create new indexes
    console.log('Step 5: Creating new indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_idx" 
      ON "Exercise"("exerciseType")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Exercise_exerciseType_category_idx" 
      ON "Exercise"("exerciseType", "category")
    `);
    console.log('✅ New indexes created\n');

    // Verify the migration
    console.log('📊 Verification:');
    const totalExercises = await prisma.exercise.count();
    const exercisesByType = await prisma.$queryRaw`
      SELECT "exerciseType", COUNT(*)::int as count
      FROM "Exercise"
      GROUP BY "exerciseType"
      ORDER BY "exerciseType"
    `;
    
    console.log(`   Total exercises: ${totalExercises}`);
    console.log('   Breakdown by type:');
    exercisesByType.forEach(row => {
      console.log(`   - ${row.exerciseType}: ${row.count}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run postinstall');
    console.log('   2. Run: npm run build');
    console.log('   3. Admin needs to configure exerciseType and volumeContributions for each exercise\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
