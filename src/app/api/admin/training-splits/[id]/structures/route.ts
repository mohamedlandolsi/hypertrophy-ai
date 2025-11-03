import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// GET /api/admin/training-splits/[id]/structures - List all structures for a split
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id: splitId } = await context.params;

    // Get the split info
    const split = await prisma.trainingSplit.findUnique({
      where: { id: splitId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!split) {
      return NextResponse.json({ error: 'Split not found' }, { status: 404 });
    }

    // Get all structures for this split
    const structures = await prisma.trainingSplitStructure.findMany({
      where: { splitId },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      split,
      structures: structures.map(structure => ({
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
      })),
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}

// POST /api/admin/training-splits/[id]/structures - Create a new structure
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id: splitId } = await context.params;
    const body = await request.json();

    // Validate input
    const { daysPerWeek, pattern, isWeeklyBased, dayAssignments } = body;

    if (!daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      );
    }

    if (!pattern || pattern.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pattern is required' },
        { status: 400 }
      );
    }

    if (typeof isWeeklyBased !== 'boolean') {
      return NextResponse.json(
        { error: 'isWeeklyBased must be a boolean' },
        { status: 400 }
      );
    }

    // Validate day assignments
    if (isWeeklyBased && (!dayAssignments || !Array.isArray(dayAssignments))) {
      return NextResponse.json(
        { error: 'Day assignments are required for weekly-based structures' },
        { status: 400 }
      );
    }

    if (isWeeklyBased && dayAssignments.length !== daysPerWeek) {
      return NextResponse.json(
        { error: 'Number of day assignments must match days per week' },
        { status: 400 }
      );
    }

    // Verify split exists
    const split = await prisma.trainingSplit.findUnique({
      where: { id: splitId },
    });

    if (!split) {
      return NextResponse.json({ error: 'Split not found' }, { status: 404 });
    }

    // Create structure with day assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the structure
      const structure = await tx.trainingSplitStructure.create({
        data: {
          splitId,
          daysPerWeek,
          pattern,
          isWeeklyBased,
        },
      });

      // Create day assignments if provided
      if (dayAssignments && dayAssignments.length > 0) {
        await tx.trainingDayAssignment.createMany({
          data: dayAssignments.map((day: { dayOfWeek?: string; dayNumber: number; workoutType: string }) => ({
            structureId: structure.id,
            dayOfWeek: day.dayOfWeek || null,
            dayNumber: day.dayNumber,
            workoutType: day.workoutType,
          })),
        });
      }

      // Fetch the complete structure with assignments
      const completeStructure = await tx.trainingSplitStructure.findUnique({
        where: { id: structure.id },
        include: {
          trainingDayAssignments: {
            orderBy: { dayNumber: 'asc' },
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
        programCount: 0,
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
