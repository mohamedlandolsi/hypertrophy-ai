import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  AuthenticationError, 
  AuthorizationError,
  ValidationError,
  logger 
} from '@/lib/error-handler';

// GET - Fetch all knowledge categories (admin only)
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge categories fetch requested', context);
    
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

    // Fetch all knowledge categories with item counts
    const categories = await prisma.knowledgeCategory.findMany({
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeItem: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to include item counts
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      itemCount: category.KnowledgeItemCategory.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    logger.info('Knowledge categories fetched successfully', { 
      ...context, 
      userId: user.id,
      categoryCount: categories.length 
    });

    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// POST - Create a new knowledge category (admin only)
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge category creation requested', context);
    
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

    // Create category with normalized ID
    const categoryId = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    const category = await prisma.knowledgeCategory.create({
      data: {
        id: categoryId,
        name: name.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    });

    logger.info('Knowledge category created successfully', { 
      ...context, 
      userId: user.id,
      categoryId: category.id,
      categoryName: category.name
    });

    return NextResponse.json({ 
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return ApiErrorHandler.handleError(
        new ValidationError('A category with this name already exists'),
        context
      );
    }
    return ApiErrorHandler.handleError(error, context);
  }
}
