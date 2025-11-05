import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for creating exercise
const CreateExerciseSchema = z.object({
  exerciseId: z.string().cuid('Invalid exercise ID'),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1, 'Reps are required'), // e.g., "8-12" or "8"
  isUnilateral: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

// Helper to check admin access
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

/**
 * POST /api/admin/program-templates/[templateId]/workouts/[workoutId]/exercises
 * Add exercise to workout
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const { templateId, workoutId } = params;
    const body = await request.json();

    // Validate input
    const validatedData = CreateExerciseSchema.parse(body);

    // Check if workout exists and belongs to template
    const workout = await prisma.templateWorkout.findUnique({
      where: { id: workoutId },
      include: {
        templateExercises: {
          orderBy: { order: 'desc' },
          take: 1,
          select: { order: true },
        },
      },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (workout.templateId !== templateId) {
      return NextResponse.json({ error: 'Workout does not belong to this template' }, { status: 403 });
    }

    // Check if exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: validatedData.exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Determine order (auto-increment if not provided)
    const order = validatedData.order ?? (workout.templateExercises[0]?.order ?? -1) + 1;

    // Create exercise
    const templateExercise = await prisma.templateExercise.create({
      data: {
        workoutId,
        exerciseId: validatedData.exerciseId,
        sets: validatedData.sets,
        reps: validatedData.reps,
        isUnilateral: validatedData.isUnilateral,
        order,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            primaryMuscle: true,
            secondaryMuscles: true,
            exerciseType: true,
            volumeContributions: true,
          },
        },
      },
    });

    return NextResponse.json(templateExercise, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
