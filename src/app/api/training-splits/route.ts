import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/training-splits
 * Public API to fetch all active training splits
 */
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty');
    const focusArea = url.searchParams.get('focusArea');

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true
    };
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (focusArea) {
      where.focusAreas = {
        has: focusArea
      };
    }

    // Get active training splits with structure count
    const splits = await prisma.trainingSplit.findMany({
      where,
      orderBy: [
        { difficulty: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            trainingStructures: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      splits
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
