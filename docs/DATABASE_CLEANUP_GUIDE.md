# Database Cleanup Guide

This guide explains how to use the legacy data cleanup script to maintain database health and remove outdated data from the old one-time purchase model.

## Overview

The `cleanup-legacy-data.ts` script identifies and removes:
- **Orphaned Exercises**: Exercises not assigned to any workout or template
- **Orphaned Workouts**: Workouts whose parent programs no longer exist
- **Old Purchase Records**: DEPRECATED UserPurchase records (kept for audit, not deleted)
- **Broken Relations**: Validates and reports database integrity issues

## Prerequisites

1. **Database Backup**: Always backup your database before running cleanup
2. **Production Access**: Ensure you have access to production database credentials
3. **Node.js Environment**: Node.js and npm installed

## Usage

### Step 1: Backup Database

```bash
# Using pg_dump (PostgreSQL)
pg_dump -U username -d database_name -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump

# Or use Supabase dashboard backup feature
```

### Step 2: Dry Run (ALWAYS RUN FIRST)

```bash
# Preview what will be deleted without making changes
node scripts/cleanup-legacy-data.ts --dry-run
```

**What Dry Run Shows:**
- Number of orphaned exercises found
- Number of orphaned workouts found
- Number of old purchase records
- Database integrity check results
- Detailed list of items to be deleted

**Expected Output:**
```
🚀 Starting Legacy Data Cleanup Script
Mode: DRY RUN
Cutoff Date: 2024-01-01T00:00:00.000Z

🔍 Searching for orphaned exercises...
Found 5 orphaned exercises

Orphaned exercises:
  - Leg Curl Variation (ID: ex_abc123, Created: 2023-11-15T10:30:00.000Z)
  - Old Bench Press (ID: ex_def456, Created: 2023-10-20T14:22:00.000Z)
  ...

🔍 Searching for orphaned workouts...
Found 3 orphaned workouts

Orphaned workouts:
  - Upper Body A (ID: wk_xyz789, Exercises: 5, Created: 2023-12-01T09:15:00.000Z)
  ...

🔍 Verifying database integrity...
Integrity check results:
  - Exercises with broken references: 0
  - Workouts with broken program references: 3
  - Programs with broken user references: 0

============================================================
CLEANUP SUMMARY
============================================================
Mode: DRY RUN
Timestamp: 2025-11-09T12:34:56.789Z

Items to be cleaned:
  - Orphaned exercises: 5
  - Orphaned workouts: 3
  - Old purchase records: 12

Database integrity:
  - Broken exercise relations: 0
  - Broken workout relations: 3
  - Broken program relations: 0
============================================================

⚠️  This was a DRY RUN. No changes were made.
```

### Step 3: Review Archive Files

The script automatically archives data before deletion:

```bash
# Check archive directory
ls backups/legacy-data/

# Review archived data
cat backups/legacy-data/orphaned-exercises-1699876543210.json
cat backups/legacy-data/orphaned-workouts-1699876543210.json
cat backups/legacy-data/cleanup-report-1699876543210.json
```

**Archive Contents:**
- **orphaned-exercises-*.json**: Full exercise objects including all fields
- **orphaned-workouts-*.json**: Full workout objects with exercise counts
- **old-purchase-records-*.json**: DEPRECATED purchase records (audit trail)
- **cleanup-report-*.json**: Complete cleanup report with timestamps and results

### Step 4: Execute Cleanup (LIVE MODE)

⚠️ **WARNING: This will permanently delete data from the database!**

```bash
# Execute cleanup (no dry-run flag)
node scripts/cleanup-legacy-data.ts
```

**What Happens:**
1. Archives all data to `backups/legacy-data/`
2. Executes cleanup in a database transaction
3. Deletes orphaned exercises (cascade deletes relations)
4. Deletes orphaned workouts (cascade deletes relations)
5. Archives old purchase records (keeps in DB for audit)
6. Performs final integrity check
7. Generates cleanup report

**Expected Output:**
```
🚀 Starting Legacy Data Cleanup Script
Mode: LIVE EXECUTION
Cutoff Date: 2024-01-01T00:00:00.000Z

✓ Created archive directory: D:\...\backups\legacy-data
✓ Archived data to: D:\...\backups\legacy-data\orphaned-exercises-1699876543210.json
✓ Archived data to: D:\...\backups\legacy-data\orphaned-workouts-1699876543210.json

🧹 Executing cleanup...
✓ Deleted 5 orphaned exercises
✓ Deleted 3 orphaned workouts
✓ Archived 12 purchase records (kept in database for audit)

✅ Cleanup completed successfully!

🔍 Final integrity check...
✅ All integrity checks passed!

============================================================
CLEANUP SUMMARY
============================================================
Mode: LIVE EXECUTION
✅ Cleanup executed successfully!
============================================================
```

## Configuration

### Adjusting Cutoff Date

The script uses a cutoff date to determine which data is considered "legacy":

```typescript
// In cleanup-legacy-data.ts
const LEGACY_CUTOFF_DATE = new Date('2024-01-01'); // Adjust as needed
```

**Recommendations:**
- **Conservative**: Use a date 6-12 months ago
- **Aggressive**: Use a date 1-3 months ago
- **Testing**: Use current date minus a few days

### What Gets Deleted

| Data Type | Criteria | Action |
|-----------|----------|--------|
| **Exercises** | No WorkoutExercise or TemplateExercise relations + created before cutoff | **DELETED** |
| **Workouts** | Parent program doesn't exist + created before cutoff | **DELETED** |
| **Purchase Records** | Created before cutoff | **ARCHIVED** (not deleted) |

### What's Protected

| Data Type | Protection |
|-----------|-----------|
| **Active Exercises** | Must have workout/template relations |
| **Active Workouts** | Must have valid program reference |
| **Recent Data** | Must be created before cutoff date |
| **User Data** | Never deleted (users, programs, etc.) |

## Integrity Checks

The script performs multiple integrity checks:

### 1. Broken Exercise References
Checks for WorkoutExercise entries pointing to non-existent exercises.

### 2. Broken Workout References
Checks for Workouts pointing to non-existent programs.

### 3. Broken Program References
Checks for Programs pointing to non-existent users.

### 4. Cascade Deletions
Verifies that cascade deletions work correctly:
- Deleting Exercise → Deletes WorkoutExercise entries
- Deleting Exercise → Deletes TemplateExercise entries
- Deleting Workout → Deletes WorkoutExercise entries

## Rollback Procedure

If something goes wrong, you can restore from the archive files:

### Option 1: Database Backup Restore
```bash
# Restore from pg_dump backup
pg_restore -U username -d database_name backup_20251109_123456.dump
```

### Option 2: Manual Restoration from Archives
```javascript
// Node.js script to restore from JSON archives
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  const exercises = JSON.parse(
    fs.readFileSync('backups/legacy-data/orphaned-exercises-*.json', 'utf8')
  );
  
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise
    });
  }
}

restore();
```

## Maintenance Schedule

**Recommended Schedule:**
- **Development**: Run dry-run weekly to monitor data growth
- **Staging**: Run cleanup monthly after testing
- **Production**: Run cleanup quarterly with approval

**Before Each Run:**
1. ✅ Backup database
2. ✅ Run dry-run
3. ✅ Review archive files
4. ✅ Get approval (if production)
5. ✅ Execute cleanup
6. ✅ Verify integrity checks
7. ✅ Monitor application for 24-48 hours

## Troubleshooting

### Issue: "P3006 Migration failed to apply"
**Solution**: This is expected if using shadow database. The script doesn't require migrations - it works directly with the database.

### Issue: "Cannot connect to database"
**Solution**: Check `.env` file for correct `DATABASE_URL` and `DIRECT_URL`.

### Issue: "Transaction failed"
**Solution**: 
1. Check database logs for constraint violations
2. Review integrity check results
3. Run dry-run again to see current state

### Issue: "No data found to clean"
**Solution**: Adjust `LEGACY_CUTOFF_DATE` to a more recent date.

### Issue: "Too much data to delete"
**Solution**: 
1. Review cutoff date - might be too aggressive
2. Consider running cleanup in batches
3. Verify data is actually orphaned

## Performance Considerations

### Large Databases
For databases with 100k+ records:

1. **Batch Processing**: Modify script to process in chunks
2. **Index Usage**: Ensure indexes exist (see PRISMA_QUERY_OPTIMIZATION.md)
3. **Transaction Timeout**: May need to increase timeout
4. **Progress Logging**: Add progress indicators

### Example Batch Modification
```typescript
// Process in batches of 1000
const BATCH_SIZE = 1000;
for (let i = 0; i < exerciseIds.length; i += BATCH_SIZE) {
  const batch = exerciseIds.slice(i, i + BATCH_SIZE);
  await tx.exercise.deleteMany({
    where: { id: { in: batch } }
  });
  console.log(`Processed ${i + BATCH_SIZE} / ${exerciseIds.length}`);
}
```

## Safety Features

### Built-in Protections
1. **Dry Run Required**: Must explicitly run without `--dry-run` flag
2. **Transaction Safety**: All deletions in single transaction (all-or-nothing)
3. **Automatic Archiving**: Data backed up before deletion
4. **Integrity Checks**: Pre and post-cleanup validation
5. **Detailed Logging**: Complete audit trail

### Fail-Safe Mechanisms
- Transaction rollback on any error
- Archive creation before any deletion
- Detailed error messages
- Report generation for audit

## Related Documentation

- [PRISMA_QUERY_OPTIMIZATION.md](./PRISMA_QUERY_OPTIMIZATION.md) - Query performance improvements
- [PRISMA_OPTIMIZATION_SUMMARY.md](./PRISMA_OPTIMIZATION_SUMMARY.md) - Optimization overview
- [scripts/README.md](../scripts/README.md) - All available scripts

## Support

For issues or questions:
1. Check dry-run output for details
2. Review archive files
3. Check database logs
4. Run integrity checks manually
5. Contact database administrator if needed

---

**Last Updated**: November 9, 2025  
**Script Version**: 1.0.0  
**Cutoff Date**: January 1, 2024
