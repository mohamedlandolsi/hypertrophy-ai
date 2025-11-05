import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for creating workout
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  type: z.string().min(1, 'Workout type is required'),
  assignedDays: z.array(z.number().int().min(1).max(7)).min(1, 'At least one day must be assigned')
    .transform((days) => days.map(String)), // Convert to string array
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
 * POST /api/admin/program-templates/[templateId]/workouts
 * Create new workout for template
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const templateId = params.templateId;
    const body = await request.json();

    // Validate input
    const validatedData = CreateWorkoutSchema.parse(body);

    // Check if template exists
    const template = await prisma.programTemplate.findUnique({
      where: { id: templateId },
      include: {
        templateWorkouts: {
          orderBy: { order: 'desc' },
          take: 1,
          select: { order: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Determine order (auto-increment if not provided)
    const order = validatedData.order ?? (template.templateWorkouts[0]?.order ?? -1) + 1;

    // Create workout
    const workout = await prisma.templateWorkout.create({
      data: {
        templateId,
        name: validatedData.name,
        type: validatedData.type,
        assignedDays: validatedData.assignedDays,
        order,
      },
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

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
