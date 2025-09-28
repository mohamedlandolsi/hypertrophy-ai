import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';

// GET /api/admin/programs/[id] - Get detailed program information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Get the program ID from params
    const { id: programId } = await params;

    if (!programId || typeof programId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Check authentication and admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch the training program with all related data
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
        programGuide: true,
        _count: {
          select: {
            userPurchases: true,
            userPrograms: true,
            exerciseTemplates: true,
          }
        }
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
    });

  } catch (error) {
    console.error('Error fetching program details:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

// PUT /api/admin/programs/[id] - Update program (placeholder for future implementation)
export async function PUT(
  request: NextRequest
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // This would implement program updates in the future
    // For now, return method not implemented
    return NextResponse.json(
      { success: false, error: 'Program updates not yet implemented' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error updating program:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

// DELETE /api/admin/programs/[id] - Delete program (could be moved here from actions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    const { id: programId } = await params;

    if (!programId || typeof programId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Check authentication and admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if program exists and has no purchases (prevent deletion if purchased)
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: {
            userPurchases: true,
          }
        }
      }
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    if (program._count.userPurchases > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete program with existing purchases' },
        { status: 400 }
      );
    }

    // Delete program and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.exerciseTemplate.deleteMany({
        where: { trainingProgramId: programId }
      });

      await tx.workoutTemplate.deleteMany({
        where: { trainingProgramId: programId }
      });

      await tx.programGuide.deleteMany({
        where: { trainingProgramId: programId }
      });

      await tx.userProgram.deleteMany({
        where: { trainingProgramId: programId }
      });

      await tx.programCategory.deleteMany({
        where: { trainingProgramId: programId }
      });

      // Finally delete the program
      await tx.trainingProgram.delete({
        where: { id: programId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Training program deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting program:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}