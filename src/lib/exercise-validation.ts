// src/lib/exercise-validation.ts

import { prisma } from '@/lib/prisma';

/**
 * Exercise interface matching the database schema
 */
export interface Exercise {
  id: string;
  name: string;
  exerciseType: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
  description?: string | null;
  instructions?: string | null;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  isRecommended: boolean;
  imageUrl?: string | null;
  imageType?: string | null;
  volumeContributions: Record<string, number>;
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
        { exerciseType: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Map Prisma results to Exercise interface with proper type casting
    return exercises.map(ex => ({
      ...ex,
      volumeContributions: (ex.volumeContributions as Record<string, number>) || {}
    }));
  } catch (error) {
    console.error('Failed to fetch approved exercises:', error);
    return [];
  }
}

/**
 * Fetch exercises that target a specific muscle group
 * Filters based on volume contributions
 */
export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  try {
    // Get all approved and active exercises
    const allExercises = await prisma.exercise.findMany({
      where: {
        category: 'APPROVED',
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Filter exercises that have volume contributions for the requested muscle group
    const filteredExercises = allExercises.filter(exercise => {
      const volumeContributions = exercise.volumeContributions as Record<string, number>;
      return volumeContributions && 
             Object.keys(volumeContributions).some(muscle => 
               muscle.toUpperCase() === muscleGroup.toUpperCase()
             );
    });
    
    // Map to Exercise interface with proper type casting
    return filteredExercises.map(ex => ({
      ...ex,
      volumeContributions: (ex.volumeContributions as Record<string, number>) || {}
    }));
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

  // Group exercises by type (COMPOUND, ISOLATION, UNILATERAL)
  const exercisesByType = exercises.reduce((acc, exercise) => {
    const type = exercise.exerciseType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(exercise);
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
        const targetMuscles = Object.entries(ex.volumeContributions)
          .filter(([, value]) => value > 0)
          .map(([muscle, value]) => `${muscle}(${value})`)
          .join(', ');
        context += `- ${ex.name} → ${targetMuscles}\n`;
      });
    }
    
    if (cableExercises.length > 0) {
      context += "Cable Exercises:\n";
      cableExercises.forEach(ex => {
        const targetMuscles = Object.entries(ex.volumeContributions)
          .filter(([, value]) => value > 0)
          .map(([muscle, value]) => `${muscle}(${value})`)
          .join(', ');
        context += `- ${ex.name} → ${targetMuscles}\n`;
      });
    }
    context += "\n";
  }

  // Add exercises grouped by exercise type
  for (const [exerciseType, typeExercises] of Object.entries(exercisesByType)) {
    context += `${exerciseType} EXERCISES:\n`;
    typeExercises.forEach(exercise => {
      const targetMuscles = Object.entries(exercise.volumeContributions)
        .filter(([, value]) => value > 0)
        .map(([muscle, value]) => `${muscle}(${value === 1 ? 'direct' : 'indirect'})`)
        .join(', ');
      
      context += `- ${exercise.name}`;
      if (exercise.equipment.length > 0) {
        context += ` (${exercise.equipment.join(', ')})`;
      }
      context += ` → ${targetMuscles}`;
      if (exercise.isRecommended) {
        context += ` [⭐ RECOMMENDED]`;
      }
      context += "\n";
    });
    context += "\n";
  }

  context += "IMPORTANT RULES:\n";
  context += "1. ONLY recommend exercises from this list\n";
  context += "2. Prefer recommended exercises (marked with ⭐) when available\n";
  context += "3. Prefer machine and cable exercises when available\n";
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
    
    // Map to Exercise interface with proper type casting
    return exercises.map(ex => ({
      ...ex,
      volumeContributions: (ex.volumeContributions as Record<string, number>) || {}
    }));
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
      exercisesByType
    ] = await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.count({ where: { category: 'APPROVED' } }),
      prisma.exercise.count({ where: { category: 'PENDING' } }),
      prisma.exercise.count({ where: { category: 'DEPRECATED' } }),
      prisma.exercise.count({ where: { isActive: true } }),
      prisma.exercise.groupBy({
        by: ['exerciseType'],
        _count: { exerciseType: true },
        where: { category: 'APPROVED', isActive: true }
      })
    ]);

    return {
      total: totalExercises,
      approved: approvedExercises,
      pending: pendingExercises,
      deprecated: deprecatedExercises,
      active: activeExercises,
      byExerciseType: exercisesByType.reduce((acc, item) => {
        acc[item.exerciseType] = item._count.exerciseType;
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
      byExerciseType: {}
    };
  }
}
