import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

/**
 * POST /api/programs/[id]/import-template
 * Import a workout template into the program
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id: programId } = await params;
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify program ownership
    const program = await prisma.customTrainingProgram.findUnique({
      where: { 
        id: programId,
        userId: user.id
      },
      include: {
        workouts: {
          select: { 
            id: true,
            name: true, 
            type: true 
          }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { templateId, conflictStrategy = 'rename' } = body; // 'rename', 'skip', or 'replace'

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch template workout with exercises
    const template = await prisma.workout.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          include: {
            exercise: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check for name conflicts
    const existingWorkout = program.workouts.find(
      w => w.name === template.name && w.type === template.type
    );

    let workoutName = template.name;

    if (existingWorkout) {
      if (conflictStrategy === 'skip') {
        return NextResponse.json({
          success: false,
          error: 'Workout with same name already exists',
          skipped: true
        });
      } else if (conflictStrategy === 'rename') {
        // Find available name
        let counter = 1;
        while (program.workouts.some(w => w.name === `${template.name} (${counter})`)) {
          counter++;
        }
        workoutName = `${template.name} (${counter})`;
      } else if (conflictStrategy === 'replace') {
        // Delete existing workout
        await prisma.workout.delete({
          where: { id: existingWorkout.id }
        });
      }
    }

    // Import workout and exercises in a transaction
    const importedWorkout = await prisma.$transaction(async (tx) => {
      // Create workout
      const newWorkout = await tx.workout.create({
        data: {
          programId: programId,
          name: workoutName,
          type: template.type,
          assignedDays: template.assignedDays
        }
      });

      // Create exercises
      if (template.exercises.length > 0) {
        await tx.workoutExercise.createMany({
          data: template.exercises.map((ex, index) => ({
            workoutId: newWorkout.id,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            isUnilateral: ex.isUnilateral,
            order: index
          }))
        });
      }

      // Fetch complete workout with exercises
      return await tx.workout.findUnique({
        where: { id: newWorkout.id },
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
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      workout: importedWorkout,
      renamed: workoutName !== template.name
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
