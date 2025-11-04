import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// POST - Create program with full configuration (guided flow)
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      difficulty,
      splitId, 
      structureId, 
      workoutStructureType 
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Program name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Program name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (!difficulty || !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Valid difficulty level is required' },
        { status: 400 }
      );
    }

    if (!splitId || !structureId || !workoutStructureType) {
      return NextResponse.json(
        { error: 'Split, structure, and workout type are required' },
        { status: 400 }
      );
    }

    // Verify split exists
    const split = await prisma.trainingSplit.findUnique({
      where: { id: splitId }
    });

    if (!split) {
      return NextResponse.json(
        { error: 'Invalid training split' },
        { status: 404 }
      );
    }

    // Verify structure exists and belongs to split
    const structure = await prisma.trainingSplitStructure.findUnique({
      where: { id: structureId }
    });

    if (!structure || structure.splitId !== splitId) {
      return NextResponse.json(
        { error: 'Invalid structure for selected split' },
        { status: 400 }
      );
    }

    // Validate workout structure type
    if (!['REPEATING', 'AB', 'ABC'].includes(workoutStructureType)) {
      return NextResponse.json(
        { error: 'Invalid workout structure type' },
        { status: 400 }
      );
    }

    // Create program with full configuration
    const program = await prisma.customTrainingProgram.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} level ${split.name} program`,
        splitId,
        structureId,
        workoutStructureType,
        status: 'DRAFT'
      },
      include: {
        trainingSplit: {
          select: {
            id: true,
            name: true,
            description: true,
            difficulty: true,
            focusAreas: true
          }
        },
        splitStructure: {
          select: {
            id: true,
            daysPerWeek: true,
            pattern: true
          }
        },
        workouts: true
      }
    });

    return NextResponse.json({
      success: true,
      program,
      message: 'Program created successfully'
    }, { status: 201 });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
