# Deployment Script - Quick Reference

**Fast reference for deploying HypertroQ**

## 🚀 Quick Commands

```powershell
# Standard deployment (recommended)
npm run deploy

# Test without deploying (safe)
npm run deploy:dry-run

# Rollback to previous
npm run rollback

# Validation only
npm run validate:deployment
```

---

## 📋 Deployment Checklist

### Before Deploying

- [ ] Run `npm run validate:deployment` - all checks pass?
- [ ] Test locally: `npm run build && npm start`
- [ ] Review changes: `git diff origin/main`
- [ ] Update `LEMONSQUEEZY_STORE_ID` in `.env.local` (if not done)
- [ ] Commit all changes: `git add -A && git commit -m "..."`

### During Deployment

The script will automatically:
1. ✅ Run 40+ validation checks
2. ✅ Create backup of current state
3. ✅ Build production bundle
4. ✅ Apply database migrations
5. ✅ Seed database (if needed)
6. ✅ Deploy to Vercel
7. ✅ Verify deployment worked
8. ✅ Send notification (if configured)

### After Deployment

- [ ] Check deployment URL works
- [ ] Test critical features (auth, chat, subscriptions)
- [ ] Monitor error logs for 15 minutes
- [ ] Verify in Vercel dashboard

---

## ⚙️ Configuration

### Required Environment Variables

In `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# LemonSqueezy
LEMONSQUEEZY_API_KEY="your-api-key"
LEMONSQUEEZY_WEBHOOK_SECRET="your-webhook-secret"
LEMONSQUEEZY_STORE_ID="12345"  # UPDATE THIS!

# Optional: Deployment
DEPLOYMENT_PLATFORM=vercel  # or custom or manual
DEPLOYMENT_WEBHOOK=https://your-webhook.com/notify
```

### Vercel Setup (First Time)

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (first time only)
vercel link
```

---

## 🔄 Common Scenarios

### First Deployment

```powershell
# 1. Test first (no actual deployment)
npm run deploy:dry-run

# 2. Review output, fix any issues

# 3. Deploy for real
npm run deploy
```

### Regular Deployment

```powershell
# Quick validation + deploy
npm run validate:deployment && npm run deploy
```

### Emergency Rollback

```powershell
# Option 1: Automated
npm run rollback

# Option 2: Manual git
git log --oneline -n 5
git checkout -b emergency-rollback
git reset --hard <previous-commit>

# Option 3: Vercel dashboard
# Go to vercel.com > project > Deployments
# Click previous deployment > "Promote to Production"
```

### Deploy Without Validation (NOT RECOMMENDED)

```powershell
npx tsx scripts/deploy.ts --skip-validation
```

---

## 🐛 Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Validation fails | `npm run validate:deployment` to see details |
| Build fails | Clear cache: `Remove-Item .next -Recurse -Force; npm run build` |
| Migration fails | Check status: `npx prisma migrate status` |
| Vercel login issue | `vercel logout && vercel login` |
| "AI Config not found" | Run `npm run seed` or create via admin UI |
| Deployment URL 404 | Wait 2-3 minutes for DNS propagation |

### Check Deployment Logs

```powershell
# View most recent deployment log
$log = Get-ChildItem logs\deployment-*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $log.FullName | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Manual Deployment to Vercel

If automated deployment fails:

```powershell
# Build locally
npm run build

# Deploy manually
vercel --prod
```

---

## 📊 Deployment Phases

**Phase 1**: Pre-Deployment Validation (2-3 min)  
**Phase 2**: Backup Current State (< 1 min)  
**Phase 3**: Build Application (2-5 min)  
**Phase 4**: Database Migrations (< 1 min)  
**Phase 5**: Database Seeding (< 1 min, optional)  
**Phase 6**: Deploy to Hosting (2-3 min)  
**Phase 7**: Post-Deployment Verification (< 1 min)  
**Phase 8**: Send Notifications (< 5 sec)  

**Total Time**: ~8-15 minutes

---

## ⚠️ Important Notes

1. **Pre-deployment validation is critical** - don't skip it!
2. **Backup is automatic** - created before every deployment
3. **Migrations are irreversible** - rollback must be manual
4. **Deployment stops on failure** - safe by design
5. **Dry run is your friend** - test before deploying

---

## 🎯 Decision Tree

```
Need to deploy?
├─ First time deploying?
│  ├─ Yes → Run: npm run deploy:dry-run
│  │        Review output, fix issues
│  │        Then run: npm run deploy
│  └─ No → Continue
│
├─ Made critical changes?
│  ├─ Yes → Run validation first: npm run validate:deployment
│  │        Fix all critical issues
│  │        Then deploy: npm run deploy
│  └─ No → Continue
│
├─ Small updates only?
│  └─ Run: npm run deploy
│
└─ Need to rollback?
   └─ Run: npm run rollback
```

---

## 📱 One-Liner Deployments

```powershell
# Validate → Build → Deploy (safest)
npm run validate:deployment && npm run build && npm run deploy

# Just deploy (if you already validated)
npm run deploy

# Test deployment without deploying
npm run deploy:dry-run
```

---

## 🆘 Emergency Contact

**Deployment completely broken?**

1. Stop everything: `Ctrl+C`
2. Check what broke: Review terminal output
3. Rollback: `npm run rollback`
4. Fix issues locally
5. Try again with dry run: `npm run deploy:dry-run`

**Database in bad state?**

```powershell
# Check migration status
npx prisma migrate status

# If drift detected
npx prisma migrate resolve --applied <migration-name>

# If completely broken (DEVELOPMENT ONLY!)
npx prisma migrate reset
```

**Vercel deployment stuck?**

```powershell
# Cancel in Vercel dashboard
# Then try manual deployment
vercel --prod
```

---

## 📚 Full Documentation

For complete details, see: `docs/DEPLOYMENT_SCRIPT_GUIDE.md`

For validation details, see: `docs/PRE_DEPLOYMENT_VALIDATION.md`

For immediate fixes needed: `docs/IMMEDIATE_FIXES_NEEDED.md`

---

**Remember**: The deployment script is designed to be safe and will stop if anything goes wrong. Deploy with confidence! 🚀
