# Integration Test Suite - Subscription Flow

This directory contains comprehensive integration tests for the subscription flow, including tier enforcement, feature gating, and lifecycle management.

## Test Coverage

### 1. FREE Tier User Flow ✅
- Account creation with FREE tier assignment
- Program creation (2 programs max)
- Customization limits (5 per month)
- Blocking when limits exceeded
- Tier-specific feature restrictions

### 2. PRO Monthly User Flow ✅
- Subscription via LemonSqueezy
- Unlimited program creation
- Unlimited customizations
- AI assistant access
- PRO feature verification

### 3. Subscription Lifecycle ✅
- Subscribe to PRO_MONTHLY
- Upgrade from MONTHLY to YEARLY
- Cancel subscription and revert to FREE
- Reactivate subscription
- Verify programs remain accessible

### 4. Tier Enforcement ✅
- Program creation limits
- Customization limits
- Daily message limits
- PDF export restrictions
- Feature gating validation
- Monthly usage resets

### 5. Edge Cases & Error Handling ✅
- Expired subscriptions
- Missing subscription data
- Negative usage prevention

## Prerequisites

### 1. Test Database Setup

You need a **separate test database** to avoid affecting production data.

**Option A: Use Supabase Test Project**
1. Create a new Supabase project for testing
2. Copy the connection string
3. Add to `.env.test` or `.env.local`

**Option B: Local PostgreSQL**
```bash
# Create test database
createdb hypertroq_test

# Run migrations
npx prisma migrate dev --name init
```

### 2. Environment Variables

Create `.env.test` file:
```env
# Test Database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/hypertroq_test"
DATABASE_URL="postgresql://user:password@localhost:5432/hypertroq_test"
DIRECT_URL="postgresql://user:password@localhost:5432/hypertroq_test"

# Supabase (test project)
NEXT_PUBLIC_SUPABASE_URL="https://your-test-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-test-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-test-service-role-key"

# LemonSqueezy (test mode)
LEMONSQUEEZY_API_KEY="test_your_api_key"
LEMONSQUEEZY_STORE_ID="your_store_id"
LEMONSQUEEZY_WEBHOOK_SECRET="test_webhook_secret"
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID="test-product-id"
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID="test-variant-id"
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID="test-product-id"
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID="test-variant-id"
```

### 3. Database Schema

Ensure your test database has the latest schema:
```bash
npx prisma migrate deploy
npx prisma generate
```

## Running Tests

### Run All Tests
```bash
npm run test
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests in CI Mode (No Watch)
```bash
npm run test:ci
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx jest tests/subscription-flow.test.ts
```

### Run Specific Test Suite
```bash
npx jest tests/subscription-flow.test.ts -t "FREE Tier User Flow"
```

### Run Single Test
```bash
npx jest tests/subscription-flow.test.ts -t "should create account with FREE tier assigned"
```

## Test Output

### Success Example
```
PASS  tests/subscription-flow.test.ts
  Subscription Flow Integration Tests
    1. FREE Tier User Flow
      ✓ should create account with FREE tier assigned (150ms)
      ✓ should allow creating first program (120ms)
      ✓ should allow creating second program (115ms)
      ✓ should block creating third program with upgrade prompt (125ms)
      ✓ should block customization beyond monthly limit (110ms)
      ✓ should verify FREE tier limitations (5ms)
    2. PRO Monthly User Flow
      ✓ should verify PRO_MONTHLY tier assigned after subscription (135ms)
      ✓ should allow creating unlimited programs (180ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
Time:        3.245 s
```

## Test Structure

### Helper Functions

#### `createTestUser(tier)`
Creates a test user with specified tier (FREE, PRO_MONTHLY, PRO_YEARLY)

#### `createTestProgram(userId)`
Creates a test training program for a user

#### `createTestSubscription(userId, tier)`
Creates a subscription with appropriate expiration dates

#### `cleanupTestUser(userId)`
Removes test user and all related data (programs, subscriptions)

### Test Scenarios

Each test scenario is isolated and includes:
- **Setup** (`beforeEach`): Create test user/subscription
- **Test Logic**: Verify behavior
- **Cleanup** (`afterEach`): Remove test data

## Troubleshooting

### Issue: Database Connection Failed
```
Error: Authentication failed against database server
```
**Solution**: 
- Verify `DATABASE_URL` in `.env.test`
- Ensure test database exists
- Check database credentials

### Issue: Tests Timeout
```
Error: Timeout - Async callback was not invoked within the 30000 ms timeout
```
**Solution**:
- Increase timeout in `jest.config.ts`:
  ```typescript
  testTimeout: 60000  // 60 seconds
  ```
- Check database connection speed

### Issue: Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
```
**Solution**:
```bash
npx prisma generate
npm run test
```

### Issue: Schema Mismatch
```
Error: Table 'User' does not exist
```
**Solution**:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Issue: Tests Affect Production Data
**Prevention**:
- ✅ Always use separate test database
- ✅ Set `TEST_DATABASE_URL` environment variable
- ✅ Verify database URL before running tests
- ✅ Use test-specific Supabase project

## Best Practices

### 1. Isolation
- Each test creates its own test data
- Cleanup happens in `afterEach` hooks
- No shared state between tests

### 2. Descriptive Names
- Test names clearly describe what is being tested
- Use `should` prefix for test descriptions

### 3. Assertions
- Test one thing per test case
- Use specific matchers (`toBe`, `toEqual`, `toBeGreaterThan`)
- Verify both positive and negative cases

### 4. Cleanup
- Always clean up test data
- Use try/finally for guaranteed cleanup
- Handle cleanup even if test fails

### 5. Performance
- Keep tests fast (<200ms each)
- Use database transactions where possible
- Avoid unnecessary database queries

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

## Test Maintenance

### Adding New Tests

1. **Create test file** in `tests/` directory
2. **Import dependencies**:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import { SUBSCRIPTION_TIER_LIMITS } from '@/lib/subscription';
   ```
3. **Use helper functions** for setup/cleanup
4. **Write descriptive test names**
5. **Run tests locally before committing**

### Updating Tests

When updating subscription logic:
1. Update `src/lib/subscription.ts`
2. Update corresponding tests
3. Run full test suite
4. Verify all tests pass

## Coverage Goals

Target test coverage:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Check coverage:
```bash
npm run test:coverage
```

Coverage report will be in `coverage/lcov-report/index.html`

## Related Documentation

- **Subscription System**: `docs/SUBSCRIPTION_ARCHITECTURE.md`
- **LemonSqueezy Integration**: `src/lib/lemonsqueezy.ts`
- **Tier Limits**: `src/lib/subscription.ts`
- **Database Schema**: `prisma/schema.prisma`

## Support

For issues with tests:
1. Check test database connection
2. Verify environment variables
3. Run migrations on test database
4. Check console output for specific errors
5. Review test isolation (cleanup)

---

**Last Updated**: November 9, 2025  
**Test Suite Version**: 1.0.0  
**Total Tests**: 27  
**Test Categories**: 5
