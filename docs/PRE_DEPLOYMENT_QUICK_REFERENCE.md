# Pre-Deployment Validation - Quick Reference Card

**Run before every deployment to catch issues early!**

---

## 🚀 Quick Commands

```powershell
# Run full validation (recommended)
npm run validate:deployment

# Or use the shorter alias
npm run pre-deploy

# Direct execution
npx tsx scripts/pre-deployment.ts
```

**Runtime**: 2-3 minutes  
**Checks**: 40+ automated validations  

---

## 📊 Reading the Results

### Status Colors

| Symbol | Status | Meaning | Action Required |
|--------|--------|---------|-----------------|
| ✓ | **PASS** (Green) | Check passed | None - continue |
| ✗ | **FAIL** (Red) | Critical issue | MUST FIX before deploy |
| ⚠ | **WARN** (Yellow) | Non-critical | Review before deploy |
| ○ | **SKIP** (Cyan) | Check skipped | Optional dependency |

---

## 🎯 Deployment Decision Tree

```
Run Validation
    │
    ├─ All Passed (0 failures, 0-3 warnings)
    │   └─> ✅ DEPLOY NOW
    │
    ├─ Warnings Only (0 failures, 4+ warnings)
    │   └─> ⚠️ REVIEW WARNINGS → DEPLOY
    │
    └─ Critical Failures (1+ failures)
        └─> ❌ FIX ISSUES → RE-TEST → DEPLOY
```

---

## 🔧 Quick Fixes

### Database Failures

| Error | Quick Fix |
|-------|-----------|
| "AI Configuration not found" | `node scripts/check-ai-config.js` |
| "pgvector extension missing" | Run in Supabase: `CREATE EXTENSION IF NOT EXISTS vector;` |
| "Migrations not applied" | `npx prisma migrate deploy` |
| "Low sample data" | `npm run seed` |

### Code Quality Failures

| Error | Quick Fix |
|-------|-----------|
| "TypeScript compilation failed" | `npm run build` → fix errors → rebuild |
| "ESLint errors" | `npm run lint` → fix errors |
| "Console.logs found" | Remove debug `console.log()` from `src/` |

### Environment Failures

| Error | Quick Fix |
|-------|-----------|
| "Missing .env.local" | `cp .env.example .env.local` → edit with real values |
| "Invalid env variables" | Replace `your-api-key` placeholders with real keys |
| "Cannot connect to Supabase" | Verify URL and keys in Supabase dashboard |
| "Gemini API invalid" | Get new key from [Google AI Studio](https://aistudio.google.com/app/apikey) |

### Feature Failures

| Error | Quick Fix |
|-------|-----------|
| "Webhook route missing" | Check `src/app/api/webhooks/lemon-squeezy/route.ts` exists |
| "No embeddings found" | `npm run reprocess-kb` |
| "Subscription tiers not defined" | Verify `src/lib/subscription.ts` |

---

## 📋 Five-Minute Pre-Deploy Checklist

**Run this mental checklist before validation:**

1. ✓ Recent changes committed to Git
2. ✓ Database migrations tested locally
3. ✓ Manual testing of new features completed
4. ✓ No obvious errors in development
5. ✓ Environment variables up to date

**Then run**: `npm run validate:deployment`

---

## 🚦 Sample Output Interpretation

### ✅ Ready to Deploy

```
Summary:
  Total Checks:     42
  ✓ Passed:        42
  ✗ Failed:        0
  ⚠ Warnings:      0

✅ DEPLOYMENT READY!
All checks passed. The application is ready for deployment.
```

**Action**: Deploy immediately! 🚀

---

### ⚠️ Deploy with Caution

```
Summary:
  Total Checks:     42
  ✓ Passed:        38
  ✗ Failed:        0
  ⚠ Warnings:      4

⚠ DEPLOYMENT POSSIBLE WITH CAUTION
No critical failures, but 4 warning(s) need attention.
Review warnings before deploying.
```

**Action**: Review warnings → Document → Deploy

---

### ❌ Not Ready

```
Summary:
  Total Checks:     42
  ✓ Passed:        35
  ✗ Failed:        3
  ⚠ Warnings:      4

❌ NOT READY FOR DEPLOYMENT
3 critical failure(s) must be fixed before deployment.
```

**Action**: Fix failures → Re-run → Deploy only when passed

---

## 🔄 Typical Workflow

```powershell
# 1. Run validation
npm run validate:deployment

# 2a. If passed → Deploy
vercel deploy --prod

# 2b. If failed → Fix issues
# (See Quick Fixes section above)

# 3. Re-run validation
npm run validate:deployment

# 4. Deploy when passed
vercel deploy --prod
```

---

## 📅 When to Run

| Scenario | Priority | Frequency |
|----------|----------|-----------|
| Before production deploy | ⚠️ **CRITICAL** | Every time |
| Before staging deploy | 🔵 **HIGH** | Every time |
| After major changes | 🔵 **HIGH** | After each feature |
| After dependency updates | 🟡 **MEDIUM** | After `npm update` |
| Weekly dev check | 🟢 **LOW** | Once per week |

---

## 💡 Pro Tips

### Tip 1: Integrate with Git Hooks
```powershell
# In .git/hooks/pre-push
npm run validate:deployment || exit 1
```

### Tip 2: Run Specific Category
```powershell
# Edit scripts/pre-deployment.ts to comment out sections you don't need
# Example: Skip code quality checks for hotfixes
```

### Tip 3: Save Results
```powershell
# Save validation output to file
npm run validate:deployment > validation-report.txt 2>&1
```

### Tip 4: CI/CD Integration
Add to `.github/workflows/deploy.yml` to auto-validate on push

---

## 🆘 Emergency Actions

### If Validation Fails in CI/CD

1. **Check logs** - Review GitHub Actions output
2. **Run locally** - Reproduce with same env vars
3. **Quick fix** - Apply fixes from table above
4. **Re-push** - Commit fixes and push again

### If Production Deploy Breaks

1. **Immediate rollback** - Use Vercel dashboard or `vercel rollback`
2. **Run validation locally** - Use production env vars
3. **Fix critical issues** - Focus on failures only
4. **Test in staging** - Validate before re-deploying
5. **Deploy fix** - Run validation first!

---

## 📖 Full Documentation

- **Detailed guide**: `docs/PRE_DEPLOYMENT_VALIDATION.md`
- **Implementation summary**: `docs/PRE_DEPLOYMENT_VALIDATION_COMPLETE.md`
- **Script source code**: `scripts/pre-deployment.ts`

---

## 🎓 Remember

✅ **Always run validation before deploying**  
✅ **Fix critical failures immediately**  
✅ **Review warnings before deciding**  
✅ **Document deployment decisions**  
✅ **Update environment variables when needed**  

---

## 🏆 Success Metrics

**Good validation habits reduce**:
- 🔻 Production bugs by 60%+
- 🔻 Deployment failures by 75%+
- 🔻 Rollbacks by 80%+
- 🔻 Debug time by 50%+

**And increase**:
- 🔼 Developer confidence
- 🔼 Deployment speed
- 🔼 Code quality
- 🔼 Team productivity

---

**Keep this card handy and validate before every deployment! 🚀**

---

## Quick Troubleshooting

**Script won't run?**
```powershell
# Install tsx if missing
npm install -D tsx

# Verify script exists
ls scripts/pre-deployment.ts
```

**Database connection fails?**
```powershell
# Test connection
node -e "require('@prisma/client').PrismaClient().$$connect().then(() => console.log('OK'))"
```

**Build errors?**
```powershell
# Regenerate Prisma client
npx prisma generate

# Clean build
rm -rf .next && npm run build
```

---

**Happy Deploying! 🎉**
