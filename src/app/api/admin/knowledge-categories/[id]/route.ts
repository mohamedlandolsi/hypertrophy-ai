import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  AuthenticationError, 
  AuthorizationError,
  ValidationError,
  NotFoundError,
  logger 
} from '@/lib/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch a specific knowledge category (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
    logger.info('Knowledge category fetch requested', { ...context, categoryId: id });
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const category = await prisma.knowledgeCategory.findUnique({
      where: { id },
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              select: { 
                id: true,
                title: true,
                type: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const categoryWithItems = {
      id: category.id,
      name: category.name,
      description: category.description,
      items: category.KnowledgeItemCategory.map(kic => kic.KnowledgeItem),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    logger.info('Knowledge category fetched successfully', { 
      ...context, 
      userId: user.id,
      categoryId: id
    });

    return NextResponse.json({ category: categoryWithItems });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// PUT - Update a knowledge category (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
    logger.info('Knowledge category update requested', { ...context, categoryId: id });
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    const { name, description } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    if (name.length > 100) {
      throw new ValidationError('Category name must be 100 characters or less');
    }

    if (description && description.length > 500) {
      throw new ValidationError('Category description must be 500 characters or less');
    }

    const category = await prisma.knowledgeCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    });

    logger.info('Knowledge category updated successfully', { 
      ...context, 
      userId: user.id,
      categoryId: id
    });

    return NextResponse.json({ 
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return ApiErrorHandler.handleError(new NotFoundError('Category not found'), context);
    }
    return ApiErrorHandler.handleError(error, context);
  }
}

// DELETE - Delete a knowledge category (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
    logger.info('Knowledge category deletion requested', { ...context, categoryId: id });
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }

    // Check if category exists
    const category = await prisma.knowledgeCategory.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Delete the category (cascade will handle KnowledgeItemCategory relationships)
    await prisma.knowledgeCategory.delete({
      where: { id }
    });

    logger.info('Knowledge category deleted successfully', { 
      ...context, 
      userId: user.id,
      categoryId: id
    });

    return NextResponse.json({ 
      message: 'Category deleted successfully'
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
