import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// POST /api/admin/training-splits/[id]/structures/[structureId]/clone - Clone a structure
export async function POST(
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

    // Get the structure to clone
    const originalStructure = await prisma.trainingSplitStructure.findUnique({
      where: { id: structureId },
      include: {
        trainingDayAssignments: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!originalStructure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    // Clone structure with day assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the cloned structure
      const clonedStructure = await tx.trainingSplitStructure.create({
        data: {
          splitId: originalStructure.splitId,
          daysPerWeek: originalStructure.daysPerWeek,
          pattern: `${originalStructure.pattern} (Copy)`,
          isWeeklyBased: originalStructure.isWeeklyBased,
        },
      });

      // Clone day assignments
      if (originalStructure.trainingDayAssignments.length > 0) {
        await tx.trainingDayAssignment.createMany({
          data: originalStructure.trainingDayAssignments.map(day => ({
            structureId: clonedStructure.id,
            dayOfWeek: day.dayOfWeek,
            dayNumber: day.dayNumber,
            workoutType: day.workoutType,
          })),
        });
      }

      // Fetch the complete cloned structure with assignments
      const completeStructure = await tx.trainingSplitStructure.findUnique({
        where: { id: clonedStructure.id },
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
