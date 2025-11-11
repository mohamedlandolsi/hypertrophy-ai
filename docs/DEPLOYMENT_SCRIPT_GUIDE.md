# Deployment Script Guide

**Complete guide to using the automated deployment script for HypertroQ**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Deployment Workflow](#deployment-workflow)
4. [Command Reference](#command-reference)
5. [Configuration](#configuration)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

The deployment script (`scripts/deploy.ts`) provides a comprehensive, automated deployment workflow with:

- ✅ Pre-deployment validation (40+ checks)
- ✅ Automatic backup before deployment
- ✅ Production build and database migrations
- ✅ Deployment to Vercel or custom platforms
- ✅ Post-deployment verification
- ✅ Automatic rollback on failure
- ✅ Detailed logging and error tracking

### What It Does

**Phase 1: Pre-Deployment Validation**
- Runs complete validation checklist (`npm run validate:deployment`)
- Checks database, code quality, environment, features, UI/UX
- **Stops deployment if critical issues found**

**Phase 2: Backup**
- Records current git commit
- Creates database metadata backup
- Enables quick rollback if needed

**Phase 3: Build**
- Runs `npm run build` with full TypeScript compilation
- Generates Prisma client
- Optimizes production bundle

**Phase 4: Database Migrations**
- Applies pending migrations with `npx prisma migrate deploy`
- Ensures database schema is up-to-date
- Critical phase - failure triggers rollback option

**Phase 5: Database Seeding (Optional)**
- Seeds initial data if needed
- Checks if AI Configuration exists
- Non-critical - continues even if skipped

**Phase 6: Deployment**
- Deploys to Vercel (default)
- Supports custom deployment platforms
- Manual mode for custom workflows

**Phase 7: Post-Deployment Verification**
- Tests database connection
- Verifies AI Configuration
- Checks data integrity
- Tests deployment URL accessibility

**Phase 8: Notifications**
- Sends deployment status to webhook (if configured)
- Includes errors, duration, deployment URL

---

## 🚀 Quick Start

### First-Time Setup

1. **Ensure pre-deployment validation works:**
   ```powershell
   npm run validate:deployment
   ```
   Fix any critical issues before proceeding.

2. **Configure deployment platform (optional):**
   ```powershell
   # Add to .env.local (default is vercel)
   DEPLOYMENT_PLATFORM=vercel
   
   # Optional: Notification webhook
   DEPLOYMENT_WEBHOOK=https://your-webhook-url.com/notify
   ```

3. **Install Vercel CLI (if using Vercel):**
   ```powershell
   npm install -g vercel
   vercel login
   ```

### Standard Deployment

```powershell
# Full deployment (recommended)
npm run deploy

# OR with explicit command
npx tsx scripts/deploy.ts
```

### Safe First Deployment (Dry Run)

```powershell
# Test deployment without actually deploying
npm run deploy:dry-run

# This will:
# - Run all validation checks
# - Simulate build and migration steps
# - Show what would happen
# - NOT actually deploy
```

---

## 📖 Deployment Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Pre-Deployment Validation                         │
│  ✓ Database connection and schema                           │
│  ✓ TypeScript build check                                   │
│  ✓ Environment variables                                    │
│  ✓ AI Configuration                                         │
│  ✓ 40+ automated checks                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Backup Current State                              │
│  ✓ Record current git commit                                │
│  ✓ Create database metadata backup                          │
│  ✓ Save backup file with timestamp                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Build Application                                 │
│  ✓ Generate Prisma client                                   │
│  ✓ Compile TypeScript                                       │
│  ✓ Create optimized Next.js production build                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Database Migrations                               │
│  ✓ Apply pending migrations                                 │
│  ✓ Update database schema                                   │
│  ✓ CRITICAL: Failure triggers rollback prompt               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Database Seeding (Optional)                       │
│  ✓ Check if seeding needed                                  │
│  ✓ Create AI Configuration if missing                       │
│  ✓ Non-critical: continues even if fails                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: Deploy to Hosting Platform                        │
│  ✓ Deploy to Vercel (or custom platform)                    │
│  ✓ Capture deployment URL                                   │
│  ✓ Stream deployment output                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 7: Post-Deployment Verification                      │
│  ✓ Wait for deployment to stabilize                         │
│  ✓ Test database connection                                 │
│  ✓ Verify AI Configuration                                  │
│  ✓ Check data integrity                                     │
│  ✓ Test deployment URL                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 8: Send Notifications                                │
│  ✓ Send success/failure notification                        │
│  ✓ Include deployment details                               │
│  ✓ Save comprehensive deployment log                        │
└─────────────────────────────────────────────────────────────┘
```

### Success Output Example

```
═══════════════════════════════════════════════════════════════
  HypertroQ Deployment Script
═══════════════════════════════════════════════════════════════

[2025-11-11T10:00:00.000Z] ℹ Deployment started at: 2025-11-11T10:00:00.000Z
[2025-11-11T10:00:00.001Z] ℹ Platform: vercel

═══════════════════════════════════════════════════════════════
  Phase 1: Pre-Deployment Validation
═══════════════════════════════════════════════════════════════

[2025-11-11T10:00:01.234Z] ℹ Running comprehensive pre-deployment validation...
[2025-11-11T10:00:30.456Z] ✓ Pre-deployment validation passed

═══════════════════════════════════════════════════════════════
  Phase 2: Creating Backup
═══════════════════════════════════════════════════════════════

[2025-11-11T10:00:31.123Z] ℹ Current commit: a1b2c3d4
[2025-11-11T10:00:32.456Z] ✓ Backup created: backups/pre-deployment-2025-11-11T10-00-32.json
[2025-11-11T10:00:32.789Z] ℹ Backed up metadata for 150 users, 200 knowledge items

... (continues through all phases)

═══════════════════════════════════════════════════════════════
  Deployment Complete! 🎉
═══════════════════════════════════════════════════════════════

[2025-11-11T10:05:00.000Z] ✓ All phases completed successfully
[2025-11-11T10:05:00.001Z] ℹ Total time: 300s
[2025-11-11T10:05:00.002Z] ℹ Deployment URL: https://hypertroq.vercel.app

✓ DEPLOYMENT SUCCESSFUL
```

---

## 🔧 Command Reference

### Basic Commands

```powershell
# Full deployment with all checks
npm run deploy

# Dry run (test without deploying)
npm run deploy:dry-run

# Deploy to Vercel (same as npm run deploy)
npm run deploy:vercel

# Rollback to previous deployment
npm run rollback
```

### Advanced Options

```powershell
# Skip pre-deployment validation (NOT RECOMMENDED)
npx tsx scripts/deploy.ts --skip-validation

# Skip database seeding
npx tsx scripts/deploy.ts --skip-seed

# Dry run (simulate deployment)
npx tsx scripts/deploy.ts --dry-run

# Rollback to previous commit
npx tsx scripts/deploy.ts --rollback

# Combine options
npx tsx scripts/deploy.ts --skip-seed --dry-run
```

### Pre-Deployment Only

```powershell
# Run validation checks without deploying
npm run validate:deployment

# OR
npm run pre-deploy
```

---

## ⚙️ Configuration

### Environment Variables

Add these to `.env.local`:

```bash
# Deployment platform: vercel | custom | manual
DEPLOYMENT_PLATFORM=vercel

# Optional: Webhook for deployment notifications
DEPLOYMENT_WEBHOOK=https://your-webhook.com/notify

# Required for deployment
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Gemini AI (required)
GEMINI_API_KEY="your-gemini-api-key"

# LemonSqueezy (required for subscriptions)
LEMONSQUEEZY_API_KEY="your-api-key"
LEMONSQUEEZY_WEBHOOK_SECRET="your-webhook-secret"
LEMONSQUEEZY_STORE_ID="12345"
```

### Deployment Configuration

Edit `scripts/deploy.ts` to customize:

```typescript
const config: DeploymentConfig = {
  platform: 'vercel',           // or 'custom' or 'manual'
  backupBeforeDeploy: true,     // Create backup before deploy
  notificationWebhook: process.env.DEPLOYMENT_WEBHOOK,
  rollbackOnFailure: true,      // Offer rollback on failure
};
```

### Platform-Specific Setup

#### Vercel (Default)

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy
npm run deploy
```

#### Custom Platform

```typescript
// In scripts/deploy.ts, modify deployToHosting():

case 'custom':
  // Add your custom deployment logic
  logInfo('Running custom deployment...');
  await execAsync('your-custom-deploy-command');
  return true;
```

#### Manual Deployment

```powershell
# Build locally
npm run deploy -- --platform manual

# Then manually deploy .next directory
# to your hosting platform
```

---

## 🔄 Rollback Procedures

### Automatic Rollback

When deployment fails, the script will prompt:

```
✗ Deployment failed at phase: Database Migrations

Do you want to rollback? (yes/no): 
```

Type `yes` to automatically rollback to the previous commit.

### Manual Rollback

```powershell
# Option 1: Use rollback command
npm run rollback

# Option 2: Git rollback
git log --oneline -n 5                    # Find previous commit
git checkout -b rollback-branch           # Create rollback branch
git reset --hard <previous-commit-hash>   # Reset to previous state

# Option 3: Vercel dashboard
# Go to https://vercel.com/dashboard
# Select your project > Deployments
# Click "..." on previous deployment > "Promote to Production"
```

### Rollback Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Deployment Fails                                         │
│     ✗ Error at Phase 4: Database Migrations                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Rollback Prompt                                          │
│     "Do you want to rollback? (yes/no):"                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Create Rollback Branch                                   │
│     ✓ Branch: rollback-1699876543210                        │
│     ✓ Reset to previous commit                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Manual Steps                                             │
│     ⚠ Review rollback branch                                │
│     ⚠ Rollback Vercel: vercel rollback                      │
│     ⚠ Database migrations: manual rollback if needed        │
└─────────────────────────────────────────────────────────────┘
```

### Database Migration Rollback

⚠️ **Database migrations cannot be automatically rolled back.**

If a migration causes issues:

```powershell
# Option 1: Create a reverse migration
npx prisma migrate dev --name rollback_problematic_migration

# Edit the new migration file to reverse changes
# Then apply:
npx prisma migrate deploy

# Option 2: Restore from backup
# Use the backup file created before deployment
# Located at: backups/pre-deployment-<timestamp>.json
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Pre-Deployment Validation Fails

**Symptom**: Deployment stops at Phase 1

**Solution**:
```powershell
# Run validation separately to see details
npm run validate:deployment

# Fix issues shown in output
# Common fixes:
# - Update environment variables
# - Run database migrations
# - Fix TypeScript errors
# - Create AI Configuration
```

#### 2. Build Fails

**Symptom**: Phase 3 fails with TypeScript errors

**Solution**:
```powershell
# Clear cache and rebuild
Remove-Item .next -Recurse -Force
Remove-Item node_modules\.cache -Recurse -Force
npm run build

# If still failing, check syntax errors
npx tsc --noEmit
```

#### 3. Database Migration Fails

**Symptom**: Phase 4 fails with "migration error"

**Solution**:
```powershell
# Check migration status
npx prisma migrate status

# If drift detected, run:
npx prisma migrate resolve --applied <migration-name>

# Or reset (DEVELOPMENT ONLY):
npx prisma migrate reset
```

#### 4. Vercel Deployment Fails

**Symptom**: Phase 6 fails with Vercel error

**Solution**:
```powershell
# Check Vercel CLI installation
vercel --version

# Re-login to Vercel
vercel logout
vercel login

# Check project link
vercel link

# Try manual deployment
vercel --prod
```

#### 5. Post-Deployment Verification Fails

**Symptom**: Phase 7 shows warnings

**Solution**:
- **Database connection error**: Check DATABASE_URL in Vercel environment
- **AI Configuration missing**: Run `npm run seed` or create via admin UI
- **Deployment URL not accessible**: Wait a few minutes, DNS may be propagating

### Debug Mode

Enable detailed logging:

```powershell
# Set debug environment variable
$env:DEBUG="*"
npm run deploy

# Check deployment logs
Get-Content logs\deployment-*.json
```

### Deployment Logs

All deployments create detailed logs:

```powershell
# View recent deployment logs
Get-ChildItem logs\deployment-*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content | ConvertFrom-Json
```

Log structure:
```json
{
  "startTime": "2025-11-11T10:00:00.000Z",
  "endTime": "2025-11-11T10:05:00.000Z",
  "duration": 300000,
  "phase": "notifications",
  "previousCommit": "a1b2c3d4e5f6g7h8",
  "backupFile": "backups/pre-deployment-2025-11-11.json",
  "deploymentUrl": "https://hypertroq.vercel.app",
  "errors": [],
  "success": true,
  "options": {
    "skipValidation": false,
    "skipSeed": false,
    "dryRun": false
  }
}
```

---

## 🤖 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run deployment
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          LEMONSQUEEZY_API_KEY: ${{ secrets.LEMONSQUEEZY_API_KEY }}
          LEMONSQUEEZY_WEBHOOK_SECRET: ${{ secrets.LEMONSQUEEZY_WEBHOOK_SECRET }}
          LEMONSQUEEZY_STORE_ID: ${{ secrets.LEMONSQUEEZY_STORE_ID }}
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npm run deploy
      
      - name: Upload deployment logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: deployment-logs
          path: logs/deployment-*.json
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  image: node:18
  only:
    - main
  script:
    - npm ci
    - npm run deploy
  artifacts:
    when: always
    paths:
      - logs/deployment-*.json
  environment:
    name: production
    url: https://hypertroq.vercel.app
```

### Vercel Deploy Hooks

For automatic deployment on git push:

```powershell
# Get your Vercel project
vercel --prod

# In Vercel dashboard:
# Settings > Git > Enable automatic deployments
```

---

## 📊 Monitoring & Alerts

### Webhook Notifications

Configure webhook for deployment alerts:

```typescript
// Webhook payload structure
{
  success: boolean,
  timestamp: string,
  commit: string,
  deploymentUrl: string,
  errors: Array<{
    phase: string,
    error: string,
    timestamp: string
  }>,
  duration: number
}
```

### Slack Integration

```bash
# Set webhook URL
DEPLOYMENT_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Discord Integration

```bash
# Set webhook URL
DEPLOYMENT_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK
```

---

## ✅ Best Practices

### Before Every Deployment

1. ✅ **Run validation**: `npm run validate:deployment`
2. ✅ **Test locally**: `npm run build && npm start`
3. ✅ **Review changes**: `git diff origin/main`
4. ✅ **Update changelog**: Document what's being deployed
5. ✅ **Backup manually** (optional): Extra safety for major changes

### Production Deployment

1. ✅ **Use dry run first**: `npm run deploy:dry-run`
2. ✅ **Deploy during low traffic**: Off-peak hours
3. ✅ **Monitor after deployment**: Watch error logs for 15-30 minutes
4. ✅ **Test critical paths**: Auth, subscriptions, chat, programs
5. ✅ **Keep rollback ready**: Know how to rollback quickly

### Security Checklist

- ✅ Never commit `.env.local` with secrets
- ✅ Use environment variables for all credentials
- ✅ Rotate API keys after sharing repository
- ✅ Enable 2FA on deployment platforms
- ✅ Review Vercel environment variables regularly

---

## 📚 Related Documentation

- **Pre-Deployment Validation**: `docs/PRE_DEPLOYMENT_VALIDATION.md`
- **Performance Testing**: `tests/performance/PERFORMANCE_TESTING_GUIDE.md`
- **Database Migrations**: `migrations/README.md`
- **Immediate Fixes**: `docs/IMMEDIATE_FIXES_NEEDED.md`

---

## 🆘 Getting Help

**Deployment fails and unsure why?**

1. Check deployment log: `logs/deployment-<timestamp>.json`
2. Review specific phase that failed
3. Consult troubleshooting section above
4. Check related documentation

**Still stuck?**

1. Run validation with full output: `npm run validate:deployment`
2. Check all environment variables are set correctly
3. Verify database connection: `node check-database-status.js`
4. Test Vercel CLI: `vercel --version`

---

## 🎯 Quick Reference

```powershell
# Standard deployment
npm run deploy

# Safe test deployment
npm run deploy:dry-run

# Rollback
npm run rollback

# Validation only
npm run validate:deployment

# View logs
Get-ChildItem logs\deployment-*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

**Remember**: The deployment script is designed to be safe. It will:
- ✅ Validate before deploying
- ✅ Create backups automatically
- ✅ Stop on critical errors
- ✅ Offer rollback on failure
- ✅ Log everything for troubleshooting

**Deploy with confidence! 🚀**
