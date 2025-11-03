import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler, ValidationError, AuthenticationError } from '@/lib/error-handler';

export const runtime = 'nodejs';

/**
 * GET /api/admin/training-splits
 * Get all training splits with optional filters
 */
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const activeFilter = searchParams.get('active'); // 'true', 'false', or null (all)

    // Build where clause
    interface WhereClause {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
      isActive?: boolean;
    }
    
    const where: WhereClause = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (activeFilter !== null) {
      where.isActive = activeFilter === 'true';
    }

    // Fetch training splits with related structures count
    const trainingSplits = await prisma.trainingSplit.findMany({
      where,
      include: {
        trainingStructures: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            trainingStructures: true,
            customTrainingPrograms: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform data for response
    const response = trainingSplits.map(split => ({
      id: split.id,
      name: split.name,
      description: split.description,
      focusAreas: split.focusAreas,
      difficulty: split.difficulty,
      isActive: split.isActive,
      structuresCount: split._count.trainingStructures,
      programsCount: split._count.customTrainingPrograms,
      createdAt: split.createdAt,
      updatedAt: split.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * POST /api/admin/training-splits
 * Create a new training split
 */
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
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

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new ValidationError('Description is required');
    }

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

    if (!difficulty || !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      throw new ValidationError('Difficulty must be Beginner, Intermediate, or Advanced');
    }

    // Check if split with same name already exists
    const existingSplit = await prisma.trainingSplit.findFirst({
      where: { name: name.trim() }
    });

    if (existingSplit) {
      throw new ValidationError('A training split with this name already exists');
    }

    // Create training split
    const trainingSplit = await prisma.trainingSplit.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        focusAreas,
        difficulty,
        isActive: isActive !== false // Default to true if not specified
      },
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
        id: trainingSplit.id,
        name: trainingSplit.name,
        description: trainingSplit.description,
        focusAreas: trainingSplit.focusAreas,
        difficulty: trainingSplit.difficulty,
        isActive: trainingSplit.isActive,
        structuresCount: trainingSplit._count.trainingStructures,
        programsCount: trainingSplit._count.customTrainingPrograms,
        createdAt: trainingSplit.createdAt,
        updatedAt: trainingSplit.updatedAt
      },
      message: 'Training split created successfully'
    }, { status: 201 });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
