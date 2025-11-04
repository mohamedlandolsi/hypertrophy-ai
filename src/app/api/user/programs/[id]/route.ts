import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Fetch single program details
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: programId } = await context.params;

    // Fetch program and verify ownership
    const program = await prisma.customTrainingProgram.findUnique({
      where: { id: programId },
      include: {
        trainingSplit: true,
        splitStructure: true,
        workouts: {
          include: {
            exercises: {
              include: {
                exercise: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (program.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this program' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      program
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}

// PATCH - Update program metadata
export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: programId } = await context.params;
    const body = await request.json();
    const { name, description, status } = body;

    // Verify program exists and user owns it
    const existingProgram = await prisma.customTrainingProgram.findUnique({
      where: { id: programId }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (existingProgram.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this program' },
        { status: 403 }
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Program name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Program name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    if (status !== undefined) {
      if (status !== 'DRAFT' && status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Invalid status. Must be DRAFT or ACTIVE' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Update program
    const updatedProgram = await prisma.customTrainingProgram.update({
      where: { id: programId },
      data: updateData,
      include: {
        trainingSplit: true,
        splitStructure: true,
        workouts: {
          include: {
            exercises: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      program: updatedProgram,
      message: 'Program updated successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}

// DELETE - Delete program
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  const apiContext = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: programId } = await context.params;

    // Verify program exists and user owns it
    const program = await prisma.customTrainingProgram.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (program.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this program' },
        { status: 403 }
      );
    }

    // Delete program (cascade will handle workouts and exercises)
    await prisma.customTrainingProgram.delete({
      where: { id: programId }
    });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, apiContext);
  }
}
