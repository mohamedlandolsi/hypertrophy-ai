import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/programs/[id]/workouts/[workoutId]
 * Fetch a specific workout with all exercises
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workoutId: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id: programId, workoutId } = await params;
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch workout with exercises
    const workout = await prisma.workout.findFirst({
      where: { 
        id: workoutId,
        programId: programId,
        program: {
          userId: user.id // Ensure user owns the program
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
        }
      }
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workout
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * PATCH /api/programs/[id]/workouts/[workoutId]
 * Update workout name and exercises
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workoutId: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id: programId, workoutId } = await params;
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, exercises } = body;

    // Verify workout exists and user owns it
    const existingWorkout = await prisma.workout.findFirst({
      where: { 
        id: workoutId,
        programId: programId,
        program: {
          userId: user.id
        }
      }
    });

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Workout not found or access denied' },
        { status: 404 }
      );
    }

    // Update workout in a transaction
    const updatedWorkout = await prisma.$transaction(async (tx) => {
      // Update workout name
      await tx.workout.update({
        where: { id: workoutId },
        data: {
          name: name || existingWorkout.name,
          updatedAt: new Date()
        }
      });

      // Delete existing exercises
      await tx.workoutExercise.deleteMany({
        where: { workoutId }
      });

      // Create new exercises
      if (exercises && exercises.length > 0) {
        await tx.workoutExercise.createMany({
          data: exercises.map((ex: {
            exerciseId: string;
            sets: number;
            reps: number;
            isBilateral: boolean;
            order: number;
          }) => ({
            workoutId,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            isBilateral: ex.isBilateral,
            order: ex.order
          }))
        });
      }

      // Fetch updated workout with exercises
      return await tx.workout.findUnique({
        where: { id: workoutId },
        include: {
          exercises: {
            include: {
              exercise: true
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Workout updated successfully',
      workout: updatedWorkout
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * DELETE /api/programs/[id]/workouts/[workoutId]
 * Delete a workout
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workoutId: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id: programId, workoutId } = await params;
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify workout exists and user owns it
    const existingWorkout = await prisma.workout.findFirst({
      where: { 
        id: workoutId,
        programId: programId,
        program: {
          userId: user.id
        }
      }
    });

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Workout not found or access denied' },
        { status: 404 }
      );
    }

    // Delete workout (cascade will delete exercises)
    await prisma.workout.delete({
      where: { id: workoutId }
    });

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
