import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Authenticate and check admin access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering/pagination
    const url = new URL(request.url);
    const muscleGroup = url.searchParams.get('muscleGroup');
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('isActive');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get exercises with pagination
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [
          { muscleGroup: 'asc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.exercise.count({ where })
    ]);

    return NextResponse.json({
      exercises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Authenticate and check admin access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      muscleGroup, 
      description, 
      instructions, 
      equipment, 
      category, 
      isActive, 
      difficulty 
    } = body;

    // Validate required fields
    if (!name || !muscleGroup) {
      return NextResponse.json(
        { error: 'Name and muscle group are required' },
        { status: 400 }
      );
    }

    // Create exercise
    const exercise = await prisma.exercise.create({
      data: {
        id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        muscleGroup,
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        equipment: equipment || [],
        category: category || 'APPROVED',
        isActive: isActive !== undefined ? isActive : true,
        difficulty: difficulty || 'INTERMEDIATE',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      exercise,
      message: 'Exercise created successfully' 
    });

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An exercise with this name already exists' },
        { status: 400 }
      );
    }
    return ApiErrorHandler.handleError(error, context);
  }
}
