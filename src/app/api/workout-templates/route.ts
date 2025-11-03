import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

/**
 * GET /api/workout-templates
 * Fetch available workout templates for importing
 */
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const splitId = searchParams.get('splitId');
    const difficulty = searchParams.get('difficulty');

    // Build where clause
    interface WhereClause {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        type?: { contains: string; mode: 'insensitive' };
      }>;
      exercises?: {
        some: Record<string, never>;
      };
    }

    const where: WhereClause = {};

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch workout templates from other users' programs (with exercises > 0)
    // This creates a "template library" from existing workouts
    const templates = await prisma.workout.findMany({
      where: {
        ...where,
        exercises: {
          some: {} // Only workouts that have exercises
        }
      },
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                primaryMuscle: true,
                secondaryMuscles: true,
                exerciseType: true,
                volumeContributions: true,
                canBeUnilateral: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        program: {
          include: {
            trainingSplit: {
              select: {
                id: true,
                name: true,
                difficulty: true,
                focusAreas: true
              }
            }
          }
        }
      },
      take: 50,
      orderBy: [
        { exercises: { _count: 'desc' } }, // More exercises first
        { createdAt: 'desc' }
      ]
    });

    // Filter by split if specified
    let filteredTemplates = templates;
    if (splitId) {
      filteredTemplates = templates.filter(t => t.program.trainingSplit.id === splitId);
    }

    // Filter by difficulty if specified
    if (difficulty) {
      filteredTemplates = filteredTemplates.filter(
        t => t.program.trainingSplit.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Transform to template format
    const workoutTemplates = filteredTemplates.map(workout => ({
      id: workout.id,
      name: workout.name,
      type: workout.type,
      exerciseCount: workout.exercises.length,
      exercises: workout.exercises.map(ex => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        isBilateral: !ex.isUnilateral, // Convert isUnilateral to isBilateral
        order: ex.order
      })),
      split: {
        id: workout.program.trainingSplit.id,
        name: workout.program.trainingSplit.name,
        difficulty: workout.program.trainingSplit.difficulty,
        focusAreas: workout.program.trainingSplit.focusAreas
      }
    }));

    // Get unique splits for filter options
    const uniqueSplits = Array.from(
      new Map(
        templates.map(t => [
          t.program.trainingSplit.id,
          {
            id: t.program.trainingSplit.id,
            name: t.program.trainingSplit.name,
            difficulty: t.program.trainingSplit.difficulty
          }
        ])
      ).values()
    );

    // Get unique difficulties
    const uniqueDifficulties = Array.from(
      new Set(templates.map(t => t.program.trainingSplit.difficulty))
    );

    return NextResponse.json({
      success: true,
      templates: workoutTemplates,
      filters: {
        splits: uniqueSplits,
        difficulties: uniqueDifficulties
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
