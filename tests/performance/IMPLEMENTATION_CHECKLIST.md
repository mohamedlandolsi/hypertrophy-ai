# Performance Optimization Implementation Checklist

## Overview

This document provides a step-by-step implementation plan for optimizing HypertroQ's performance under heavy usage scenarios.

---

## 🎯 Priority 1: Critical Performance Issues (Implement First)

### 1.1 Implement Pagination on Programs Page ✅

**Impact**: HIGH  
**Effort**: MEDIUM  
**Timeline**: 2-3 hours

**Files to Modify**:
- `src/app/api/programs/route.ts`
- `src/app/[locale]/programs/page.tsx`

**Implementation Steps**:

1. Update API route to support pagination:
```typescript
// src/app/api/programs/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;
  
  const [programs, total] = await Promise.all([
    prisma.customTrainingProgram.findMany({
      where: { userId },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customTrainingProgram.count({ where: { userId } }),
  ]);
  
  return NextResponse.json({
    programs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + programs.length < total,
    },
  });
}
```

2. Update client component with pagination:
```typescript
// src/app/[locale]/programs/page.tsx
const [page, setPage] = useState(1);
const LIMIT = 20;

const { data, isLoading } = useQuery({
  queryKey: ['programs', page],
  queryFn: () => fetch(`/api/programs?page=${page}&limit=${LIMIT}`).then(r => r.json()),
});

// Add pagination UI
<div className="flex justify-center gap-2 mt-8">
  <Button
    onClick={() => setPage(p => Math.max(1, p - 1))}
    disabled={page === 1}
  >
    Previous
  </Button>
  <span>Page {page} of {data?.pagination.totalPages}</span>
  <Button
    onClick={() => setPage(p => p + 1)}
    disabled={!data?.pagination.hasMore}
  >
    Next
  </Button>
</div>
```

3. Install React Query if not already installed:
```bash
npm install @tanstack/react-query
```

4. Test with 100+ programs

**Verification**:
- [ ] Page loads under 2 seconds with 100+ programs
- [ ] Navigation between pages is smooth
- [ ] Total records count is accurate
- [ ] Pagination controls work correctly

---

### 1.2 Optimize Workout Query Performance ✅

**Impact**: HIGH  
**Effort**: LOW  
**Timeline**: 1 hour

**Files to Modify**:
- `src/app/api/programs/[id]/workouts/route.ts`

**Implementation Steps**:

1. Use selective field fetching:
```typescript
const workouts = await prisma.workout.findMany({
  where: { programId: params.id },
  select: {
    id: true,
    name: true,
    type: true,
    assignedDays: true,
    exercises: {
      select: {
        id: true,
        sets: true,
        reps: true,
        order: true,
        isUnilateral: true,
        exercise: {
          select: {
            id: true,
            name: true,
            primaryMuscle: true,
            secondaryMuscles: true,
            exerciseType: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    },
  },
  orderBy: { createdAt: 'asc' },
});
```

2. Verify database indexes exist:
```sql
-- Run in Supabase SQL editor
CREATE INDEX IF NOT EXISTS idx_workout_program_id 
ON "Workout"("programId");

CREATE INDEX IF NOT EXISTS idx_workout_exercise_workout_order 
ON "WorkoutExercise"("workoutId", "order");
```

**Verification**:
- [ ] Query completes under 500ms
- [ ] No N+1 query problems
- [ ] All necessary data is included

---

### 1.3 Add Progress Indicator for Template Import ✅

**Impact**: HIGH (UX)  
**Effort**: MEDIUM  
**Timeline**: 2-3 hours

**Files to Modify**:
- `src/app/[locale]/programs/create/page.tsx`
- New component: `src/components/programs/template-import-progress.tsx`

**Implementation Steps**:

1. Create progress modal component:
```typescript
// src/components/programs/template-import-progress.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export function TemplateImportProgress({ 
  isOpen, 
  progress, 
  status 
}: { 
  isOpen: boolean; 
  progress: number; 
  status: string;
}) {
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Importing Template</h3>
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {status} ({progress}%)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

2. Implement chunked import in API:
```typescript
// src/app/api/programs/[id]/import-template/route.ts
export async function POST(request: Request) {
  const { templateId } = await request.json();
  
  const template = await prisma.programTemplate.findUnique({
    where: { id: templateId },
    include: {
      templateWorkouts: {
        include: { templateExercises: true },
      },
    },
  });
  
  // Import workouts one by one for better control
  const results = [];
  for (const [index, templateWorkout] of template.templateWorkouts.entries()) {
    const workout = await prisma.workout.create({
      data: {
        name: templateWorkout.name,
        programId: params.id,
        type: templateWorkout.type,
        assignedDays: templateWorkout.assignedDays,
        exercises: {
          create: templateWorkout.templateExercises.map(te => ({
            exerciseId: te.exerciseId,
            sets: te.sets,
            reps: te.reps,
            order: te.order,
            isUnilateral: te.isUnilateral,
          })),
        },
      },
    });
    results.push(workout);
  }
  
  return NextResponse.json({ success: true, imported: results.length });
}
```

**Verification**:
- [ ] Progress modal appears during import
- [ ] Progress updates are visible
- [ ] Import completes under 3 seconds for 50+ exercises
- [ ] UI remains responsive

---

## 🚀 Priority 2: Performance Enhancements (Implement Second)

### 2.1 Implement Virtual Scrolling for Exercise List ✅

**Impact**: MEDIUM  
**Effort**: MEDIUM  
**Timeline**: 3-4 hours

**Files to Create**:
- `src/components/programs/virtualized-exercise-list.tsx`

**Implementation Steps**:

1. Install react-window:
```bash
npm install react-window @types/react-window
```

2. Create virtualized list component:
```typescript
import { FixedSizeList as List } from 'react-window';

export function VirtualizedExerciseList({ exercises }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ExerciseCard exercise={exercises[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={exercises.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

3. Replace standard map with virtualized list in workout editor

**Verification**:
- [ ] Smooth scrolling with 50+ exercises
- [ ] No lag when scrolling quickly
- [ ] Memory usage remains stable

---

### 2.2 Add React Query Caching ✅

**Impact**: MEDIUM  
**Effort**: LOW  
**Timeline**: 1-2 hours

**Files to Modify**:
- `src/app/[locale]/layout.tsx` (add QueryClientProvider)
- All data-fetching components

**Implementation Steps**:

1. Create Query Client provider:
```typescript
// src/app/[locale]/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2. Replace fetch calls with useQuery:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['programs'],
  queryFn: () => fetch('/api/programs').then(r => r.json()),
});
```

**Verification**:
- [ ] Cached data loads instantly on revisit
- [ ] Stale data refetches in background
- [ ] No unnecessary API calls

---

### 2.3 Memoize Heavy Components ✅

**Impact**: MEDIUM  
**Effort**: LOW  
**Timeline**: 1 hour

**Files to Modify**:
- `src/app/[locale]/programs/page.tsx` (ProgramCard component)
- Exercise-related components

**Implementation Steps**:

1. Memoize ProgramCard:
```typescript
const ProgramCard = React.memo(({ program }) => {
  // ... component code
}, (prevProps, nextProps) => {
  return prevProps.program.id === nextProps.program.id &&
         prevProps.program.updatedAt === nextProps.program.updatedAt;
});
```

2. Memoize expensive computations:
```typescript
const sortedPrograms = useMemo(() => {
  return programs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [programs]);
```

**Verification**:
- [ ] Component re-renders reduced
- [ ] Smoother interactions
- [ ] No unnecessary recalculations

---

## 💾 Priority 3: Caching & Optimization (Implement Third)

### 3.1 Implement Redis Caching (Optional) ⭕

**Impact**: LOW-MEDIUM  
**Effort**: HIGH  
**Timeline**: 4-6 hours

**Prerequisites**:
- Redis instance (Upstash, Redis Labs, or self-hosted)

**Implementation Steps**:

1. Install Redis client:
```bash
npm install ioredis @types/ioredis
```

2. Create Redis client:
```typescript
// src/lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache(key: string, value: any, ttl = 300) {
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

3. Use in API routes:
```typescript
export async function GET(request: Request) {
  const cacheKey = `workouts:${programId}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);
  
  const workouts = await prisma.workout.findMany({...});
  await setCache(cacheKey, workouts, 300);
  
  return NextResponse.json(workouts);
}
```

**Verification**:
- [ ] Cache hit rate > 80%
- [ ] Cached responses < 50ms
- [ ] Cache invalidation works correctly

---

### 3.2 Add Database Indexes ✅

**Impact**: HIGH  
**Effort**: LOW  
**Timeline**: 30 minutes

**SQL to Run**:

```sql
-- Run in Supabase SQL Editor

-- Custom Training Program indexes
CREATE INDEX IF NOT EXISTS idx_ctp_user_created 
ON "CustomTrainingProgram"("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_ctp_user_status 
ON "CustomTrainingProgram"("userId", "status");

-- Workout indexes
CREATE INDEX IF NOT EXISTS idx_workout_program 
ON "Workout"("programId");

CREATE INDEX IF NOT EXISTS idx_workout_program_type 
ON "Workout"("programId", "type");

-- Workout Exercise indexes
CREATE INDEX IF NOT EXISTS idx_we_workout_order 
ON "WorkoutExercise"("workoutId", "order");

CREATE INDEX IF NOT EXISTS idx_we_exercise 
ON "WorkoutExercise"("exerciseId");

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_template_active_popularity 
ON "ProgramTemplate"("isActive", "popularity" DESC);

-- Analyze tables for query optimization
ANALYZE "CustomTrainingProgram";
ANALYZE "Workout";
ANALYZE "WorkoutExercise";
ANALYZE "ProgramTemplate";
```

**Verification**:
- [ ] Query plans show index usage
- [ ] Query times improved
- [ ] No full table scans

---

## 📊 Priority 4: Monitoring & Testing (Implement Last)

### 4.1 Add Performance Monitoring ✅

**Impact**: MEDIUM (DevOps)  
**Effort**: MEDIUM  
**Timeline**: 2-3 hours

**Implementation Steps**:

1. Add performance marks:
```typescript
performance.mark('query-start');
// ... database query
performance.mark('query-end');
performance.measure('database-query', 'query-start', 'query-end');
```

2. Install Lighthouse CI:
```bash
npm install -D @lhci/cli
```

3. Create lighthouse config:
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/programs'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
      },
    },
  },
};
```

4. Add to CI/CD pipeline

**Verification**:
- [ ] Performance metrics tracked
- [ ] Lighthouse scores meet thresholds
- [ ] Alerts set up for regressions

---

### 4.2 Set Up React Profiler ✅

**Impact**: LOW (Development)  
**Effort**: LOW  
**Timeline**: 1 hour

**Implementation Steps**:

1. Wrap components with Profiler:
```typescript
import { Profiler } from 'react';

<Profiler id="ProgramsList" onRender={onRenderCallback}>
  <ProgramsList />
</Profiler>
```

2. Log render metrics:
```typescript
const onRenderCallback = (id, phase, actualDuration) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${id} ${phase}: ${actualDuration}ms`);
  }
};
```

**Verification**:
- [ ] Render times logged in development
- [ ] Re-render patterns identified
- [ ] Performance regressions caught early

---

## ✅ Quick Wins (Implement Anytime)

### Image Optimization
- [ ] Verify all images use Next.js Image component
- [ ] Add `loading="lazy"` to images
- [ ] Use appropriate image sizes
- [ ] Compress images (WebP format)

### Code Splitting
- [ ] Use dynamic imports for heavy components
- [ ] Split workout editor into separate chunk
- [ ] Lazy load modal components

### Bundle Optimization
- [ ] Run `npm run build` and check bundle sizes
- [ ] Remove unused dependencies
- [ ] Use tree-shaking effectively

---

## 🧪 Testing Plan

### Performance Tests to Run

1. **Programs Page Load**:
   ```bash
   node tests/performance/quick-performance-check.js
   ```

2. **Lighthouse Audit**:
   ```bash
   npm run lighthouse
   ```

3. **Load Testing**:
   ```bash
   # Use k6 or Artillery for load testing
   artillery quick --count 10 --num 100 http://localhost:3000/api/programs
   ```

4. **Database Query Analysis**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM "CustomTrainingProgram" WHERE "userId" = 'xxx';
   ```

---

## 📈 Success Metrics

After implementing optimizations, verify:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Programs Page Load (100 programs) | < 2s | TBD | ⏳ |
| Workout Editor Load (50 exercises) | < 1.5s | TBD | ⏳ |
| Workouts Query | < 500ms | TBD | ⏳ |
| Template Import (50+ exercises) | < 3s | TBD | ⏳ |
| Lighthouse Performance Score | > 90 | TBD | ⏳ |
| First Contentful Paint | < 1.5s | TBD | ⏳ |
| Largest Contentful Paint | < 2.5s | TBD | ⏳ |

---

## 🔄 Continuous Improvement

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check slow query log
- [ ] Monitor error rates
- [ ] Review user feedback on performance

### Monthly Tasks
- [ ] Run full Lighthouse audit
- [ ] Analyze bundle size trends
- [ ] Review cache hit rates
- [ ] Update performance budgets

### Quarterly Tasks
- [ ] Comprehensive load testing
- [ ] Database query optimization review
- [ ] Infrastructure scaling review
- [ ] Performance optimization sprint

---

## 📚 Additional Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
