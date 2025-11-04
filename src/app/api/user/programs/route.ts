import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// GET - Fetch user's custom programs
export async function GET(request: NextRequest) {
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

    // Get query parameters for sorting and filtering
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status'); // DRAFT or ACTIVE

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: user.id };
    if (status === 'DRAFT' || status === 'ACTIVE') {
      where.status = status;
    }

    // Fetch user's programs
    const programs = await prisma.customTrainingProgram.findMany({
      where,
      include: {
        trainingSplit: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            focusAreas: true,
          }
        },
        splitStructure: {
          select: {
            id: true,
            daysPerWeek: true,
            pattern: true,
          }
        },
        workouts: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    return NextResponse.json({
      success: true,
      programs,
      count: programs.length
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// POST - Create new custom program
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
    const { name, description } = body;
    // Note: startMethod and templateId are accepted but not used yet
    // Template import will be handled through the workouts page after split selection

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

    // Get a default split and structure as placeholders
    // User will be redirected to split-structure page to choose their actual split
    const defaultSplit = await prisma.trainingSplit.findFirst({
      orderBy: { name: 'asc' }
    });

    if (!defaultSplit) {
      return NextResponse.json(
        { error: 'No training splits available. Please contact support.' },
        { status: 500 }
      );
    }

    const defaultStructure = await prisma.trainingSplitStructure.findFirst({
      where: { splitId: defaultSplit.id },
      orderBy: { daysPerWeek: 'asc' }
    });

    if (!defaultStructure) {
      return NextResponse.json(
        { error: 'No structures available for default split. Please contact support.' },
        { status: 500 }
      );
    }

    // Create program with placeholder split/structure
    // User will select actual split on split-structure page
    const program = await prisma.customTrainingProgram.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        splitId: defaultSplit.id,
        structureId: defaultStructure.id,
        workoutStructureType: 'REPEATING',
        status: 'DRAFT'
      },
      include: {
        trainingSplit: true,
        splitStructure: true,
        workouts: true
      }
    });

    return NextResponse.json({
      success: true,
      program,
      requiresSplitSelection: true,
      message: 'Program created successfully. Please select your training split.'
    }, { status: 201 });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
