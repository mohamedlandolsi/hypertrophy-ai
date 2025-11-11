# HypertroQ Scripts Documentation

This directory contains utility scripts for managing and maintaining the HypertroQ application.

## 🚀 Quick Access

| Script | Command | Purpose |
|--------|---------|---------|
| **Pre-Deployment Validation** | `npm run validate:deployment` | Validate app before deployment |
| **Knowledge Base Re-processing** | `npm run reprocess-kb` | Re-process knowledge base |
| **AI Configuration Check** | `node scripts/check-ai-config.js` | Verify AI config singleton |
| **Performance Tests** | `npm run test:performance` | Run database performance tests |

---

## 📋 Pre-Deployment Validation Script

**File**: `scripts/pre-deployment.ts`  
**Command**: `npm run validate:deployment` or `npm run pre-deploy`

### Overview

Comprehensive validation script that performs **40+ checks** before deployment to ensure:
- Database is properly configured and migrated
- Code compiles without errors
- Environment variables are set correctly
- Features are properly configured
- UI/UX elements are in place

### Usage

```powershell
# Run full validation
npm run validate:deployment

# Or use the shorter alias
npm run pre-deploy

# Direct execution
npx tsx scripts/pre-deployment.ts
```

### What Gets Validated

**1. Database (8 checks)**
- PostgreSQL connection
- Migrations applied
- pgvector extension installed
- Performance indexes created
- No orphaned records
- AI Configuration singleton exists
- Sample data seeded
- Data integrity verified

**2. Code Quality (5 checks)**
- TypeScript compilation (`npm run build`)
- ESLint validation
- No console.log in production code
- TODO/FIXME comments tracked
- Build artifacts generated

**3. Environment (7 checks)**
- .env.local file exists
- All required env variables set
- Supabase connection working
- Gemini API key valid
- LemonSqueezy API key valid
- Third-party services responding

**4. Features (6 checks)**
- Subscription tiers defined
- Tier enforcement functions present
- Free trial configured
- Webhook endpoints accessible
- RAG system has embeddings
- Exercise library populated

**5. UI/UX (6 checks)**
- Critical pages exist
- API routes present
- Tailwind config exists
- Mobile responsive setup
- Internationalization configured
- No broken navigation

### Output Example

```
═══════════════════════════════════════════════════════════════
  HYPERTROQ PRE-DEPLOYMENT VALIDATION
═══════════════════════════════════════════════════════════════

▶ 1. Database Validation
  ✓ Database connection: Successfully connected to PostgreSQL
  ✓ Migrations applied: Latest: 20241107_add_subscription_tiers
  ✓ pgvector extension: Installed and enabled
  ✓ Performance indexes: 18 key indexes found
  
▶ 2. Code Quality Validation
  ✓ TypeScript compilation: Build successful
  ✓ ESLint: No linting errors
  
... (more checks)

Summary:
  Total Checks:     42
  ✓ Passed:        42
  ✗ Failed:        0
  ⚠ Warnings:      0

✅ DEPLOYMENT READY!
All checks passed. The application is ready for deployment.
═══════════════════════════════════════════════════════════════
```

### Status Indicators

- ✓ **PASS** (Green) - Check passed successfully
- ✗ **FAIL** (Red) - Critical failure - MUST fix before deployment
- ⚠ **WARN** (Yellow) - Non-critical issue - review before deployment
- ○ **SKIP** (Cyan) - Check skipped (usually due to missing dependencies)

### Quick Fixes

| Issue | Fix |
|-------|-----|
| "AI Configuration not found" | `node scripts/check-ai-config.js` |
| "pgvector extension missing" | Run in Supabase: `CREATE EXTENSION IF NOT EXISTS vector;` |
| "Migrations not applied" | `npx prisma migrate deploy` |
| "TypeScript compilation failed" | `npm run build` → fix errors |
| "Missing .env.local" | `cp .env.example .env.local` → edit with real values |

### Documentation

- **Complete guide**: `docs/PRE_DEPLOYMENT_VALIDATION.md`
- **Quick reference**: `docs/PRE_DEPLOYMENT_QUICK_REFERENCE.md`
- **Implementation summary**: `docs/PRE_DEPLOYMENT_VALIDATION_COMPLETE.md`

---

## 🔄 Knowledge Base Re-processing Script

**File**: `scripts/reprocess-knowledge-base.js`  
**Command**: `npm run reprocess-kb`

This script re-processes all existing documents in your knowledge base using the new Supabase Edge Function for improved performance and reliability.

## Overview

The script performs the following operations:

1. **Clears existing chunks**: Removes all existing `KnowledgeChunk` records to avoid duplication
2. **Fetches knowledge items**: Gets all `KnowledgeItem` records with type 'FILE' and valid file paths
3. **Processes each document**: Calls the Supabase Edge Function for each document
4. **Updates status**: Tracks processing status and provides detailed logging
5. **Reports results**: Provides a comprehensive final report with statistics

## Usage

### Run the script

```bash
npm run reprocess-kb
```

### Prerequisites

Before running this script, ensure you have:

1. **Environment variables configured** (see `.env` file):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Supabase Edge Function deployed**:
   - The `file-processor` Edge Function must be deployed and working
   - You can test it using `node test-edge-function.js`

3. **Database access**:
   - The script uses Prisma to connect to your PostgreSQL database
   - Make sure your database is accessible and migrations are up to date

### What happens during processing

1. **Initialization**: The script connects to Supabase and Prisma
2. **Cleanup**: All existing `KnowledgeChunk` records are deleted
3. **Processing**: Each knowledge item is processed individually with:
   - Status updates in the database
   - Progress logging to the console
   - Error handling and recovery
   - 1-second delay between items to avoid rate limiting

### Output and logging

The script provides detailed console output including:

- 🚀 Start time and configuration
- 🧹 Cleanup progress
- 📋 Knowledge items found
- 🔄 Processing progress for each document
- 📊 Periodic progress updates (every 5 items)
- 📋 Final comprehensive report

### Example output

```
🚀 Starting Knowledge Base Re-processing...
📅 Started at: 2024-01-20T10:30:00.000Z

🧹 Clearing existing knowledge chunks...
✅ Deleted 1,250 existing knowledge chunks

📋 Fetching all knowledge items...
📊 Found 45 knowledge items to process

🔄 Starting document processing...

🔄 Processing 1/45: "Exercise Science Fundamentals"
   📁 File: exercise-science.pdf
   📍 Path: documents/exercise-science.pdf
   ✅ Success! Created 28 chunks, 28 embeddings in 3420ms

🔄 Processing 2/45: "Nutrition Guidelines"
   📁 File: nutrition.pdf
   📍 Path: documents/nutrition.pdf
   ✅ Success! Created 15 chunks, 15 embeddings in 2100ms

...

📊 Progress: 100.0% (45/45)
   ✅ Successful: 42
   ❌ Failed: 3
   ⏭️ Skipped: 0

============================================================
📋 FINAL PROCESSING REPORT
============================================================
📅 Completed at: 2024-01-20T10:45:30.000Z
⏱️ Total time: 930 seconds
📊 Total items: 45
🔄 Processed: 45
✅ Successful: 42
❌ Failed: 3
⏭️ Skipped: 0

❌ ERRORS:
   1. Corrupted PDF File (abc-123-def)
      Error: File format not supported
   2. Missing Source File (xyz-789-ghi)
      Error: File not found in storage
   3. Large Document (mno-456-pqr)
      Error: Processing timeout

⚠️ Partial success - some documents failed to process
============================================================
```

### Error handling

The script includes comprehensive error handling:

- **Individual item errors**: Continue processing other items if one fails
- **Database errors**: Properly disconnect and report issues
- **Edge Function errors**: Retry logic and detailed error reporting
- **Timeout protection**: Each operation has reasonable timeouts

### Status tracking

Knowledge items have their status updated throughout the process:

- `PROCESSING`: Currently being processed
- `READY`: Successfully processed and ready for use
- `ERROR`: Failed to process (check logs for details)

### Performance considerations

- **Rate limiting**: 1-second delay between items to avoid overwhelming the system
- **Memory usage**: Processes items one at a time to control memory usage
- **Database connections**: Proper connection management and cleanup
- **Progress reporting**: Updates every 5 items to avoid log spam

### Troubleshooting

#### Common issues and solutions

1. **"Database connection failed"**
   - Check your DATABASE_URL in `.env`
   - Ensure the database is running and accessible

2. **"Edge Function not found"**
   - Deploy the Edge Function: `supabase functions deploy file-processor`
   - Check Supabase project settings

3. **"Service role key invalid"**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
   - Check Supabase project API settings

4. **"File not found in storage"**
   - Some knowledge items may reference deleted files
   - These will be skipped or marked as errors

5. **"Processing timeout"**
   - Large files may take longer to process
   - Check Edge Function logs in Supabase dashboard

#### Getting help

If you encounter issues:

1. Check the detailed error output from the script
2. Look at Supabase Edge Function logs
3. Verify your environment configuration
4. Test the Edge Function separately with `node test-edge-function.js`

### Post-processing

After successful completion:

1. **Verify results**: Check your knowledge base in the admin panel
2. **Test chat**: Try asking questions to ensure the RAG system works
3. **Monitor performance**: Check if response quality has improved

### Neo4j Integration (Optional)

If you're using Neo4j for graph database functionality, uncomment the graph clearing section in the script:

```javascript
// Uncomment this section if using Neo4j
async function clearGraphDatabase() {
  console.log('🧹 Clearing Neo4j graph database...');
  
  try {
    // Add your Neo4j clearing logic here
    const session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n');
    await session.close();
    
    console.log('✅ Cleared Neo4j graph database');
  } catch (error) {
    console.error('❌ Error clearing graph database:', error);
    throw error;
  }
}
```

Then call it in the `clearExistingChunks()` function.

## Safety Notes

⚠️ **Important**: This script will delete all existing knowledge chunks. Make sure you have a backup if needed.

⚠️ **Rate Limits**: The script includes delays to avoid rate limiting, but monitor your Supabase usage.

⚠️ **Cost Consideration**: Re-processing generates new embeddings, which may incur costs depending on your usage.

## Files Modified

The script interacts with:

- `KnowledgeItem` records (status updates)
- `KnowledgeChunk` records (deletion and creation)
- Supabase Storage (file access)
- Edge Function `file-processor` (document processing)
