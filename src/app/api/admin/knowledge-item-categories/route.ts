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

// POST - Assign knowledge item to categories
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge item category assignment requested', context);
    
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

    const { knowledgeItemId, categoryIds } = await request.json();

    if (process.env.NODE_ENV === 'development') { console.log('🔍 Raw request data:', { }
      knowledgeItemId,
      categoryIds,
      categoryIdsType: typeof categoryIds,
      categoryIdsIsArray: Array.isArray(categoryIds),
      categoryIdsLength: Array.isArray(categoryIds) ? categoryIds.length : 'Not an array',
      categoryIdsContent: Array.isArray(categoryIds) ? categoryIds.map(id => ({ id, type: typeof id, length: id?.length })) : 'Not an array'
    });

    if (process.env.NODE_ENV === 'development') { console.log('🔍 Knowledge item category assignment:', { }
      knowledgeItemId,
      categoryIds,
      categoryIdsType: typeof categoryIds,
      categoryIdsLength: Array.isArray(categoryIds) ? categoryIds.length : 'Not an array'
    });

    if (!knowledgeItemId || !Array.isArray(categoryIds)) {
      throw new ValidationError('Knowledge item ID and category IDs array are required');
    }

    // Deduplicate category IDs to avoid validation errors
    const uniqueCategoryIds = [...new Set(categoryIds.filter(id => id && typeof id === 'string' && id.trim() !== ''))];
    
    if (process.env.NODE_ENV === 'development') { console.log('🔧 Deduplication applied:', { }
      originalIds: categoryIds,
      originalCount: categoryIds.length,
      uniqueIds: uniqueCategoryIds,
      uniqueCount: uniqueCategoryIds.length,
      duplicatesRemoved: categoryIds.length - uniqueCategoryIds.length
    });

    // Verify knowledge item exists
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id: knowledgeItemId }
    });

    if (!knowledgeItem) {
      throw new NotFoundError('Knowledge item not found');
    }

    // Verify all categories exist
    const categories = await prisma.knowledgeCategory.findMany({
      where: { id: { in: uniqueCategoryIds } }
    });

    if (process.env.NODE_ENV === 'development') { console.log('📊 Category validation details:', { }
      requestedCount: uniqueCategoryIds.length,
      foundCount: categories.length,
      requestedIds: uniqueCategoryIds.map((id, index) => ({ index, id, type: typeof id, length: id?.length })),
      foundIds: categories.map(cat => ({ id: cat.id, name: cat.name })),
      missingIds: uniqueCategoryIds.filter(id => !categories.find(cat => cat.id === id))
    });

    if (categories.length !== uniqueCategoryIds.length) {
      console.error('❌ Category validation failed:', {
        missing: uniqueCategoryIds.filter(id => !categories.find(cat => cat.id === id))
      });
      throw new ValidationError('Some categories do not exist');
    }

    // Remove existing category assignments for this item
    await prisma.knowledgeItemCategory.deleteMany({
      where: { knowledgeItemId }
    });

    // Create new category assignments
    if (uniqueCategoryIds.length > 0) {
      const assignments = uniqueCategoryIds.map((categoryId: string) => ({
        id: `${knowledgeItemId}_${categoryId}`,
        knowledgeItemId,
        knowledgeCategoryId: categoryId,
      }));

      await prisma.knowledgeItemCategory.createMany({
        data: assignments,
      });
    }

    logger.info('Knowledge item categories updated successfully', { 
      ...context, 
      userId: user.id,
      knowledgeItemId,
      categoryCount: uniqueCategoryIds.length
    });

    return NextResponse.json({ 
      message: 'Categories updated successfully'
    });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// GET - Get knowledge items by category
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    logger.info('Knowledge items by category fetch requested', { ...context, categoryId });
    
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

    if (!categoryId) {
      throw new ValidationError('Category ID is required');
    }

    // Get knowledge items in this category
    const items = await prisma.knowledgeItem.findMany({
      where: {
        KnowledgeItemCategory: {
          some: {
            knowledgeCategoryId: categoryId
          }
        }
      },
      include: {
        KnowledgeItemCategory: {
          include: {
            KnowledgeCategory: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Knowledge items by category fetched successfully', { 
      ...context, 
      userId: user.id,
      categoryId,
      itemCount: items.length
    });

    return NextResponse.json({ items });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
