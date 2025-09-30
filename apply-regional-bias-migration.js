/**
 * Apply Regional Bias Migration
 * Adds regionalBias column to Exercise table to track regional muscle emphasis
 */

const { PrismaClient } = require('@prisma/client');
const { readFileSync } = require('fs');
const { join } = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting regional bias migration...\n');

  try {
    // Read SQL migration file
    const sqlPath = join(process.cwd(), 'add-regional-bias-migration.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Remove comments and split into statements
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split SQL into individual statements
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    // Execute each statement
    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('SELECT')) {
        console.log('Skipping SELECT statement for verification step');
        continue;
      }
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await prisma.$executeRawUnsafe(statement);
      console.log('✓ Success\n');
    }

    // Verify the migration
    console.log('\nVerifying migration...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Exercise' 
      AND column_name = 'regionalBias'
    `;

    if (result.length > 0) {
      console.log('✅ Migration successful!');
      console.log('Column details:', result[0]);
    } else {
      console.log('❌ Migration failed - column not found');
    }

    // Count exercises
    const exerciseCount = await prisma.exercise.count();
    console.log(`\n✅ Total exercises in database: ${exerciseCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
