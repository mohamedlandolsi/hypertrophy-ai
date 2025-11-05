import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for updating exercise
const UpdateExerciseSchema = z.object({
  sets: z.number().int().min(1).max(10).optional(),
  reps: z.string().min(1).optional(), // e.g., "8-12" or "8"
  isUnilateral: z.boolean().optional(),
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
 * PATCH /api/admin/program-templates/[templateId]/workouts/[workoutId]/exercises/[exerciseId]
 * Update exercise details (sets, reps, order, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string; workoutId: string; exerciseId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const { templateId, workoutId, exerciseId } = params;
    const body = await request.json();

    // Validate input
    const validatedData = UpdateExerciseSchema.parse(body);

    // Check if exercise exists and belongs to workout
    const templateExercise = await prisma.templateExercise.findUnique({
      where: { id: exerciseId },
      include: {
        workout: true,
      },
    });

    if (!templateExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (templateExercise.workoutId !== workoutId) {
      return NextResponse.json({ error: 'Exercise does not belong to this workout' }, { status: 403 });
    }

    if (templateExercise.workout.templateId !== templateId) {
      return NextResponse.json({ error: 'Workout does not belong to this template' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.sets !== undefined) updateData.sets = validatedData.sets;
    if (validatedData.reps !== undefined) updateData.reps = validatedData.reps;
    if (validatedData.isUnilateral !== undefined) updateData.isUnilateral = validatedData.isUnilateral;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    // Update exercise
    const updatedExercise = await prisma.templateExercise.update({
      where: { id: exerciseId },
      data: updateData,
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

    return NextResponse.json(updatedExercise, { status: 200 });
  } catch (error) {
    console.error('Error updating exercise:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/program-templates/[templateId]/workouts/[workoutId]/exercises/[exerciseId]
 * Remove exercise from workout
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string; workoutId: string; exerciseId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const { templateId, workoutId, exerciseId } = params;

    // Check if exercise exists and belongs to workout
    const templateExercise = await prisma.templateExercise.findUnique({
      where: { id: exerciseId },
      include: {
        workout: true,
      },
    });

    if (!templateExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (templateExercise.workoutId !== workoutId) {
      return NextResponse.json({ error: 'Exercise does not belong to this workout' }, { status: 403 });
    }

    if (templateExercise.workout.templateId !== templateId) {
      return NextResponse.json({ error: 'Workout does not belong to this template' }, { status: 403 });
    }

    // Delete exercise
    await prisma.templateExercise.delete({
      where: { id: exerciseId },
    });

    return NextResponse.json({ success: true, message: 'Exercise deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
