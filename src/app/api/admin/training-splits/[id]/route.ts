import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler, ValidationError, AuthenticationError } from '@/lib/error-handler';

export const runtime = 'nodejs';

/**
 * GET /api/admin/training-splits/[id]
 * Get a specific training split with its structures
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    const { id } = await params;

    // Check authentication and admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError('Not authenticated');
    }

    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (userData?.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    // Fetch training split with structures
    const trainingSplit = await prisma.trainingSplit.findUnique({
      where: { id },
      include: {
        trainingStructures: {
          include: {
            _count: {
              select: {
                trainingDayAssignments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            trainingStructures: true,
            customTrainingPrograms: true
          }
        }
      }
    });

    if (!trainingSplit) {
      throw new ValidationError('Training split not found');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: trainingSplit.id,
        name: trainingSplit.name,
        description: trainingSplit.description,
        focusAreas: trainingSplit.focusAreas,
        difficulty: trainingSplit.difficulty,
        isActive: trainingSplit.isActive,
        structuresCount: trainingSplit._count.trainingStructures,
        programsCount: trainingSplit._count.customTrainingPrograms,
        structures: trainingSplit.trainingStructures.map(structure => ({
          id: structure.id,
          pattern: structure.pattern,
          daysPerWeek: structure.daysPerWeek,
          isWeeklyBased: structure.isWeeklyBased,
          dayAssignmentsCount: structure._count.trainingDayAssignments,
          createdAt: structure.createdAt,
          updatedAt: structure.updatedAt
        })),
        createdAt: trainingSplit.createdAt,
        updatedAt: trainingSplit.updatedAt
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * PATCH /api/admin/training-splits/[id]
 * Update a training split
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    const { id } = await params;

    // Check authentication and admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError('Not authenticated');
    }

    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (userData?.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    // Parse request body
    const body = await request.json();
    const { name, description, focusAreas, difficulty, isActive } = body;

    // Check if split exists
    const existingSplit = await prisma.trainingSplit.findUnique({
      where: { id }
    });

    if (!existingSplit) {
      throw new ValidationError('Training split not found');
    }

    // Build update data
    interface UpdateData {
      name?: string;
      description?: string;
      focusAreas?: string[];
      difficulty?: string;
      isActive?: boolean;
    }
    
    const updateData: UpdateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Name cannot be empty');
      }

      // Check if another split has the same name
      const duplicateSplit = await prisma.trainingSplit.findFirst({
        where: {
          name: name.trim(),
          id: { not: id }
        }
      });

      if (duplicateSplit) {
        throw new ValidationError('A training split with this name already exists');
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        throw new ValidationError('Description cannot be empty');
      }
      updateData.description = description.trim();
    }

    if (focusAreas !== undefined) {
      if (!Array.isArray(focusAreas) || focusAreas.length === 0) {
        throw new ValidationError('At least one focus area is required');
      }

      // Validate focus areas
      const validFocusAreas = [
        'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes',
        'Core', 'Abs', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Calves'
      ];

      for (const area of focusAreas) {
        if (!validFocusAreas.includes(area)) {
          throw new ValidationError(`Invalid focus area: ${area}`);
        }
      }

      updateData.focusAreas = focusAreas;
    }

    if (difficulty !== undefined) {
      if (!['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
        throw new ValidationError('Difficulty must be Beginner, Intermediate, or Advanced');
      }
      updateData.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Update training split
    const updatedSplit = await prisma.trainingSplit.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            trainingStructures: true,
            customTrainingPrograms: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSplit.id,
        name: updatedSplit.name,
        description: updatedSplit.description,
        focusAreas: updatedSplit.focusAreas,
        difficulty: updatedSplit.difficulty,
        isActive: updatedSplit.isActive,
        structuresCount: updatedSplit._count.trainingStructures,
        programsCount: updatedSplit._count.customTrainingPrograms,
        createdAt: updatedSplit.createdAt,
        updatedAt: updatedSplit.updatedAt
      },
      message: 'Training split updated successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * DELETE /api/admin/training-splits/[id]
 * Soft delete a training split (set isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);

  try {
    const { id } = await params;

    // Check authentication and admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError('Not authenticated');
    }

    // Check if user is admin
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (userData?.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }

    // Check if split exists
    const existingSplit = await prisma.trainingSplit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customTrainingPrograms: true
          }
        }
      }
    });

    if (!existingSplit) {
      throw new ValidationError('Training split not found');
    }

    // Check if split is used in any programs
    if (existingSplit._count.customTrainingPrograms > 0) {
      // Soft delete - just deactivate
      await prisma.trainingSplit.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: `Training split deactivated (${existingSplit._count.customTrainingPrograms} programs are using it)`
      });
    }

    // Soft delete (set isActive = false)
    await prisma.trainingSplit.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Training split deactivated successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
