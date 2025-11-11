# Performance Testing Guide - Heavy Usage Scenarios

## Overview

This guide provides a comprehensive approach to performance testing for HypertroQ under heavy usage scenarios. The tests focus on real-world bottlenecks and optimization opportunities.

## Test Scenarios

### 1. Programs Page Load with 100 User Programs (< 2 seconds)

**Objective**: Ensure programs page loads within 2 seconds when user has 100+ programs

**Current Implementation Location**:
- Page: `src/app/[locale]/programs/page.tsx`
- API: `src/app/api/programs/route.ts`

**Performance Bottlenecks**:
- Fetching 100+ programs with nested relations
- No pagination implemented
- All program data loaded at once
- No client-side caching

**Test Approach**:
```typescript
// Test with real data
1. Create 100 test programs for a user
2. Measure database query time
3. Measure API response time
4. Measure client-side rendering time
5. Verify total load time < 2000ms
```

**Optimization Recommendations**:

#### A. Implement Pagination (CRITICAL)
```typescript
// API Route: src/app/api/programs/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;
  
  const [programs, total] = await Promise.all([
    prisma.customTrainingProgram.findMany({
      where: { userId },
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        workoutStructureType: true,
        _count: {
          select: { workouts: true },
        },
      },
    }),
    prisma.customTrainingProgram.count({
      where: { userId },
    }),
  ]);
  
  return NextResponse.json({
    programs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

#### B. Add Database Indexes
```sql
-- Already exists but verify:
CREATE INDEX IF NOT EXISTS idx_custom_training_program_user_created 
ON "CustomTrainingProgram"(userId, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_custom_training_program_user_status 
ON "CustomTrainingProgram"(userId, status);
```

#### C. Implement Client-Side Caching
```typescript
// Use React Query in programs page
import { useQuery } from '@tanstack/react-query';

export default function ProgramsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['programs', page],
    queryFn: () => fetchPrograms(page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

#### D. Lazy Load Images
```typescript
// Already using Next.js Image component - verify optimization
<Image
  src={program.thumbnailUrl}
  alt={program.name}
  fill
  className="object-cover"
  loading="lazy" // Ensure lazy loading
  placeholder="blur" // Add blur placeholder
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

### 2. Workout Editor with 50 Exercises (Smooth Rendering)

**Objective**: Render workout editor smoothly with 50 exercises, check for unnecessary re-renders

**Current Implementation Location**:
- Component: `src/app/[locale]/programs/[id]/workouts/page.tsx`
- Component: `src/components/programs/workout-templates.tsx`

**Performance Bottlenecks**:
- All 50 exercises rendered at once
- No virtualization
- Possible unnecessary re-renders on state updates
- Heavy component tree

**Test Approach**:
```typescript
// Use React Profiler API
1. Wrap component in Profiler
2. Measure render time
3. Count re-renders during interactions
4. Check render time < 16ms (60 FPS)
5. Verify re-render count < 3 for single state update
```

**Optimization Recommendations**:

#### A. Implement Virtual Scrolling
```bash
npm install react-window
```

```typescript
// src/components/programs/virtualized-exercise-list.tsx
import { FixedSizeList as List } from 'react-window';

export function VirtualizedExerciseList({ exercises }: { exercises: Exercise[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
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

#### B. Memoize Exercise Components
```typescript
// Memoize individual exercise cards
export const ExerciseCard = React.memo(({ exercise }: { exercise: Exercise }) => {
  return (
    <Card>
      {/* Exercise details */}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.exercise.id === nextProps.exercise.id &&
         prevProps.exercise.sets === nextProps.exercise.sets &&
         prevProps.exercise.reps === nextProps.exercise.reps;
});
```

#### C. Use React Profiler for Monitoring
```typescript
// Add profiler in development
import { Profiler } from 'react';

export default function WorkoutEditor() {
  const onRenderCallback = (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${id} ${phase} took ${actualDuration}ms`);
    }
  };

  return (
    <Profiler id="WorkoutEditor" onRender={onRenderCallback}>
      {/* Component tree */}
    </Profiler>
  );
}
```

#### D. Optimize State Updates
```typescript
// Use useReducer for complex state
const initialState = {
  exercises: [],
  selectedExercise: null,
  isEditing: false,
};

function workoutReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_EXERCISE':
      // Only update specific exercise, don't re-render all
      return {
        ...state,
        exercises: state.exercises.map(ex =>
          ex.id === action.payload.id
            ? { ...ex, ...action.payload.updates }
            : ex
        ),
      };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(workoutReducer, initialState);
```

---

### 3. Query All Workouts with Full Exercises (< 500ms)

**Objective**: Query all workouts with full exercise data in under 500ms

**Current Implementation Location**:
- API: `src/app/api/programs/[id]/workouts/route.ts`

**Performance Bottlenecks**:
- N+1 query problem with exercises
- Missing database indexes
- No caching layer
- Fetching unnecessary data

**Test Approach**:
```typescript
// Measure database query performance
1. Create program with 6 workouts
2. Add 12 exercises per workout (72 total)
3. Measure query execution time
4. Verify < 500ms
5. Check for N+1 queries
```

**Optimization Recommendations**:

#### A. Optimize Database Query
```typescript
// Use Prisma's include with select for performance
const workouts = await prisma.workout.findMany({
  where: { programId },
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
            // Don't fetch large fields like videoUrl unless needed
          },
        },
      },
      orderBy: { order: 'asc' },
    },
  },
  orderBy: { createdAt: 'asc' },
});
```

#### B. Add Database Indexes
```sql
-- Verify these indexes exist
CREATE INDEX IF NOT EXISTS idx_workout_program 
ON "Workout"(programId);

CREATE INDEX IF NOT EXISTS idx_workout_exercise_workout_order 
ON "WorkoutExercise"(workoutId, "order");

CREATE INDEX IF NOT EXISTS idx_workout_exercise_exercise 
ON "WorkoutExercise"(exerciseId);
```

#### C. Implement Redis Caching (Optional)
```typescript
// Install Redis
npm install redis @types/redis

// src/lib/redis.ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

export async function getCachedWorkouts(programId: string) {
  const cached = await redis.get(`workouts:${programId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function cacheWorkouts(programId: string, workouts: any) {
  await redis.setex(
    `workouts:${programId}`,
    300, // 5 minutes TTL
    JSON.stringify(workouts)
  );
}

// In API route
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Check cache first
  const cached = await getCachedWorkouts(params.id);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Fetch from database
  const workouts = await prisma.workout.findMany({
    // ... query
  });
  
  // Cache result
  await cacheWorkouts(params.id, workouts);
  
  return NextResponse.json(workouts);
}
```

#### D. Use Database Connection Pooling
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  
  // Connection pool settings
  // Already configured in Prisma, but verify in production
}
```

---

### 4. Import Large Template (50+ Exercises) - No UI Hang

**Objective**: Import template with 50+ exercises without hanging UI, show progress

**Current Implementation Location**:
- API: `src/app/api/programs/[id]/import-template/route.ts`
- Component: `src/app/[locale]/programs/create/page.tsx`

**Performance Bottlenecks**:
- Synchronous import blocks UI
- No progress feedback
- Large transaction size
- No error recovery

**Test Approach**:
```typescript
// Test template import performance
1. Create template with 6 workouts × 10 exercises = 60 total
2. Measure import time
3. Verify UI remains responsive
4. Check progress updates
5. Verify < 3000ms total time
```

**Optimization Recommendations**:

#### A. Implement Chunked Import with Progress
```typescript
// API Route: src/app/api/programs/[id]/import-template/route.ts
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { templateId } = await request.json();
  
  // Fetch template
  const template = await prisma.programTemplate.findUnique({
    where: { id: templateId },
    include: {
      templateWorkouts: {
        include: {
          templateExercises: true,
        },
      },
    },
  });
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  
  const totalWorkouts = template.templateWorkouts.length;
  const importedWorkouts = [];
  
  // Import workouts in batches for better performance
  for (let i = 0; i < totalWorkouts; i++) {
    const templateWorkout = template.templateWorkouts[i];
    
    // Import single workout with its exercises
    const workout = await prisma.workout.create({
      data: {
        name: templateWorkout.name,
        programId: params.id,
        type: templateWorkout.type,
        assignedDays: templateWorkout.assignedDays,
        exercises: {
          create: templateWorkout.templateExercises.map((te) => ({
            exerciseId: te.exerciseId,
            sets: te.sets,
            reps: te.reps,
            order: te.order,
            isUnilateral: te.isUnilateral,
          })),
        },
      },
    });
    
    importedWorkouts.push(workout);
    
    // Send progress update (would need WebSocket or Server-Sent Events)
    // For now, return progress in response
  }
  
  return NextResponse.json({
    success: true,
    imported: importedWorkouts.length,
    total: totalWorkouts,
  });
}
```

#### B. Client-Side Progress UI
```typescript
// Component with progress tracking
export function TemplateImportModal() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleImport = async (templateId: string) => {
    setImporting(true);
    setProgress(0);
    
    try {
      // Start import
      const response = await fetch(`/api/programs/${programId}/import-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      
      const data = await response.json();
      
      // Simulate progress (in production, use WebSocket for real-time updates)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setProgress(100);
      
      toast.success('Template imported successfully!');
      router.push(`/${locale}/programs/${programId}/workouts`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import template');
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <Dialog open={importing}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importing Template</DialogTitle>
          <DialogDescription>
            Please wait while we set up your workouts...
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-muted-foreground">
            {progress}% Complete
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### C. Use Background Jobs (Advanced)
```typescript
// For very large imports, use background jobs
// Install Bull or BullMQ for job queue
npm install bull @types/bull

// src/lib/queue.ts
import Queue from 'bull';

const templateImportQueue = new Queue('template-import', {
  redis: process.env.REDIS_URL,
});

templateImportQueue.process(async (job) => {
  const { programId, templateId } = job.data;
  
  // Process import
  for (let i = 0; i < workouts.length; i++) {
    // Import workout
    await importWorkout(workouts[i]);
    
    // Update progress
    job.progress((i + 1) / workouts.length * 100);
  }
  
  return { success: true };
});

// In API route
export async function POST(request: Request) {
  const { templateId } = await request.json();
  
  // Queue the import job
  const job = await templateImportQueue.add({
    programId,
    templateId,
  });
  
  return NextResponse.json({
    jobId: job.id,
    status: 'queued',
  });
}
```

---

## Performance Monitoring Tools

### 1. Lighthouse CI

```bash
# Install Lighthouse CI
npm install -D @lhci/cli

# Add to package.json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/programs',
        'http://localhost:3000/programs/test-id/workouts',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 2. Chrome DevTools Performance Profiling

```typescript
// Add performance marks in code
performance.mark('programs-fetch-start');
const programs = await fetchPrograms();
performance.mark('programs-fetch-end');
performance.measure('programs-fetch', 'programs-fetch-start', 'programs-fetch-end');

// Read measurement
const measurement = performance.getEntriesByName('programs-fetch')[0];
console.log(`Programs fetch took ${measurement.duration}ms`);
```

### 3. React Profiler

```typescript
// Wrap components with Profiler
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
  });
};

<Profiler id="ProgramsList" onRender={onRenderCallback}>
  <ProgramsList programs={programs} />
</Profiler>
```

### 4. Prisma Query Logging

```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

---

## Performance Testing Checklist

### Before Running Tests
- [ ] Database has realistic data volume (100+ programs, 500+ exercises)
- [ ] Test user has PRO subscription (unlimited access)
- [ ] Production build created (`npm run build`)
- [ ] Environment matches production (Node version, memory limits)

### During Tests
- [ ] Monitor database query times
- [ ] Check for N+1 query problems
- [ ] Measure API response times
- [ ] Profile React component renders
- [ ] Check memory usage patterns
- [ ] Monitor network waterfall
- [ ] Verify no memory leaks

### After Tests
- [ ] Document performance bottlenecks
- [ ] Create optimization tickets
- [ ] Set up performance budgets
- [ ] Add performance monitoring to CI/CD

---

## Recommended Performance Budgets

```javascript
// performance-budgets.json
{
  "budgets": [
    {
      "path": "/programs",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1500 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "time-to-interactive", "budget": 3000 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 250 },
        { "resourceType": "image", "budget": 500 },
        { "resourceType": "total", "budget": 1000 }
      ]
    },
    {
      "path": "/programs/*/workouts",
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1000 },
        { "metric": "time-to-interactive", "budget": 2000 }
      ]
    }
  ]
}
```

---

## Next Steps

1. **Implement Pagination** (PRIORITY 1)
   - Programs list page
   - Workout editor if needed

2. **Add Performance Monitoring** (PRIORITY 2)
   - Lighthouse CI in GitHub Actions
   - Real User Monitoring (RUM)

3. **Optimize Database Queries** (PRIORITY 3)
   - Add missing indexes
   - Optimize Prisma queries
   - Consider read replicas for heavy reads

4. **Implement Caching** (PRIORITY 4)
   - React Query for client-side
   - Redis for server-side
   - CDN for static assets

5. **Code Splitting & Lazy Loading** (PRIORITY 5)
   - Dynamic imports for heavy components
   - Lazy load workout editor
   - Route-based code splitting

---

## Additional Resources

- [Next.js Performance Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
