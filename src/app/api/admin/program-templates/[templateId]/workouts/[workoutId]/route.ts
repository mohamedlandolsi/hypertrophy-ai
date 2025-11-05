import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for updating workout
const UpdateWorkoutSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  assignedDays: z.array(z.number().int().min(1).max(7)).min(1)
    .transform((days) => days.map(String)) // Convert to string array
    .optional(),
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
 * PATCH /api/admin/program-templates/[templateId]/workouts/[workoutId]
 * Update workout details
 */
export async function PATCH(
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
    const validatedData = UpdateWorkoutSchema.parse(body);

    // Check if workout exists and belongs to template
    const workout = await prisma.templateWorkout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (workout.templateId !== templateId) {
      return NextResponse.json({ error: 'Workout does not belong to this template' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.assignedDays !== undefined) updateData.assignedDays = validatedData.assignedDays;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    // Update workout
    const updatedWorkout = await prisma.templateWorkout.update({
      where: { id: workoutId },
      data: updateData,
      include: {
        templateExercises: {
          orderBy: { order: 'asc' },
          include: {
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
        },
      },
    });

    return NextResponse.json(updatedWorkout, { status: 200 });
  } catch (error) {
    console.error('Error updating workout:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/program-templates/[templateId]/workouts/[workoutId]
 * Delete workout from template
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const { templateId, workoutId } = params;

    // Check if workout exists and belongs to template
    const workout = await prisma.templateWorkout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (workout.templateId !== templateId) {
      return NextResponse.json({ error: 'Workout does not belong to this template' }, { status: 403 });
    }

    // Delete workout (cascade will handle exercises)
    await prisma.templateWorkout.delete({
      where: { id: workoutId },
    });

    return NextResponse.json({ success: true, message: 'Workout deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
