# Performance Testing Suite

## Overview

Comprehensive performance testing infrastructure for HypertroQ, focusing on real-world heavy usage scenarios.

## 📁 Files Structure

```
tests/performance/
├── README.md                           # This file
├── PERFORMANCE_TESTING_GUIDE.md        # Detailed testing guide (4000+ lines)
├── IMPLEMENTATION_CHECKLIST.md         # Step-by-step implementation plan
├── performance.config.ts               # Performance thresholds & settings
├── quick-performance-check.js          # Fast performance tests (READY TO RUN)
├── utils.simplified.ts                 # Helper utilities
└── heavy-usage.test.ts                 # Full test suite (requires fixes)
```

## 🚀 Quick Start

### Run Performance Tests Immediately

```bash
# Quick performance check (5-10 seconds)
npm run test:performance

# OR
npm run perf

# OR
node tests/performance/quick-performance-check.js
```

This will test:
- ✅ Query user programs (paginated)
- ✅ Query all programs (non-paginated)
- ✅ Query program with workouts & exercises
- ✅ Query program templates
- ✅ Query template with full data
- ✅ Count operations
- ✅ Exercise library queries

### Expected Output

```
═══════════════════════════════════════
   Performance Quick Check
═══════════════════════════════════════

Running: Query User Programs
  ✓ PASS - 45.23ms (threshold: 200ms)
  Records: 20

Running: Query All User Programs (No Pagination)
  ✓ PASS - 156.78ms (threshold: 400ms)
  Records: 100

... (more tests)

═══════════════════════════════════════
   Performance Test Summary
═══════════════════════════════════════

  Total Tests: 7
  Passed: 7
  Failed: 0
```

## 📊 Test Scenarios

### 1. Programs Page Load (< 2 seconds with 100 programs)

**What it tests**:
- Database query performance
- Pagination efficiency
- API response time

**How to test**:
```bash
npm run test:performance
```

**Optimization recommendations**:
- ✅ Implement pagination (see IMPLEMENTATION_CHECKLIST.md)
- ✅ Add database indexes
- ✅ Use React Query for caching
- ✅ Optimize image loading

### 2. Workout Editor (50 exercises - smooth rendering)

**What it tests**:
- Component render performance
- Re-render count
- State update efficiency

**How to test**:
- Use React Profiler in development
- Check render times in DevTools
- Monitor re-renders with React DevTools Profiler

**Optimization recommendations**:
- ✅ Implement virtual scrolling (react-window)
- ✅ Memoize components with React.memo
- ✅ Use useReducer for complex state
- ✅ Optimize event handlers

### 3. Workouts Query (< 500ms with full exercises)

**What it tests**:
- Database query optimization
- N+1 query problems
- Index usage

**How to test**:
```bash
npm run test:performance
```

**Optimization recommendations**:
- ✅ Use selective field fetching (Prisma select)
- ✅ Add composite indexes
- ✅ Implement caching layer (Redis)
- ✅ Use connection pooling

### 4. Template Import (50+ exercises - no UI hang)

**What it tests**:
- Bulk import performance
- UI responsiveness
- Progress feedback

**How to test**:
- Import large template through UI
- Check browser doesn't freeze
- Verify progress indicator updates

**Optimization recommendations**:
- ✅ Chunked import processing
- ✅ Progress indicator UI
- ✅ Background job queue (optional)
- ✅ Optimistic UI updates

## 🎯 Performance Thresholds

Defined in `performance.config.ts`:

```typescript
PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: {
    PROGRAMS_LIST_100: 2000ms,      // Programs page with 100 programs
    WORKOUT_EDITOR_50: 1500ms,      // Workout editor with 50 exercises
    TEMPLATE_IMPORT_50: 3000ms,     // Import template with 50+ exercises
  },
  
  API: {
    PROGRAMS_LIST: 500ms,            // GET /api/programs
    WORKOUTS_QUERY: 500ms,           // GET /api/programs/[id]/workouts
    TEMPLATE_DETAILS: 300ms,         // GET /api/programs/templates/[id]
  },
  
  DATABASE: {
    PROGRAMS_FETCH: 200ms,           // Fetch user programs
    WORKOUTS_WITH_EXERCISES: 300ms,  // Fetch workouts with exercises
  },
}
```

## 🔧 Configuration

### Environment Variables

```env
# Required for tests
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Optional for advanced testing
REDIS_URL="redis://..."
```

### Performance Config

Edit `tests/performance/performance.config.ts`:

```typescript
export const PERFORMANCE_TEST_CONFIG = {
  ITERATIONS: 5,              // Number of test runs
  WARMUP_RUNS: 2,             // Warmup iterations
  DETAILED_PROFILING: true,   // Verbose logging
  MEMORY_PROFILING: true,     // Track memory usage
  TEST_TIMEOUT: 60000,        // 60 seconds
};
```

## 📈 Monitoring Tools

### 1. Built-in Quick Check

```bash
npm run test:performance
```

Fast, immediate feedback on database query performance.

### 2. Lighthouse CI (Recommended)

```bash
# Install
npm install -D @lhci/cli

# Run
npx lhci autorun
```

Comprehensive performance audit including:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

### 3. Chrome DevTools

Open Chrome DevTools → Performance tab:
1. Click "Record"
2. Perform actions (load programs page, etc.)
3. Click "Stop"
4. Analyze flame chart

### 4. React Profiler

```typescript
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={logRenderMetrics}>
  <MyComponent />
</Profiler>
```

### 5. Prisma Query Logging

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Or programmatic logging
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration + 'ms');
});
```

## 🐛 Troubleshooting

### Tests Failing with "No user found"

**Solution**: Tests create a test user automatically. If failing, ensure:
```bash
# Database is accessible
psql $DATABASE_URL -c "SELECT 1"

# Prisma client is generated
npx prisma generate
```

### Tests Failing with "No training split found"

**Solution**: Seed the database first:
```bash
npm run seed
```

### Slow Query Performance

**Solution**: Add database indexes:
```bash
# Run in Supabase SQL editor
CREATE INDEX IF NOT EXISTS idx_ctp_user_created 
ON "CustomTrainingProgram"("userId", "createdAt" DESC);

# See IMPLEMENTATION_CHECKLIST.md for full list
```

### High Memory Usage

**Solution**:
1. Check for memory leaks with Chrome DevTools
2. Use React.memo to prevent unnecessary re-renders
3. Implement virtual scrolling for long lists
4. Clean up event listeners and subscriptions

## 📚 Documentation

### Quick Reference
- `README.md` (this file) - Quick start guide
- `quick-performance-check.js` - Ready-to-run test script

### Detailed Guides
- `PERFORMANCE_TESTING_GUIDE.md` - Comprehensive testing guide (4000+ lines)
  - Test case descriptions
  - Optimization techniques
  - Code examples
  - Tool recommendations

- `IMPLEMENTATION_CHECKLIST.md` - Step-by-step implementation plan
  - Prioritized tasks
  - Effort estimates
  - Implementation steps
  - Verification criteria

### Configuration
- `performance.config.ts` - Thresholds and test configuration
- `utils.simplified.ts` - Helper functions for testing

## 🎯 Implementation Priority

### 🔴 Priority 1: Critical (Implement First)
1. **Pagination on Programs Page** (2-3 hours)
2. **Optimize Workout Queries** (1 hour)
3. **Template Import Progress** (2-3 hours)

### 🟡 Priority 2: Important (Implement Second)
1. **Virtual Scrolling for Exercises** (3-4 hours)
2. **React Query Caching** (1-2 hours)
3. **Component Memoization** (1 hour)

### 🟢 Priority 3: Nice to Have (Implement Third)
1. **Redis Caching** (4-6 hours)
2. **Database Indexes** (30 minutes)
3. **Performance Monitoring** (2-3 hours)

See `IMPLEMENTATION_CHECKLIST.md` for complete plan.

## ✅ Success Criteria

After optimizations, verify these metrics:

| Metric | Target | Test Method |
|--------|--------|-------------|
| Programs Page Load (100 programs) | < 2s | `npm run test:performance` |
| Workout Editor (50 exercises) | < 1.5s | Chrome DevTools |
| Workouts Query | < 500ms | `npm run test:performance` |
| Template Import (50+ exercises) | < 3s | UI testing |
| Lighthouse Performance Score | > 90 | `npx lhci autorun` |
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |

## 🔄 Continuous Monitoring

### Daily
- Run `npm run test:performance` before commits
- Check for console warnings
- Monitor error logs

### Weekly
- Review performance metrics dashboard
- Check slow query logs
- Analyze user feedback

### Monthly
- Full Lighthouse audit
- Bundle size analysis
- Load testing

### Quarterly
- Comprehensive performance sprint
- Infrastructure scaling review
- Database optimization

## 🚀 Quick Wins

Easy optimizations you can do right now:

1. **Add Database Indexes** (5 minutes)
   ```bash
   # Run SQL from IMPLEMENTATION_CHECKLIST.md
   ```

2. **Enable Gzip Compression** (Already enabled in Next.js)

3. **Optimize Images** (Check all use next/image)
   ```tsx
   <Image src="..." alt="..." fill loading="lazy" />
   ```

4. **Remove Console Logs** (Production)
   ```bash
   # Build removes console.log automatically
   npm run build
   ```

## 📊 Performance Budget

Don't exceed these limits:

```json
{
  "javascript": "250KB",
  "images": "500KB",
  "total": "1MB",
  "api-response": "500ms",
  "page-load": "2000ms"
}
```

## 🆘 Need Help?

1. **Read the guides**:
   - Start with this README
   - Check PERFORMANCE_TESTING_GUIDE.md for details
   - Follow IMPLEMENTATION_CHECKLIST.md step-by-step

2. **Run the tests**:
   ```bash
   npm run test:performance
   ```

3. **Check the output**:
   - Green checkmarks = passing
   - Red X marks = needs optimization

4. **Follow recommendations**:
   - Each test failure includes optimization suggestions
   - See IMPLEMENTATION_CHECKLIST.md for implementation steps

---

## 📝 Next Steps

1. **Run performance tests**:
   ```bash
   npm run test:performance
   ```

2. **Review results** and identify bottlenecks

3. **Follow IMPLEMENTATION_CHECKLIST.md** to implement optimizations

4. **Re-test** and verify improvements

5. **Set up continuous monitoring**

---

**Last Updated**: November 11, 2025  
**Test Suite Version**: 1.0.0  
**Status**: Ready for Production Use ✅
