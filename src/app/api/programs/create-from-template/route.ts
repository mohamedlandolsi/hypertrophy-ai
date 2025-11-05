import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PLAN_LIMITS } from '@/lib/subscription';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for creating program from template
const CreateFromTemplateSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  customName: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/programs/create-from-template
 * Create a new program by cloning a template
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = CreateFromTemplateSchema.parse(body);
    const { templateId, customName } = validatedData;

    // Fetch user with subscription details
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        plan: true,
        _count: {
          select: {
            customTrainingPrograms: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check tier limits for FREE users
    const planLimits = PLAN_LIMITS[dbUser.plan];
    if (dbUser._count.customTrainingPrograms >= planLimits.customPrograms && planLimits.customPrograms !== -1) {
      return NextResponse.json(
        {
          error: 'Program limit reached',
          message: `You have reached the limit of ${planLimits.customPrograms} program(s) for your plan. Upgrade to PRO for unlimited programs.`,
          requiresUpgrade: true,
          currentPlan: dbUser.plan,
          currentCount: dbUser._count.customTrainingPrograms,
          limit: planLimits.customPrograms,
        },
        { status: 403 }
      );
    }

    // Fetch template with full details
    const template = await prisma.programTemplate.findUnique({
      where: { id: templateId },
      include: {
        templateWorkouts: {
          orderBy: { order: 'asc' },
          include: {
            templateExercises: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.isActive) {
      return NextResponse.json({ error: 'This template is no longer available' }, { status: 400 });
    }

    // Create program from template in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the custom training program
      const program = await tx.customTrainingProgram.create({
        data: {
          userId: user.id,
          name: customName || template.name,
          description: template.description || '',
          splitId: template.splitId,
          structureId: template.structureId,
          workoutStructureType: template.workoutStructureType,
          status: 'ACTIVE',
        },
      });

      // 2. Clone all template workouts
      for (const templateWorkout of template.templateWorkouts) {
        const workout = await tx.workout.create({
          data: {
            programId: program.id,
            name: templateWorkout.name,
            type: templateWorkout.type,
            assignedDays: templateWorkout.assignedDays,
          },
        });

        // 3. Clone all exercises for this workout
        for (const templateExercise of templateWorkout.templateExercises) {
          await tx.workoutExercise.create({
            data: {
              workoutId: workout.id,
              exerciseId: templateExercise.exerciseId,
              sets: templateExercise.sets,
              reps: templateExercise.reps,
              isUnilateral: templateExercise.isUnilateral,
              order: templateExercise.order,
            },
          });
        }
      }

      // 4. Increment template popularity counter
      await tx.programTemplate.update({
        where: { id: template.id },
        data: {
          popularity: {
            increment: 1,
          },
        },
      });

      // 5. Return the created program with full details
      return await tx.customTrainingProgram.findUnique({
        where: { id: program.id },
        include: {
          trainingSplit: true,
          splitStructure: true,
          workouts: {
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: {
                  exercise: {
                    select: {
                      id: true,
                      name: true,
                      exerciseType: true,
                      primaryMuscle: true,
                      secondaryMuscles: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              workouts: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        program: result,
        message: 'Program created successfully from template',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating program from template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
