import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// GET /api/admin/training-splits/[id]/structures/[structureId] - Get a single structure
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; structureId: string }> }
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { structureId } = await context.params;

    const structure = await prisma.trainingSplitStructure.findUnique({
      where: { id: structureId },
      include: {
        trainingDayAssignments: {
          orderBy: { dayNumber: 'asc' },
        },
        _count: {
          select: {
            customTrainingPrograms: true,
          },
        },
      },
    });

    if (!structure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: structure.id,
        daysPerWeek: structure.daysPerWeek,
        pattern: structure.pattern,
        isWeeklyBased: structure.isWeeklyBased,
        createdAt: structure.createdAt,
        programCount: structure._count.customTrainingPrograms,
        dayAssignments: structure.trainingDayAssignments.map(day => ({
          id: day.id,
          dayOfWeek: day.dayOfWeek,
          dayNumber: day.dayNumber,
          workoutType: day.workoutType,
        })),
      },
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}

// PATCH /api/admin/training-splits/[id]/structures/[structureId] - Update a structure
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; structureId: string }> }
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { structureId } = await context.params;
    const body = await request.json();

    // Validate input
    const { daysPerWeek, pattern, isWeeklyBased, dayAssignments } = body;

    if (daysPerWeek !== undefined && (daysPerWeek < 1 || daysPerWeek > 7)) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      );
    }

    if (pattern !== undefined && pattern.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pattern cannot be empty' },
        { status: 400 }
      );
    }

    // Check if structure exists
    const existingStructure = await prisma.trainingSplitStructure.findUnique({
      where: { id: structureId },
    });

    if (!existingStructure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    // Update structure with day assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the structure
      const structure = await tx.trainingSplitStructure.update({
        where: { id: structureId },
        data: {
          ...(daysPerWeek !== undefined && { daysPerWeek }),
          ...(pattern !== undefined && { pattern }),
          ...(isWeeklyBased !== undefined && { isWeeklyBased }),
        },
      });

      // Update day assignments if provided
      if (dayAssignments !== undefined && Array.isArray(dayAssignments)) {
        // Delete existing assignments
        await tx.trainingDayAssignment.deleteMany({
          where: { structureId },
        });

        // Create new assignments
        if (dayAssignments.length > 0) {
          await tx.trainingDayAssignment.createMany({
            data: dayAssignments.map((day: { dayOfWeek?: string; dayNumber: number; workoutType: string }) => ({
              structureId: structure.id,
              dayOfWeek: day.dayOfWeek || null,
              dayNumber: day.dayNumber,
              workoutType: day.workoutType,
            })),
          });
        }
      }

      // Fetch the complete structure with assignments
      const completeStructure = await tx.trainingSplitStructure.findUnique({
        where: { id: structure.id },
        include: {
          trainingDayAssignments: {
            orderBy: { dayNumber: 'asc' },
          },
          _count: {
            select: {
              customTrainingPrograms: true,
            },
          },
        },
      });

      return completeStructure;
    });

    return NextResponse.json({
      data: {
        id: result!.id,
        daysPerWeek: result!.daysPerWeek,
        pattern: result!.pattern,
        isWeeklyBased: result!.isWeeklyBased,
        createdAt: result!.createdAt,
        programCount: result!._count.customTrainingPrograms,
        dayAssignments: result!.trainingDayAssignments.map(day => ({
          id: day.id,
          dayOfWeek: day.dayOfWeek,
          dayNumber: day.dayNumber,
          workoutType: day.workoutType,
        })),
      },
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}

// DELETE /api/admin/training-splits/[id]/structures/[structureId] - Delete a structure
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; structureId: string }> }
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { structureId } = await context.params;

    // Check if structure exists and is used by programs
    const structure = await prisma.trainingSplitStructure.findUnique({
      where: { id: structureId },
      include: {
        _count: {
          select: {
            customTrainingPrograms: true,
          },
        },
      },
    });

    if (!structure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    if (structure._count.customTrainingPrograms > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete structure',
          message: `This structure is used by ${structure._count.customTrainingPrograms} program(s). Please remove or reassign those programs first.`,
        },
        { status: 400 }
      );
    }

    // Delete structure (cascade will delete day assignments)
    await prisma.trainingSplitStructure.delete({
      where: { id: structureId },
    });

    return NextResponse.json({ message: 'Structure deleted successfully' });
  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}
