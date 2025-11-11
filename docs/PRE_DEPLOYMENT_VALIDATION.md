# Pre-Deployment Validation Guide

**Comprehensive validation checklist to ensure HypertroQ is ready for deployment.**

## 🚀 Quick Start

Run the validation script before every deployment:

```powershell
npm run validate:deployment
```

Or use the alias:

```powershell
npm run pre-deploy
```

Or run directly:

```powershell
npx tsx scripts/pre-deployment.ts
```

---

## 📋 What Gets Validated

The script performs **40+ checks** across 5 critical categories:

### 1. Database Validation (8 checks)

✓ **Database connection** - Verifies PostgreSQL connectivity  
✓ **Migrations applied** - Checks latest migration status  
✓ **pgvector extension** - Required for RAG/embeddings  
✓ **Performance indexes** - Key indexes for query optimization  
✓ **Orphaned records** - Detects data integrity issues  
✓ **AI Configuration** - Validates singleton exists with system prompt  
✓ **Sample data** - Ensures database is seeded  
✓ **Data counts** - Verifies users, knowledge, exercises present  

### 2. Code Quality (5 checks)

✓ **TypeScript compilation** - Runs full build (`npm run build`)  
✓ **ESLint validation** - Checks for linting errors  
✓ **Production console.logs** - Scans for leftover debug statements  
✓ **TODO/FIXME comments** - Identifies pending work  
✓ **Critical errors** - Ensures no console.error in production paths  

### 3. Environment Configuration (7 checks)

✓ **.env.local file** - Verifies environment file exists  
✓ **Required variables** - Validates all critical env vars are set  
✓ **Database credentials** - Tests `DATABASE_URL` and `DIRECT_URL`  
✓ **Supabase connection** - Live API test  
✓ **Gemini API** - Validates Google AI key  
✓ **LemonSqueezy API** - Tests subscription service connectivity  
✓ **Third-party APIs** - Ensures external services responding  

### 4. Feature Configuration (6 checks)

✓ **Subscription tiers** - Validates FREE/PRO_MONTHLY/PRO_YEARLY defined  
✓ **Tier enforcement** - Checks usage limit functions exist  
✓ **Free trial** - Verifies message tracking configured  
✓ **Webhook endpoints** - Ensures LemonSqueezy webhook route exists  
✓ **RAG system** - Checks for embeddings in knowledge base  
✓ **Exercise library** - Validates exercise data populated  

### 5. UI/UX Validation (6 checks)

✓ **Critical pages** - Verifies home, chat, programs, pricing pages exist  
✓ **API routes** - Checks core API endpoints are present  
✓ **Tailwind config** - Ensures styling configured  
✓ **Mobile responsive** - Validates viewport meta tags  
✓ **Internationalization** - Checks language files (ar, en, fr)  
✓ **Navigation** - Ensures no broken links in core flows  

---

## 📊 Understanding the Output

### Status Symbols

- ✓ **PASS** (Green) - Check passed successfully
- ✗ **FAIL** (Red) - Critical failure - must fix before deployment
- ⚠ **WARN** (Yellow) - Non-critical issue - review before deployment
- ○ **SKIP** (Cyan) - Check skipped (usually due to missing dependencies)

### Example Output

```
═══════════════════════════════════════════════════════════════
  HYPERTROQ PRE-DEPLOYMENT VALIDATION
═══════════════════════════════════════════════════════════════

Starting comprehensive validation...
This may take 2-3 minutes to complete.

▶ 1. Database Validation

  ✓ Database connection: Successfully connected to PostgreSQL
  ✓ Migrations applied: Latest: 20241107_add_subscription_tiers...
  ✓ pgvector extension: Installed and enabled
  ✓ Performance indexes: 15 key indexes found
  ✓ Orphaned records: No orphaned knowledge chunks
  ✓ AI Configuration: Singleton exists with valid system prompt
  ✓ Sample data: Users: 5, Knowledge: 250, Exercises: 120
  
▶ 2. Code Quality Validation

  ○ Running TypeScript compilation (this may take a minute)...
  ✓ TypeScript compilation: Build successful
  ○ Running ESLint...
  ✓ ESLint: No linting errors
  ⚠ Production console.logs: 3 console.log statements found - remove for production
  ⚠ TODO/FIXME comments: 7 TODO/FIXME comments found - review before deployment

... (more checks)

═══════════════════════════════════════════════════════════════

Summary:
  Total Checks:     42
  ✓ Passed:        35
  ✗ Failed:        0
  ⚠ Warnings:      7
  ○ Skipped:       0

⚠ WARNINGS (7):
  ⚠ [Code Quality] Production console.logs
    └─ 3 console.log statements found - remove for production
  ⚠ [Code Quality] TODO/FIXME comments
    └─ 7 TODO/FIXME comments found - review before deployment
  ... (more warnings)

═══════════════════════════════════════════════════════════════
⚠ DEPLOYMENT POSSIBLE WITH CAUTION
No critical failures, but 7 warning(s) need attention.
Review warnings before deploying.
═══════════════════════════════════════════════════════════════
```

---

## 🔧 Fixing Common Issues

### Database Issues

**Problem**: "AI Configuration singleton missing"

```powershell
# Fix: Create AI configuration
node scripts/check-ai-config.js
```

**Problem**: "pgvector extension not installed"

```sql
-- Run in Supabase SQL Editor or psql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Problem**: "Migrations not applied"

```powershell
npx prisma migrate deploy
```

**Problem**: "Low sample data counts"

```powershell
npm run seed
```

---

### Code Quality Issues

**Problem**: "TypeScript compilation failed"

```powershell
# Check for TypeScript errors
npm run build

# Review errors and fix them
# Common fixes:
# - Add missing imports
# - Fix type mismatches
# - Update Prisma client: npx prisma generate
```

**Problem**: "ESLint errors found"

```powershell
# Run linter
npm run lint

# Auto-fix where possible
npx eslint . --fix
```

**Problem**: "console.log statements found"

```powershell
# Search for console.logs
grep -r "console.log" src/

# Remove debug statements (keep error logging)
# Acceptable: console.error(), console.warn() in error handlers
# Remove: console.log() in production code
```

---

### Environment Issues

**Problem**: "Missing .env.local file"

```powershell
# Copy example file
cp .env.example .env.local

# Edit and add your credentials
```

**Problem**: "Invalid environment variables"

Check your `.env.local` and ensure:

```bash
# Required Variables
DATABASE_URL="postgresql://..."  # Valid PostgreSQL connection string
DIRECT_URL="postgresql://..."    # Valid direct connection string

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."  # Real key, not placeholder
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."     # Real key, not placeholder

GEMINI_API_KEY="AIzaSyC..."  # Valid Google AI key (starts with AIza)

LEMONSQUEEZY_API_KEY="eyJ0eXA..."  # Valid LemonSqueezy key
LEMONSQUEEZY_STORE_ID="12345"      # Your store ID
LEMONSQUEEZY_WEBHOOK_SECRET="..."  # Webhook signing secret
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID="67890"
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID="67891"
```

**Problem**: "Cannot connect to Supabase"

1. Verify URL in Supabase dashboard (Settings → API)
2. Regenerate anon key if needed
3. Check network connectivity
4. Verify Supabase project is not paused

**Problem**: "Gemini API invalid"

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Ensure billing is enabled (if required)
3. Check API quota and limits

**Problem**: "LemonSqueezy API invalid"

1. Get API key from [LemonSqueezy Settings](https://app.lemonsqueezy.com/settings/api)
2. Verify store ID matches your store
3. Check webhook signing secret

---

### Feature Issues

**Problem**: "Subscription tiers not defined"

Verify `src/lib/subscription.ts` contains:

```typescript
export const SUBSCRIPTION_TIER_LIMITS: Record<SubscriptionTier, UserPlanLimits> = {
  FREE: { ... },
  PRO_MONTHLY: { ... },
  PRO_YEARLY: { ... },
};
```

**Problem**: "Missing webhook route"

Create file at `src/app/api/webhooks/lemon-squeezy/route.ts`

**Problem**: "No embeddings found"

```powershell
# Reprocess knowledge base to generate embeddings
npm run reprocess-kb
```

**Problem**: "Low exercise count"

```powershell
# Seed exercise library
npm run seed
```

---

### UI/UX Issues

**Problem**: "Missing critical pages"

Ensure these files exist:
- `src/app/[locale]/page.tsx` (Home)
- `src/app/[locale]/chat/page.tsx` (Chat)
- `src/app/[locale]/programs/page.tsx` (Programs)
- `src/app/[locale]/pricing/page.tsx` (Pricing)

**Problem**: "Missing API routes"

Ensure these files exist:
- `src/app/api/chat/route.ts`
- `src/app/api/programs/route.ts`
- `src/app/api/subscription/route.ts`

---

## 🎯 Deployment Readiness Criteria

### ✅ Ready for Deployment

- **0 critical failures**
- **0-5 warnings** (non-critical)
- All core features validated
- Environment configured correctly
- Code compiles without errors

### ⚠️ Deployment Possible with Caution

- **0 critical failures**
- **6-15 warnings**
- Review warnings before deploying
- Monitor closely after deployment

### ❌ Not Ready for Deployment

- **1+ critical failures**
- Must fix all critical issues first
- Re-run validation after fixes

---

## 📝 Pre-Deployment Checklist

Before running validation, manually verify:

- [ ] All recent changes committed to Git
- [ ] Database migrations created and tested locally
- [ ] Environment variables documented
- [ ] Sensitive data removed from codebase
- [ ] API keys rotated (if compromised)
- [ ] Third-party service quotas checked
- [ ] Performance tests passed (`npm run test:performance`)
- [ ] Manual testing of critical flows completed
- [ ] Backup of production database (if updating)

---

## 🔄 CI/CD Integration

Add to your deployment pipeline (e.g., GitHub Actions, Vercel):

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run validation
        run: npm run validate:deployment
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          LEMONSQUEEZY_API_KEY: ${{ secrets.LEMONSQUEEZY_API_KEY }}
          LEMONSQUEEZY_STORE_ID: ${{ secrets.LEMONSQUEEZY_STORE_ID }}
          LEMONSQUEEZY_WEBHOOK_SECRET: ${{ secrets.LEMONSQUEEZY_WEBHOOK_SECRET }}
      
      - name: Deploy to Vercel
        if: success()
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Emergency Rollback

If deployment fails validation in production:

1. **Immediate rollback** to previous version
2. **Check production logs** for errors
3. **Run validation locally** against production environment variables
4. **Fix critical issues** identified
5. **Re-test validation** in staging
6. **Deploy fix** with confidence

---

## 📖 Additional Resources

- **Performance Testing**: `tests/performance/README.md`
- **Database Status**: Run `node scripts/check-database-status.js` (if available)
- **AI Configuration**: Run `node scripts/check-ai-config.js`
- **Subscription System**: `src/lib/subscription.ts`
- **Environment Setup**: `.env.example`

---

## 🤝 Support

If validation continues to fail after fixes:

1. Check the detailed error output
2. Review the specific check that's failing
3. Verify all prerequisites are met
4. Check logs for underlying issues
5. Consult the troubleshooting section above

---

## 📅 Recommended Schedule

Run pre-deployment validation:

- ✅ **Before every deployment** (Required)
- ✅ **After major feature changes** (Recommended)
- ✅ **Weekly in staging environment** (Best practice)
- ✅ **After dependency updates** (Recommended)
- ✅ **Before production hotfixes** (Critical)

---

## ✨ Success Example

```powershell
PS D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs> npm run validate:deployment

═══════════════════════════════════════════════════════════════
  HYPERTROQ PRE-DEPLOYMENT VALIDATION
═══════════════════════════════════════════════════════════════

Starting comprehensive validation...
This may take 2-3 minutes to complete.

▶ 1. Database Validation
  ✓ Database connection: Successfully connected to PostgreSQL
  ✓ Migrations applied: Latest: 20241107_add_subscription_tiers
  ✓ pgvector extension: Installed and enabled
  ✓ Performance indexes: 18 key indexes found
  ✓ Orphaned records: No orphaned knowledge chunks
  ✓ AI Configuration: Singleton exists with valid system prompt
  ✓ Sample data: Users: 10, Knowledge: 500, Exercises: 150

▶ 2. Code Quality Validation
  ✓ TypeScript compilation: Build successful
  ✓ ESLint: No linting errors
  ✓ Production console.logs: No console.log statements found
  ✓ TODO/FIXME comments: No pending TODOs found

▶ 3. Environment Configuration
  ✓ .env.local file: Environment file exists
  ✓ Environment variables: All required variables set
  ✓ Supabase connection: Connected successfully
  ✓ Gemini API: API key valid
  ✓ LemonSqueezy API: API key valid

▶ 4. Feature Configuration
  ✓ Subscription tiers: All tiers defined (FREE, PRO_MONTHLY, PRO_YEARLY)
  ✓ Tier enforcement: Enforcement functions present
  ✓ Webhook endpoints: LemonSqueezy webhook route exists
  ✓ Free trial: Free messages tracking configured
  ✓ RAG system: 450 chunks with embeddings
  ✓ Exercise library: 150 exercises (145 categorized)

▶ 5. UI/UX Validation
  ✓ Critical pages: All critical pages exist
  ✓ API routes: All critical API routes exist
  ✓ Tailwind config: Configuration file exists
  ✓ Mobile responsive: Viewport meta tag configured
  ✓ Internationalization: 3 languages configured

Summary:
  Total Checks:     42
  ✓ Passed:        42
  ✗ Failed:        0
  ⚠ Warnings:      0
  ○ Skipped:       0

═══════════════════════════════════════════════════════════════
✅ DEPLOYMENT READY!
All checks passed. The application is ready for deployment.
═══════════════════════════════════════════════════════════════
```

**Happy Deploying! 🚀**
