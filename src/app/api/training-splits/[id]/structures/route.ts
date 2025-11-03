import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

/**
 * GET /api/training-splits/[id]/structures
 * Public API to fetch all structures for a specific split
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id } = await params;
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify split exists and is active
    const split = await prisma.trainingSplit.findUnique({
      where: { 
        id,
        isActive: true
      }
    });

    if (!split) {
      return NextResponse.json(
        { error: 'Training split not found or inactive' },
        { status: 404 }
      );
    }

    // Get all structures for this split with day assignments
    const structures = await prisma.trainingSplitStructure.findMany({
      where: { splitId: id },
      include: {
        trainingDayAssignments: {
          orderBy: { dayNumber: 'asc' }
        },
        _count: {
          select: {
            customTrainingPrograms: true
          }
        }
      },
      orderBy: [
        { daysPerWeek: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      split,
      structures
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
