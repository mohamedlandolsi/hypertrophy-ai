/**
 * Performance Test Utilities
 * 
 * Helper functions for measuring and analyzing performance
 */

import { PrismaClient } from '@prisma/client';
import { performance, PerformanceObserver } from 'perf_hooks';

const prisma = new PrismaClient();

export interface PerformanceMetrics {
  duration: number;
  memoryUsed: number;
  timestamp: number;
  label: string;
}

export interface DatabaseMetrics {
  queryTime: number;
  rowCount: number;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RenderMetrics {
  renderCount: number;
  renderTime: number;
  componentName: string;
}

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();
  
  const result = await fn();
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const metrics: PerformanceMetrics = {
    duration: endTime - startTime,
    memoryUsed: (endMemory - startMemory) / 1024 / 1024, // Convert to MB
    timestamp: Date.now(),
    label,
  };
  
  return { result, metrics };
}

/**
 * Measure multiple iterations and return average
 */
export async function measureAverageExecutionTime<T>(
  label: string,
  fn: () => Promise<T>,
  iterations: number = 5,
  warmupRuns: number = 2
): Promise<{ result: T; avgMetrics: PerformanceMetrics; allMetrics: PerformanceMetrics[] }> {
  const allMetrics: PerformanceMetrics[] = [];
  let lastResult: T;
  
  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    await fn();
  }
  
  // Actual measurement runs
  for (let i = 0; i < iterations; i++) {
    const { result, metrics } = await measureExecutionTime(`${label}_${i}`, fn);
    allMetrics.push(metrics);
    lastResult = result;
  }
  
  // Calculate averages
  const avgMetrics: PerformanceMetrics = {
    duration: allMetrics.reduce((sum, m) => sum + m.duration, 0) / iterations,
    memoryUsed: allMetrics.reduce((sum, m) => sum + m.memoryUsed, 0) / iterations,
    timestamp: Date.now(),
    label: `${label}_average`,
  };
  
  return { result: lastResult!, avgMetrics, allMetrics };
}

/**
 * Create test programs in database
 */
export async function createTestPrograms(userId: string, count: number) {
  const programs = [];
  
  // Get first available split and structure
  const split = await prisma.trainingSplit.findFirst();
  const structure = await prisma.trainingSplitStructure.findFirst();
  
  if (!split || !structure) {
    throw new Error('No training split or structure found. Please seed splits first.');
  }
  
  for (let i = 0; i < count; i++) {
    const program = await prisma.customTrainingProgram.create({
      data: {
        name: `Performance Test Program ${i + 1}`,
        description: `Test program for performance testing - ${i + 1}`,
        userId,
        splitId: split.id,
        structureId: structure.id,
        workoutStructureType: 'WEEKLY',
        status: 'ACTIVE',
      },
    });
    programs.push(program);
  }
  
  return programs;
}

/**
 * Create test workouts with exercises
 */
export async function createTestWorkoutsWithExercises(
  programId: string,
  workoutCount: number,
  exercisesPerWorkout: number
) {
  const workouts = [];
  
  // Get available exercises from database
  const availableExercises = await prisma.exercise.findMany({
    take: exercisesPerWorkout * workoutCount,
  });
  
  if (availableExercises.length === 0) {
    throw new Error('No exercises found in database. Please seed exercises first.');
  }
  
  for (let i = 0; i < workoutCount; i++) {
    const workout = await prisma.workout.create({
      data: {
        name: `Test Workout ${i + 1}`,
        programId,
        dayOfWeek: i % 7,
        order: i,
        workoutExercises: {
          create: availableExercises.slice(
            i * exercisesPerWorkout,
            (i + 1) * exercisesPerWorkout
          ).map((exercise, idx) => ({
            exerciseId: exercise.id,
            sets: 3,
            reps: '8-12',
            order: idx,
            restPeriod: 90,
          })),
        },
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
          },
        },
      },
    });
    workouts.push(workout);
  }
  
  return workouts;
}

/**
 * Create test template with exercises
 */
export async function createTestTemplate(
  name: string,
  workoutCount: number,
  exercisesPerWorkout: number
) {
  // Get training split
  const split = await prisma.trainingSplit.findFirst();
  if (!split) {
    throw new Error('No training split found. Please seed splits first.');
  }
  
  // Get available exercises
  const availableExercises = await prisma.exercise.findMany({
    take: exercisesPerWorkout * workoutCount,
  });
  
  if (availableExercises.length === 0) {
    throw new Error('No exercises found in database. Please seed exercises first.');
  }
  
  const template = await prisma.programTemplate.create({
    data: {
      name,
      description: `Performance test template with ${workoutCount} workouts and ${exercisesPerWorkout} exercises each`,
      trainingSplitId: split.id,
      difficultyLevel: 'INTERMEDIATE',
      isActive: true,
      templateWorkouts: {
        create: Array.from({ length: workoutCount }, (_, i) => ({
          name: `Test Workout ${i + 1}`,
          order: i,
          workoutType: 'strength',
          templateExercises: {
            create: availableExercises.slice(
              i * exercisesPerWorkout,
              (i + 1) * exercisesPerWorkout
            ).map((exercise, idx) => ({
              exerciseId: exercise.id,
              sets: 3,
              reps: '8-12',
              order: idx,
            })),
          },
        })),
      },
    },
    include: {
      templateWorkouts: {
        include: {
          templateExercises: {
            include: {
              exercise: true,
            },
          },
        },
      },
    },
  });
  
  return template;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(userId: string) {
  // Delete workouts and programs
  await prisma.workout.deleteMany({
    where: {
      program: {
        userId,
      },
    },
  });
  
  await prisma.trainingProgram.deleteMany({
    where: {
      userId,
      name: {
        startsWith: 'Performance Test Program',
      },
    },
  });
  
  // Delete test templates
  await prisma.programTemplate.deleteMany({
    where: {
      name: {
        startsWith: 'Performance Test Template',
      },
    },
  });
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: PerformanceMetrics): string {
  return `
    Label: ${metrics.label}
    Duration: ${metrics.duration.toFixed(2)}ms
    Memory: ${metrics.memoryUsed.toFixed(2)}MB
    Timestamp: ${new Date(metrics.timestamp).toISOString()}
  `.trim();
}

/**
 * Check if metrics meet threshold
 */
export function meetsThreshold(actualMs: number, thresholdMs: number): boolean {
  return actualMs <= thresholdMs;
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(metrics: PerformanceMetrics[]) {
  const durations = metrics.map(m => m.duration);
  const memoryUsages = metrics.map(m => m.memoryUsed);
  
  return {
    duration: {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50: calculatePercentile(durations, 50),
      p95: calculatePercentile(durations, 95),
      p99: calculatePercentile(durations, 99),
    },
    memory: {
      min: Math.min(...memoryUsages),
      max: Math.max(...memoryUsages),
      avg: memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length,
    },
  };
}

/**
 * Measure database query performance
 */
export async function measureDatabaseQuery<T>(
  label: string,
  query: () => Promise<T>
): Promise<{ result: T; metrics: DatabaseMetrics }> {
  const startTime = performance.now();
  const result = await query();
  const endTime = performance.now();
  
  const rowCount = Array.isArray(result) ? result.length : 1;
  
  return {
    result,
    metrics: {
      queryTime: endTime - startTime,
      rowCount,
      queryType: 'SELECT', // Simplified, could be determined from query
    },
  };
}

/**
 * Setup performance observer
 */
export function setupPerformanceObserver(callback: (entries: any[]) => void) {
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    callback(entries);
  });
  
  obs.observe({ entryTypes: ['measure'], buffered: true });
  
  return obs;
}

/**
 * Create performance report
 */
export function createPerformanceReport(
  testName: string,
  metrics: PerformanceMetrics[],
  threshold: number
): string {
  const stats = getPerformanceStats(metrics);
  const passed = stats.duration.p95 <= threshold;
  
  return `
========================================
Performance Test Report: ${testName}
========================================
Status: ${passed ? '✅ PASSED' : '❌ FAILED'}
Threshold: ${threshold}ms
----------------------------------------
Duration Stats:
  Min:     ${stats.duration.min.toFixed(2)}ms
  Max:     ${stats.duration.max.toFixed(2)}ms
  Average: ${stats.duration.avg.toFixed(2)}ms
  P50:     ${stats.duration.p50.toFixed(2)}ms
  P95:     ${stats.duration.p95.toFixed(2)}ms
  P99:     ${stats.duration.p99.toFixed(2)}ms
----------------------------------------
Memory Stats:
  Min:     ${stats.memory.min.toFixed(2)}MB
  Max:     ${stats.memory.max.toFixed(2)}MB
  Average: ${stats.memory.avg.toFixed(2)}MB
========================================
  `.trim();
}

/**
 * Measure page load performance
 */
export async function measurePageLoad(page: any, url: string) {
  const startTime = performance.now();
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const endTime = performance.now();
  
  // Get web vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const paint = entries.find(e => e.name === 'first-contentful-paint');
        resolve({
          fcp: paint?.startTime || 0,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        });
      });
      observer.observe({ entryTypes: ['paint', 'navigation'] });
    });
  });
  
  return {
    totalTime: endTime - startTime,
    ...metrics,
  };
}

export { prisma };
