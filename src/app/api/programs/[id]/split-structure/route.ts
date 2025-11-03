import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/programs/[id]/split-structure
 * Fetch program's split and structure details
 */
export async function GET(
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

    // Fetch program with split and structure details
    const program = await prisma.customTrainingProgram.findUnique({
      where: { 
        id: programId,
        userId: user.id // Ensure user owns the program
      },
      include: {
        trainingSplit: true,
        splitStructure: {
          include: {
            trainingDayAssignments: {
              orderBy: { dayNumber: 'asc' }
            }
          }
        },
        workouts: {
          select: {
            id: true,
            name: true,
            type: true,
            assignedDays: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      program: {
        id: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
        split: program.trainingSplit,
        structure: program.splitStructure,
        workouts: program.workouts
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * PATCH /api/programs/[id]/split-structure
 * Update program's split and structure
 */
export async function PATCH(
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

    const body = await request.json();
    const { splitId, structureId, customDayAssignments } = body;

    // Validate required fields
    if (!splitId || !structureId) {
      return NextResponse.json(
        { error: 'Split ID and structure ID are required' },
        { status: 400 }
      );
    }

    // Verify program exists and user owns it
    const existingProgram = await prisma.customTrainingProgram.findUnique({
      where: { 
        id: programId,
        userId: user.id
      },
      include: {
        workouts: {
          include: {
            exercises: true
          }
        }
      }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found or access denied' },
        { status: 404 }
      );
    }

    // Verify split and structure exist
    const [split, structure] = await Promise.all([
      prisma.trainingSplit.findUnique({
        where: { id: splitId }
      }),
      prisma.trainingSplitStructure.findUnique({
        where: { id: structureId },
        include: {
          trainingDayAssignments: true
        }
      })
    ]);

    if (!split) {
      return NextResponse.json(
        { error: 'Training split not found' },
        { status: 404 }
      );
    }

    if (!structure) {
      return NextResponse.json(
        { error: 'Training structure not found' },
        { status: 404 }
      );
    }

    // Verify structure belongs to split
    if (structure.splitId !== splitId) {
      return NextResponse.json(
        { error: 'Structure does not belong to selected split' },
        { status: 400 }
      );
    }

    // If changing split/structure, we need to update or delete existing workouts
    const isSplitChanged = existingProgram.splitId !== splitId;
    const isStructureChanged = existingProgram.structureId !== structureId;

    // Update program in a transaction
    const updatedProgram = await prisma.$transaction(async (tx) => {
      // Update the program
      const program = await tx.customTrainingProgram.update({
        where: { id: programId },
        data: {
          splitId,
          structureId,
          updatedAt: new Date()
        },
        include: {
          trainingSplit: true,
          splitStructure: {
            include: {
              trainingDayAssignments: {
                orderBy: { dayNumber: 'asc' }
              }
            }
          }
        }
      });

      // If split or structure changed and there are existing workouts, 
      // we should optionally handle them (delete, update, etc.)
      // For now, we'll keep existing workouts but mark program as needing review
      if ((isSplitChanged || isStructureChanged) && existingProgram.workouts.length > 0) {
        // Optionally: Update workout assignedDays based on customDayAssignments
        if (customDayAssignments && structure.isWeeklyBased) {
          // Map workout types to new day assignments
          const dayAssignmentMap = new Map<string, string>(
            customDayAssignments.map((assignment: { workoutType: string; dayOfWeek: string }) => 
              [assignment.workoutType, assignment.dayOfWeek]
            )
          );

          // Update each workout's assigned days
          for (const workout of existingProgram.workouts) {
            const newAssignedDay = dayAssignmentMap.get(workout.type);
            if (newAssignedDay && typeof newAssignedDay === 'string') {
              await tx.workout.update({
                where: { id: workout.id },
                data: { 
                  assignedDays: [newAssignedDay],
                  updatedAt: new Date()
                }
              });
            }
          }
        }
      }

      return program;
    });

    return NextResponse.json({
      success: true,
      message: 'Split and structure updated successfully',
      program: updatedProgram,
      workoutsAffected: isSplitChanged || isStructureChanged ? existingProgram.workouts.length : 0
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
