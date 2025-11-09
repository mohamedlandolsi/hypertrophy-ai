/**
 * Legacy Data Cleanup Script
 * 
 * This script identifies and removes old data from the one-time purchase model
 * that is no longer needed after migrating to the subscription-based model.
 * 
 * IMPORTANT: Always run with --dry-run first to see what will be deleted!
 * 
 * Usage:
 *   node scripts/cleanup-legacy-data.ts --dry-run    # Preview changes
 *   node scripts/cleanup-legacy-data.ts              # Execute cleanup
 * 
 * What this script does:
 * 1. Identifies and archives/deletes old program purchase records
 * 2. Removes orphaned exercises not assigned to any program
 * 3. Removes orphaned workouts not assigned to any program
 * 4. Cleans up old payment records (if any exist)
 * 5. Validates database integrity after cleanup
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuration
const ARCHIVE_DIR = path.join(process.cwd(), 'backups', 'legacy-data');
const DRY_RUN = process.argv.includes('--dry-run');
const LEGACY_CUTOFF_DATE = new Date('2024-01-01'); // Adjust as needed

interface CleanupReport {
  timestamp: string;
  dryRun: boolean;
  orphanedExercises: number;
  orphanedWorkouts: number;
  oldPurchaseRecords: number;
  integrityChecks: {
    brokenExerciseRelations: number;
    brokenWorkoutRelations: number;
    brokenProgramRelations: number;
  };
  archivedData: {
    exercises: any[];
    workouts: any[];
    purchaseRecords: any[];
  };
}

/**
 * Create archive directory if it doesn't exist
 */
function ensureArchiveDirectory(): void {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    console.log(`✓ Created archive directory: ${ARCHIVE_DIR}`);
  }
}

/**
 * Save data to archive before deletion
 */
function archiveData(filename: string, data: any): void {
  const filepath = path.join(ARCHIVE_DIR, `${filename}-${Date.now()}.json`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Archived data to: ${filepath}`);
}

/**
 * Find orphaned exercises (not assigned to any workout)
 */
async function findOrphanedExercises() {
  console.log('\n🔍 Searching for orphaned exercises...');
  
  const orphanedExercises = await prisma.exercise.findMany({
    where: {
      AND: [
        {
          workoutExercises: {
            none: {}
          }
        },
        {
          templateExercises: {
            none: {}
          }
        },
        {
          // Only consider exercises created before cutoff date
          createdAt: {
            lt: LEGACY_CUTOFF_DATE
          }
        }
      ]
    },
    include: {
      workoutExercises: true,
      templateExercises: true
    }
  });

  console.log(`Found ${orphanedExercises.length} orphaned exercises`);
  
  if (orphanedExercises.length > 0) {
    console.log('\nOrphaned exercises:');
    orphanedExercises.forEach(ex => {
      console.log(`  - ${ex.name} (ID: ${ex.id}, Created: ${ex.createdAt})`);
    });
  }

  return orphanedExercises;
}

/**
 * Find orphaned workouts (not assigned to any program)
 * In the current schema, all workouts must have a programId, so we look for
 * workouts whose programs no longer exist
 */
async function findOrphanedWorkouts() {
  console.log('\n🔍 Searching for orphaned workouts...');
  
  // First, get all workout IDs
  const allWorkouts = await prisma.workout.findMany({
    where: {
      createdAt: {
        lt: LEGACY_CUTOFF_DATE
      }
    },
    select: {
      id: true,
      name: true,
      programId: true,
      createdAt: true,
      _count: {
        select: {
          exercises: true
        }
      }
    }
  });

  // Check which programs actually exist
  const programIds = [...new Set(allWorkouts.map(w => w.programId))];
  const existingPrograms = await prisma.customTrainingProgram.findMany({
    where: {
      id: {
        in: programIds
      }
    },
    select: {
      id: true
    }
  });

  const existingProgramIds = new Set(existingPrograms.map(p => p.id));
  
  // Find workouts whose programs don't exist
  const orphanedWorkouts = allWorkouts.filter(
    w => !existingProgramIds.has(w.programId)
  );

  console.log(`Found ${orphanedWorkouts.length} orphaned workouts`);
  
  if (orphanedWorkouts.length > 0) {
    console.log('\nOrphaned workouts:');
    orphanedWorkouts.forEach(workout => {
      console.log(`  - ${workout.name} (ID: ${workout.id}, Exercises: ${workout._count.exercises}, Created: ${workout.createdAt})`);
    });
  }

  return orphanedWorkouts;
}

/**
 * Find old purchase records (if they exist in your schema)
 * Note: UserPurchase model is DEPRECATED - kept for historical data only
 */
async function findOldPurchaseRecords() {
  console.log('\n🔍 Searching for old purchase records...');
  
  try {
    // Query the deprecated UserPurchase table for old records
    const oldPurchases = await prisma.userPurchase.findMany({
      where: {
        purchaseDate: {
          lt: LEGACY_CUTOFF_DATE
        }
      },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        },
        trainingProgram: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${oldPurchases.length} old purchase records`);
    
    if (oldPurchases.length > 0) {
      console.log('\nOld purchase records:');
      oldPurchases.forEach(purchase => {
        console.log(`  - User ${purchase.userId} purchased program ${purchase.trainingProgramId} on ${purchase.purchaseDate}`);
      });
    }
    
    return oldPurchases;
  } catch (error) {
    console.log('Note: Unable to query purchase records:', error);
    return [];
  }
}

/**
 * Verify database integrity
 */
async function verifyDatabaseIntegrity() {
  console.log('\n🔍 Verifying database integrity...');
  
  const checks = {
    brokenExerciseRelations: 0,
    brokenWorkoutRelations: 0,
    brokenProgramRelations: 0
  };

  // Check for exercises referenced in WorkoutExercise but not in Exercise table
  const workoutExercises = await prisma.workoutExercise.findMany({
    select: {
      exerciseId: true
    }
  });

  const exerciseIds = [...new Set(workoutExercises.map(we => we.exerciseId))];
  const existingExercises = await prisma.exercise.findMany({
    where: {
      id: {
        in: exerciseIds
      }
    },
    select: {
      id: true
    }
  });

  const existingExerciseIds = new Set(existingExercises.map(e => e.id));
  checks.brokenExerciseRelations = exerciseIds.filter(
    id => !existingExerciseIds.has(id)
  ).length;

  // Check for workouts with invalid program references
  const allWorkouts = await prisma.workout.findMany({
    select: {
      programId: true
    }
  });

  const programIds = [...new Set(allWorkouts.map(w => w.programId))];
  const existingPrograms = await prisma.customTrainingProgram.findMany({
    where: {
      id: {
        in: programIds
      }
    },
    select: {
      id: true
    }
  });

  const existingProgramIds = new Set(existingPrograms.map(p => p.id));
  checks.brokenWorkoutRelations = programIds.filter(
    id => !existingProgramIds.has(id)
  ).length;

  // Check for programs with missing users
  const allPrograms = await prisma.customTrainingProgram.findMany({
    select: {
      userId: true
    }
  });

  const userIds = [...new Set(allPrograms.map(p => p.userId))];
  const existingUsers = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true
    }
  });

  const existingUserIds = new Set(existingUsers.map(u => u.id));
  checks.brokenProgramRelations = userIds.filter(
    id => !existingUserIds.has(id)
  ).length;

  console.log('\nIntegrity check results:');
  console.log(`  - Exercises with broken references: ${checks.brokenExerciseRelations}`);
  console.log(`  - Workouts with broken program references: ${checks.brokenWorkoutRelations}`);
  console.log(`  - Programs with broken user references: ${checks.brokenProgramRelations}`);

  return checks;
}

/**
 * Execute cleanup in a transaction
 */
async function executeCleanup(report: CleanupReport) {
  console.log('\n🧹 Executing cleanup...');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete orphaned exercises
      if (report.archivedData.exercises.length > 0) {
        const exerciseIds = report.archivedData.exercises.map(ex => ex.id);
        
        // First delete WorkoutExercise relations
        await tx.workoutExercise.deleteMany({
          where: {
            exerciseId: {
              in: exerciseIds
            }
          }
        });

        // Then delete TemplateExercise relations
        await tx.templateExercise.deleteMany({
          where: {
            exerciseId: {
              in: exerciseIds
            }
          }
        });

        // Finally delete the exercises
        const deletedExercises = await tx.exercise.deleteMany({
          where: {
            id: {
              in: exerciseIds
            }
          }
        });
        console.log(`✓ Deleted ${deletedExercises.count} orphaned exercises`);
      }

      // 2. Delete orphaned workouts
      if (report.archivedData.workouts.length > 0) {
        const workoutIds = report.archivedData.workouts.map(w => w.id);
        
        // First, delete WorkoutExercise relations
        await tx.workoutExercise.deleteMany({
          where: {
            workoutId: {
              in: workoutIds
            }
          }
        });

        // Then delete workouts
        const deletedWorkouts = await tx.workout.deleteMany({
          where: {
            id: {
              in: workoutIds
            }
          }
        });
        console.log(`✓ Deleted ${deletedWorkouts.count} orphaned workouts`);
      }

      // 3. Archive (but don't delete) old purchase records
      // These are kept for historical/audit purposes
      if (report.archivedData.purchaseRecords.length > 0) {
        console.log(`✓ Archived ${report.archivedData.purchaseRecords.length} purchase records (kept in database for audit)`);
      }

      console.log('\n✅ Cleanup completed successfully!');
    });
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
}

/**
 * Generate cleanup report
 */
async function generateReport(): Promise<CleanupReport> {
  console.log('\n📊 Generating cleanup report...');

  const orphanedExercises = await findOrphanedExercises();
  const orphanedWorkouts = await findOrphanedWorkouts();
  const oldPurchaseRecords = await findOldPurchaseRecords();
  const integrityChecks = await verifyDatabaseIntegrity();

  const report: CleanupReport = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    orphanedExercises: orphanedExercises.length,
    orphanedWorkouts: orphanedWorkouts.length,
    oldPurchaseRecords: oldPurchaseRecords.length,
    integrityChecks,
    archivedData: {
      exercises: orphanedExercises,
      workouts: orphanedWorkouts,
      purchaseRecords: oldPurchaseRecords
    }
  };

  return report;
}

/**
 * Save cleanup report
 */
function saveReport(report: CleanupReport): void {
  const reportPath = path.join(
    ARCHIVE_DIR,
    `cleanup-report-${Date.now()}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Cleanup report saved to: ${reportPath}`);
}

/**
 * Display summary
 */
function displaySummary(report: CleanupReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${report.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('\nItems to be cleaned:');
  console.log(`  - Orphaned exercises: ${report.orphanedExercises}`);
  console.log(`  - Orphaned workouts: ${report.orphanedWorkouts}`);
  console.log(`  - Old purchase records: ${report.oldPurchaseRecords}`);
  console.log('\nDatabase integrity:');
  console.log(`  - Broken exercise relations: ${report.integrityChecks.brokenExerciseRelations}`);
  console.log(`  - Broken workout relations: ${report.integrityChecks.brokenWorkoutRelations}`);
  console.log(`  - Broken program relations: ${report.integrityChecks.brokenProgramRelations}`);
  console.log('='.repeat(60));

  if (report.dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('To execute cleanup, run without --dry-run flag:');
    console.log('  node scripts/cleanup-legacy-data.ts');
  } else {
    console.log('\n✅ Cleanup executed successfully!');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Legacy Data Cleanup Script');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`Cutoff Date: ${LEGACY_CUTOFF_DATE.toISOString()}`);

  try {
    // Ensure archive directory exists
    ensureArchiveDirectory();

    // Generate report
    const report = await generateReport();

    // Archive data before deletion
    if (report.orphanedExercises > 0) {
      archiveData('orphaned-exercises', report.archivedData.exercises);
    }
    if (report.orphanedWorkouts > 0) {
      archiveData('orphaned-workouts', report.archivedData.workouts);
    }
    if (report.oldPurchaseRecords > 0) {
      archiveData('old-purchase-records', report.archivedData.purchaseRecords);
    }

    // Save report
    saveReport(report);

    // Execute cleanup if not dry run
    await executeCleanup(report);

    // Verify integrity after cleanup
    if (!DRY_RUN) {
      console.log('\n🔍 Final integrity check...');
      const finalChecks = await verifyDatabaseIntegrity();
      
      if (
        finalChecks.brokenExerciseRelations === 0 &&
        finalChecks.brokenWorkoutRelations === 0 &&
        finalChecks.brokenProgramRelations === 0
      ) {
        console.log('✅ All integrity checks passed!');
      } else {
        console.log('⚠️  Some integrity issues remain - please review');
      }
    }

    // Display summary
    displaySummary(report);

  } catch (error) {
    console.error('\n❌ Fatal error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
main()
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
