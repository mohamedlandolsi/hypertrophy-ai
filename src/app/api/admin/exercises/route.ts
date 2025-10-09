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
    const exerciseType = url.searchParams.get('exerciseType');
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('isActive');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (exerciseType) {
      where.exerciseType = exerciseType;
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
          { exerciseType: 'asc' },
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
      exerciseType, 
      description, 
      instructions, 
      equipment, 
      category, 
      isActive, 
      isRecommended,
      imageUrl,
      imageType,
      volumeContributions,
      regionalBias
    } = body;

    // Validate required fields
    if (!name || !exerciseType || !volumeContributions || Object.keys(volumeContributions).length === 0) {
      return NextResponse.json(
        { error: 'Name, exercise type, and volume contributions are required' },
        { status: 400 }
      );
    }

    // Create exercise
    const exercise = await prisma.exercise.create({
      data: {
        id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        exerciseType,
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        equipment: equipment || [],
        category: category || 'APPROVED',
        isActive: isActive ?? true,
        isRecommended: isRecommended ?? false,
        imageUrl: imageUrl || null,
        imageType: imageType || null,
        volumeContributions: volumeContributions || {},
        regionalBias: regionalBias || {},
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
