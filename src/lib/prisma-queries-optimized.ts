/**
 * Optimized Prisma Query Helpers
 * 
 * This file contains optimized query patterns to avoid N+1 queries,
 * reduce data transfer, and improve performance.
 * 
 * Key principles:
 * 1. Use select() to fetch only needed fields
 * 2. Use include with nested selects for relations
 * 3. Implement pagination for large lists
 * 4. Batch queries where possible
 * 5. Use cursor-based pagination for better performance
 */

import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// Type-safe field selectors
// ============================================

/**
 * Minimal user fields for listings
 */
export const userListSelect = {
  id: true,
  role: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  customProgramsCount: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/**
 * Exercise fields for listings (without heavy JSON)
 */
export const exerciseListSelect = {
  id: true,
  name: true,
  primaryMuscle: true,
  secondaryMuscles: true,
  exerciseType: true,
  category: true,
  isActive: true,
  isRecommended: true,
  imageUrl: true,
  canBeUnilateral: true,
} satisfies Prisma.ExerciseSelect;

/**
 * Full exercise with volume data
 */
export const exerciseFullSelect = {
  ...exerciseListSelect,
  volumeContributions: true,
  regionalBias: true,
  volumeMetrics: true,
  description: true,
  instructions: true,
  equipment: true,
} satisfies Prisma.ExerciseSelect;

/**
 * Workout with exercises
 */
export const workoutWithExercisesInclude = {
  exercises: {
    select: {
      id: true,
      sets: true,
      reps: true,
      isUnilateral: true,
      order: true,
      exercise: {
        select: exerciseListSelect,
      },
    },
    orderBy: {
      order: 'asc' as const,
    },
  },
} satisfies Prisma.WorkoutInclude;

/**
 * Program with full workout details
 */
export const programWithWorkoutsInclude = {
  workouts: {
    include: workoutWithExercisesInclude,
  },
  trainingSplit: {
    select: {
      id: true,
      name: true,
      description: true,
      focusAreas: true,
      difficulty: true,
    },
  },
  splitStructure: {
    select: {
      id: true,
      daysPerWeek: true,
      pattern: true,
      isWeeklyBased: true,
    },
  },
} satisfies Prisma.CustomTrainingProgramInclude;

// ============================================
// Optimized Query Functions
// ============================================

/**
 * Fetch user's programs with workouts and exercises
 * Optimized to avoid N+1 queries
 */
export async function getUserProgramsOptimized(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED';
    orderBy?: 'createdAt' | 'updatedAt' | 'name';
    orderDir?: 'asc' | 'desc';
  } = {}
) {
  const {
    limit = 10,
    offset = 0,
    status,
    orderBy = 'createdAt',
    orderDir = 'desc',
  } = options;

  const [programs, total] = await prisma.$transaction([
    // Fetch programs with all related data in one query
    prisma.customTrainingProgram.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: programWithWorkoutsInclude,
      orderBy: {
        [orderBy]: orderDir,
      },
      take: limit,
      skip: offset,
    }),
    // Count total for pagination
    prisma.customTrainingProgram.count({
      where: {
        userId,
        ...(status && { status }),
      },
    }),
  ]);

  return {
    programs,
    total,
    hasMore: offset + programs.length < total,
    nextOffset: offset + limit,
  };
}

/**
 * Fetch single program with all details
 * Optimized for program detail pages
 */
export async function getProgramByIdOptimized(programId: string, userId?: string) {
  const program = await prisma.customTrainingProgram.findUnique({
    where: { id: programId },
    include: {
      ...programWithWorkoutsInclude,
      user: {
        select: userListSelect,
      },
    },
  });

  // Optional: Check if user owns this program
  if (userId && program && program.userId !== userId) {
    return null; // or throw error
  }

  return program;
}

/**
 * Fetch training splits with structures and day assignments
 * Optimized for split selection UI
 */
export async function getActiveSplitsWithStructures(options: {
  difficulty?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { difficulty, limit = 20, offset = 0 } = options;

  const [splits, total] = await prisma.$transaction([
    prisma.trainingSplit.findMany({
      where: {
        isActive: true,
        ...(difficulty && { difficulty }),
      },
      include: {
        trainingStructures: {
          include: {
            trainingDayAssignments: {
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.trainingSplit.count({
      where: {
        isActive: true,
        ...(difficulty && { difficulty }),
      },
    }),
  ]);

  return {
    splits,
    total,
    hasMore: offset + splits.length < total,
  };
}

/**
 * Fetch exercises by muscle group
 * Optimized with pagination and filtering
 */
export async function getExercisesByMuscleGroup(
  muscleGroup: string,
  options: {
    limit?: number;
    offset?: number;
    exerciseType?: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
    onlyRecommended?: boolean;
    includeVolumeData?: boolean;
  } = {}
) {
  const {
    limit = 50,
    offset = 0,
    exerciseType,
    onlyRecommended = false,
    includeVolumeData = false,
  } = options;

  const where: Prisma.ExerciseWhereInput = {
    primaryMuscle: muscleGroup,
    isActive: true,
    ...(exerciseType && { exerciseType }),
    ...(onlyRecommended && { isRecommended: true }),
  };

  const [exercises, total] = await prisma.$transaction([
    prisma.exercise.findMany({
      where,
      select: includeVolumeData ? exerciseFullSelect : exerciseListSelect,
      take: limit,
      skip: offset,
      orderBy: [
        { isRecommended: 'desc' },
        { name: 'asc' },
      ],
    }),
    prisma.exercise.count({ where }),
  ]);

  return {
    exercises,
    total,
    hasMore: offset + exercises.length < total,
  };
}

/**
 * Batch fetch exercises by IDs
 * Optimized for loading multiple exercises at once
 */
export async function getExercisesByIds(
  exerciseIds: string[],
  includeVolumeData = false
) {
  if (exerciseIds.length === 0) return [];

  const exercises = await prisma.exercise.findMany({
    where: {
      id: { in: exerciseIds },
      isActive: true,
    },
    select: includeVolumeData ? exerciseFullSelect : exerciseListSelect,
  });

  // Return in the same order as requested IDs
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));
  return exerciseIds.map((id) => exerciseMap.get(id)).filter(Boolean);
}

/**
 * Get popular program templates
 * Optimized for template browsing
 */
export async function getPopularTemplates(options: {
  difficulty?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { difficulty, limit = 10, offset = 0 } = options;

  const [templates, total] = await prisma.$transaction([
    prisma.programTemplate.findMany({
      where: {
        isActive: true,
        ...(difficulty && { difficultyLevel: difficulty }),
      },
      include: {
        trainingSplit: {
          select: {
            id: true,
            name: true,
            description: true,
            focusAreas: true,
          },
        },
        splitStructure: {
          select: {
            id: true,
            daysPerWeek: true,
            pattern: true,
          },
        },
        _count: {
          select: {
            trainingPrograms: true, // Count how many users created from this
          },
        },
      },
      orderBy: [
        { popularity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.programTemplate.count({
      where: {
        isActive: true,
        ...(difficulty && { difficultyLevel: difficulty }),
      },
    }),
  ]);

  return {
    templates,
    total,
    hasMore: offset + templates.length < total,
  };
}

/**
 * Get user's workout history summary
 * Optimized for analytics/stats
 */
export async function getUserProgramStats(userId: string) {
  const stats = await prisma.customTrainingProgram.aggregate({
    where: { userId },
    _count: {
      id: true,
    },
  });

  const statusBreakdown = await prisma.customTrainingProgram.groupBy({
    by: ['status'],
    where: { userId },
    _count: {
      id: true,
    },
  });

  const totalWorkouts = await prisma.workout.count({
    where: {
      program: {
        userId,
      },
    },
  });

  return {
    totalPrograms: stats._count.id,
    statusBreakdown: Object.fromEntries(
      statusBreakdown.map((s) => [s.status, s._count.id])
    ),
    totalWorkouts,
  };
}

/**
 * Cursor-based pagination for programs
 * More efficient for large datasets
 */
export async function getUserProgramsCursor(
  userId: string,
  options: {
    take?: number;
    cursor?: string; // Program ID
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  } = {}
) {
  const { take = 10, cursor, status } = options;

  const programs = await prisma.customTrainingProgram.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    include: programWithWorkoutsInclude,
    take: take + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    orderBy: {
      createdAt: 'desc',
    },
  });

  const hasMore = programs.length > take;
  const results = hasMore ? programs.slice(0, -1) : programs;
  const nextCursor = hasMore ? results[results.length - 1]?.id : null;

  return {
    programs: results,
    nextCursor,
    hasMore,
  };
}

/**
 * Get recommended exercises for workout type
 * Optimized for exercise selection in workout builder
 */
export async function getRecommendedExercisesForWorkout(
  workoutType: string,
  options: {
    limit?: number;
    excludeIds?: string[];
  } = {}
) {
  const { limit = 20, excludeIds = [] } = options;

  // Map workout types to muscle groups
  const muscleGroupMap: Record<string, string[]> = {
    Upper: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
    Lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    Push: ['Chest', 'Shoulders', 'Triceps'],
    Pull: ['Back', 'Biceps', 'Forearms'],
    Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    Chest: ['Chest', 'Triceps'],
    Back: ['Back', 'Biceps'],
    Shoulders: ['Shoulders', 'Triceps'],
    Arms: ['Biceps', 'Triceps', 'Forearms'],
  };

  const muscleGroups = muscleGroupMap[workoutType] || [];

  if (muscleGroups.length === 0) {
    return [];
  }

  const exercises = await prisma.exercise.findMany({
    where: {
      primaryMuscle: { in: muscleGroups },
      isActive: true,
      isRecommended: true,
      ...(excludeIds.length > 0 && {
        id: { notIn: excludeIds },
      }),
    },
    select: exerciseListSelect,
    take: limit,
    orderBy: [
      { isRecommended: 'desc' },
      { exerciseType: 'asc' }, // Compounds first
    ],
  });

  return exercises;
}

/**
 * Batch update workout exercises
 * Optimized for workout editing
 */
export async function updateWorkoutExercisesBatch(
  workoutId: string,
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: string;
    isUnilateral: boolean;
    order: number;
  }>
) {
  return await prisma.$transaction(async (tx) => {
    // Delete existing exercises
    await tx.workoutExercise.deleteMany({
      where: { workoutId },
    });

    // Create new exercises in batch
    await tx.workoutExercise.createMany({
      data: exercises.map((ex) => ({
        workoutId,
        ...ex,
      })),
    });

    // Return updated workout
    return await tx.workout.findUnique({
      where: { id: workoutId },
      include: workoutWithExercisesInclude,
    });
  });
}

// ============================================
// Query Performance Monitoring
// ============================================

/**
 * Wrapper to measure query performance
 */
export async function measureQuery<T>(
  name: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    
    // Log slow queries (> 1s)
    if (duration > 1000) {
      console.warn(`[SLOW QUERY] ${name} took ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[QUERY] ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[QUERY ERROR] ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}
