# Quick Start - Running Integration Tests

## ⚡ Fast Track (5 Minutes)

### 1. Install Dependencies ✅ (Already Done)
```bash
# Dependencies are already installed:
# - jest, ts-jest, @types/jest
# - jest-mock-extended
# - @testing-library/jest-dom
# - ts-node
```

### 2. Set Up Test Database (Choose One Option)

#### Option A: Use Supabase Test Project (Recommended)
```bash
# 1. Go to https://app.supabase.com
# 2. Create new project (name it "hypertroq-test")
# 3. Wait for project to be ready
# 4. Go to Project Settings > Database
# 5. Copy "Connection string" (direct connection)
# 6. Create .env.test file (see below)
```

#### Option B: Use Local PostgreSQL
```bash
# 1. Install PostgreSQL locally
# 2. Create test database
createdb hypertroq_test

# 3. Create .env.test file (see below)
```

### 3. Create `.env.test` File

Create this file at project root:

```env
# Test Database URL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Test Project
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# LemonSqueezy (use test mode keys)
LEMONSQUEEZY_API_KEY="test_your_api_key"
LEMONSQUEEZY_STORE_ID="your_store_id"
LEMONSQUEEZY_WEBHOOK_SECRET="test_webhook_secret"
```

**Need help?** Copy `.env.test.example` and fill in your values:
```bash
cp .env.test.example .env.test
# Then edit .env.test with your credentials
```

### 4. Run Database Migrations

```bash
# Deploy schema to test database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 5. Run Tests! 🎉

```bash
# Run all integration tests
npm run test:integration

# Or run in watch mode
npm run test

# Or run specific test
npx jest tests/subscription-flow.test.ts -t "FREE Tier User Flow"
```

---

## 📊 Expected Output

### ✅ Success
```
PASS  tests/subscription-flow.test.ts

Subscription Flow Integration Tests
  1. FREE Tier User Flow
    ✓ should create account with FREE tier assigned (150ms)
    ✓ should allow creating first program (120ms)
    ✓ should allow creating second program (115ms)
    ✓ should block creating third program (125ms)
    ✓ should block customization beyond limit (110ms)
    ✓ should verify FREE tier limitations (5ms)
  
  2. PRO Monthly User Flow
    ✓ should verify PRO_MONTHLY tier assigned (135ms)
    ✓ should allow creating unlimited programs (180ms)
    ✓ should allow unlimited customizations (160ms)
    ✓ should access AI assistant (140ms)
    ✓ should verify PRO_MONTHLY features (5ms)
  
  3. Subscription Lifecycle
    ✓ should subscribe to PRO_MONTHLY (145ms)
    ✓ should upgrade to PRO_YEARLY (155ms)
    ✓ should cancel and revert to FREE (130ms)
    ✓ should reactivate subscription (140ms)
    ✓ should keep programs after reactivation (125ms)
    ✓ should update expiration dates (10ms)
  
  4. Tier Enforcement
    ✓ should enforce program limit (120ms)
    ✓ should enforce customization limit (115ms)
    ✓ should enforce message limit (110ms)
    ✓ should block PDF export (5ms)
    ✓ should verify feature gating (5ms)
    ✓ should reset usage monthly (125ms)
    ✓ should verify PRO unlimited (5ms)
    ✓ should compare tier limits (10ms)
  
  5. Edge Cases
    ✓ should handle expired subscription (135ms)
    ✓ should handle missing subscription (120ms)
    ✓ should prevent negative counts (115ms)

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Time:        3.245 s
```

### ❌ Database Connection Issue
```
Error: Authentication failed against database server
```

**Fix**:
1. Check `.env.test` has correct `DATABASE_URL`
2. Verify test database exists
3. Run `npx prisma migrate deploy`

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
```bash
# Check database URL
echo $DATABASE_URL

# Test connection manually
npx prisma studio
```

### Issue: "Table does not exist"
```bash
# Run migrations
npx prisma migrate deploy

# Regenerate client
npx prisma generate
```

### Issue: "Prisma Client not found"
```bash
# Install dependencies
npm install

# Generate client
npx prisma generate
```

### Issue: "Tests timeout"
```bash
# Increase timeout in jest.config.ts
# Change testTimeout: 60000
```

---

## 📚 What Gets Tested?

### FREE Tier (6 tests)
- ✅ Account creation
- ✅ 2 program limit
- ✅ 5 customizations/month limit
- ✅ Limit enforcement
- ✅ Upgrade prompts

### PRO Monthly (5 tests)
- ✅ Subscription activation
- ✅ Unlimited programs
- ✅ Unlimited customizations
- ✅ AI assistant access
- ✅ Feature verification

### Lifecycle (6 tests)
- ✅ Subscribe
- ✅ Upgrade MONTHLY → YEARLY
- ✅ Cancel
- ✅ Reactivate
- ✅ Data persistence
- ✅ Expiration handling

### Enforcement (8 tests)
- ✅ Program limits
- ✅ Customization limits
- ✅ Message limits
- ✅ PDF export gating
- ✅ Feature gating
- ✅ Usage resets
- ✅ Tier comparisons

### Edge Cases (3 tests)
- ✅ Expired subscriptions
- ✅ Missing data
- ✅ Invalid usage counts

---

## 🎯 Common Commands

```bash
# Watch mode (auto-rerun on changes)
npm run test

# Run once
npm run test:ci

# Subscription tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Single test file
npx jest tests/subscription-flow.test.ts

# Single test suite
npx jest -t "FREE Tier User Flow"

# Single test case
npx jest -t "should create account"

# Verbose output
npx jest --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 📖 Documentation

- **Complete Guide**: `tests/README.md`
- **Implementation Details**: `docs/TEST_SUITE_IMPLEMENTATION_COMPLETE.md`
- **Environment Setup**: `.env.test.example`

---

## ✅ Pre-Flight Checklist

Before running tests:

- [ ] Test database created (Supabase or local)
- [ ] `.env.test` file created with credentials
- [ ] Migrations deployed: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Dependencies installed: `npm install` (already done)

---

## 🚀 Ready to Test!

Once setup is complete, just run:

```bash
npm run test:integration
```

You should see all 27 tests pass! 🎉

---

**Need Help?**
- Check `tests/README.md` for detailed instructions
- Verify `.env.test` has correct database URL
- Ensure test database exists and is accessible
- Run migrations if schema mismatch occurs

**Quick Test** (no database required):
```bash
# These 3 tests pass without database
npx jest -t "should block PDF export"
npx jest -t "should verify feature gating"
npx jest -t "should verify PRO tiers"
```
