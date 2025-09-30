import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
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

    const exercise = await prisma.exercise.findUnique({
      where: { id: id }
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exercise });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
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

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: id }
    });

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Update exercise
    const exercise = await prisma.exercise.update({
      where: { id: id },
      data: {
        name: name.trim(),
        exerciseType,
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        equipment: equipment || [],
        category: category || 'APPROVED',
        isActive: isActive !== undefined ? isActive : true,
        isRecommended: isRecommended !== undefined ? isRecommended : false,
        volumeContributions: volumeContributions || {},
        regionalBias: regionalBias || {},
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      exercise,
      message: 'Exercise updated successfully' 
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
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

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: id }
    });

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Instead of hard delete, mark as inactive and deprecated
    const exercise = await prisma.exercise.update({
      where: { id: id },
      data: {
        isActive: false,
        category: 'DEPRECATED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      exercise,
      message: 'Exercise marked as deprecated successfully' 
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
