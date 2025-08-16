// src/lib/exercise-validation.ts

import { prisma } from '@/lib/prisma';

/**
 * Exercise interface matching the database schema
 */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string | null;
  instructions?: string | null;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * Fetch all approved and active exercises from the database
 */
export async function getApprovedExercises(): Promise<Exercise[]> {
  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        category: 'APPROVED',
        isActive: true
      },
      orderBy: [
        { muscleGroup: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return exercises;
  } catch (error) {
    console.error('Failed to fetch approved exercises:', error);
    return [];
  }
}

/**
 * Fetch exercises for a specific muscle group
 */
export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        muscleGroup: muscleGroup.toUpperCase() as any,
        category: 'APPROVED',
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    return exercises;
  } catch (error) {
    console.error(`Failed to fetch exercises for muscle group ${muscleGroup}:`, error);
    return [];
  }
}

/**
 * Generate exercise selection context for AI prompts
 */
export async function generateExerciseContext(): Promise<string> {
  const exercises = await getApprovedExercises();
  
  if (exercises.length === 0) {
    return "No exercises available in the database. Please add exercises to the system first.";
  }

  // Group exercises by muscle group
  const exercisesByMuscleGroup = exercises.reduce((acc, exercise) => {
    const group = exercise.muscleGroup.toLowerCase();
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  let context = "VALIDATED EXERCISE DATABASE:\n\n";
  context += "You MUST only recommend exercises from this approved list. These exercises are specifically validated for hypertrophy training.\n\n";

  // Priority categories for different types of exercises
  const machineExercises: Exercise[] = [];
  const cableExercises: Exercise[] = [];
  const otherExercises: Exercise[] = [];

  exercises.forEach(exercise => {
    const equipmentList = exercise.equipment.join(' ').toLowerCase();
    if (equipmentList.includes('machine')) {
      machineExercises.push(exercise);
    } else if (equipmentList.includes('cable')) {
      cableExercises.push(exercise);
    } else {
      otherExercises.push(exercise);
    }
  });

  // Add priority section for machine/cable exercises
  if (machineExercises.length > 0 || cableExercises.length > 0) {
    context += "PRIORITY EXERCISES (Prefer these for hypertrophy):\n";
    
    if (machineExercises.length > 0) {
      context += "Machine Exercises:\n";
      machineExercises.forEach(ex => {
        context += `- ${ex.name} (${ex.muscleGroup.toLowerCase()})\n`;
      });
    }
    
    if (cableExercises.length > 0) {
      context += "Cable Exercises:\n";
      cableExercises.forEach(ex => {
        context += `- ${ex.name} (${ex.muscleGroup.toLowerCase()})\n`;
      });
    }
    context += "\n";
  }

  // Add exercises grouped by muscle group
  for (const [muscleGroup, groupExercises] of Object.entries(exercisesByMuscleGroup)) {
    context += `${muscleGroup.toUpperCase()} EXERCISES:\n`;
    groupExercises.forEach(exercise => {
      context += `- ${exercise.name}`;
      if (exercise.equipment.length > 0) {
        context += ` (${exercise.equipment.join(', ')})`;
      }
      if (exercise.difficulty !== 'INTERMEDIATE') {
        context += ` [${exercise.difficulty}]`;
      }
      context += "\n";
    });
    context += "\n";
  }

  context += "IMPORTANT RULES:\n";
  context += "1. ONLY recommend exercises from this list\n";
  context += "2. Prefer machine and cable exercises when available\n";
  context += "3. Consider difficulty level based on user experience\n";
  context += "4. Always specify the exact exercise name as listed above\n";
  context += "5. If an exercise isn't in this list, DO NOT recommend it\n\n";

  return context;
}

/**
 * Validate if an exercise name exists in the approved database
 */
export async function validateExerciseName(exerciseName: string): Promise<boolean> {
  try {
    const exercise = await prisma.exercise.findFirst({
      where: {
        name: {
          equals: exerciseName,
          mode: 'insensitive'
        },
        category: 'APPROVED',
        isActive: true
      }
    });
    
    return !!exercise;
  } catch (error) {
    console.error('Failed to validate exercise name:', error);
    return false;
  }
}

/**
 * Find exercises similar to a given name (for suggestions)
 */
export async function findSimilarExercises(exerciseName: string, limit: number = 5): Promise<Exercise[]> {
  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        name: {
          contains: exerciseName,
          mode: 'insensitive'
        },
        category: 'APPROVED',
        isActive: true
      },
      take: limit,
      orderBy: { name: 'asc' }
    });
    
    return exercises;
  } catch (error) {
    console.error('Failed to find similar exercises:', error);
    return [];
  }
}

/**
 * Get exercise statistics for admin dashboard
 */
export async function getExerciseStats() {
  try {
    const [
      totalExercises,
      approvedExercises,
      pendingExercises,
      deprecatedExercises,
      activeExercises,
      exercisesByMuscleGroup
    ] = await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.count({ where: { category: 'APPROVED' } }),
      prisma.exercise.count({ where: { category: 'PENDING' } }),
      prisma.exercise.count({ where: { category: 'DEPRECATED' } }),
      prisma.exercise.count({ where: { isActive: true } }),
      prisma.exercise.groupBy({
        by: ['muscleGroup'],
        _count: { muscleGroup: true },
        where: { category: 'APPROVED', isActive: true }
      })
    ]);

    return {
      total: totalExercises,
      approved: approvedExercises,
      pending: pendingExercises,
      deprecated: deprecatedExercises,
      active: activeExercises,
      byMuscleGroup: exercisesByMuscleGroup.reduce((acc, item) => {
        acc[item.muscleGroup] = item._count.muscleGroup;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Failed to get exercise statistics:', error);
    return {
      total: 0,
      approved: 0,
      pending: 0,
      deprecated: 0,
      active: 0,
      byMuscleGroup: {}
    };
  }
}
