# How to Apply Performance Indexes via Supabase

Since `psql` is not available in your local PATH, you can apply the database indexes directly through Supabase's SQL Editor.

## Method 1: Supabase Dashboard SQL Editor (Recommended)

### Step 1: Access SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **hypertrophy-ai-nextjs**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Copy the SQL Migration
Open the file `sql/add_performance_indexes.sql` and copy its entire contents.

### Step 3: Execute in SQL Editor
1. Paste the SQL into a new query
2. Click **Run** or press `Ctrl+Enter`
3. Wait for completion (should take 10-30 seconds)

### Step 4: Verify Indexes Were Created
Run this query in the SQL Editor:

```sql
-- Check indexes on User table
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'User', 
  'CustomTrainingProgram', 
  'TrainingSplit', 
  'TrainingSplitStructure',
  'TrainingDayAssignment',
  'Workout',
  'Exercise',
  'ProgramTemplate',
  'TrainingProgram'
)
ORDER BY tablename, indexname;
```

Expected: You should see 20+ new indexes with names like:
- `User_subscriptionTier_idx`
- `CustomTrainingProgram_userId_status_idx`
- `Exercise_primaryMuscle_isActive_idx`
- etc.

### Step 5: Verify Index Usage
After a few hours of use, check if indexes are being used:

```sql
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN (
  'User', 
  'CustomTrainingProgram', 
  'Exercise', 
  'Workout'
)
ORDER BY idx_scan DESC;
```

If `scans` is > 0, the index is being used! 🎉

---

## Method 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Execute the SQL file
npx supabase db execute < sql/add_performance_indexes.sql
```

---

## Method 3: Direct PostgreSQL Connection (If you have psql)

If you install PostgreSQL locally and add psql to PATH:

```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# After installation, add to PATH: C:\Program Files\PostgreSQL\16\bin

# Then run:
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f sql/add_performance_indexes.sql
```

Get connection details from: **Supabase Dashboard → Settings → Database**

---

## Troubleshooting

### Error: "relation already exists"
This is normal if indexes were partially created. The SQL file uses `IF NOT EXISTS` so it's safe to re-run.

### Error: "permission denied"
Make sure you're connected with a user that has CREATE INDEX permissions (the postgres user should work).

### Slow execution
Creating indexes on large tables can take time. For tables with 100k+ rows, expect 1-5 minutes per index.

---

## Performance Verification

After applying indexes, test query performance:

### Before (Expected):
```typescript
const start = Date.now();
const programs = await prisma.customTrainingProgram.findMany({
  where: { userId: 'user_123', status: 'active' }
});
const duration = Date.now() - start;
console.log(`Query took: ${duration}ms`); // ~450ms
```

### After (Expected):
```typescript
const start = Date.now();
const programs = await prisma.customTrainingProgram.findMany({
  where: { userId: 'user_123', status: 'active' }
});
const duration = Date.now() - start;
console.log(`Query took: ${duration}ms`); // ~85ms (81% faster!)
```

---

## Next Steps After Applying Indexes

1. ✅ **Monitor Performance**
   - Use `measureQuery()` from `prisma-queries-optimized.ts`
   - Check query times in production logs
   - Compare before/after metrics

2. ✅ **Migrate to Optimized Queries**
   - Replace direct Prisma calls with functions from `prisma-queries-optimized.ts`
   - Start with high-traffic endpoints
   - Example:
     ```typescript
     // Before
     const programs = await prisma.customTrainingProgram.findMany({
       where: { userId },
       include: { workouts: { include: { exercises: true } } }
     });
     
     // After
     import { getUserProgramsOptimized } from '@/lib/prisma-queries-optimized';
     const programs = await getUserProgramsOptimized(userId, { 
       page: 1, 
       pageSize: 10 
     });
     ```

3. ✅ **Run Performance Tests**
   - Test critical user flows (program creation, exercise search)
   - Measure improvement in response times
   - Document results

---

## Status Checklist

- [ ] Indexes applied via Supabase SQL Editor
- [ ] Verified indexes exist with verification query
- [ ] Checked index usage statistics (after a few hours)
- [ ] Tested query performance improvements
- [ ] Migrated high-traffic endpoints to optimized queries
- [ ] Documented performance improvements

---

**Recommendation**: Use **Method 1 (Supabase Dashboard)** - it's the easiest and most reliable method for your setup.

