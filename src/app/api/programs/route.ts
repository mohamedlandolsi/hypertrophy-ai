import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all active training programs
    const allPrograms = await prisma.trainingProgram.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isActive: true,
        thumbnailUrl: true,
        aboutContent: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user's purchased programs
    const userPurchases = await prisma.userPurchase.findMany({
      where: {
        userId: user.id
      },
      select: {
        trainingProgramId: true,
        purchaseDate: true
      }
    });

    const purchasedProgramIds = new Set(userPurchases.map(p => p.trainingProgramId));

    // Separate owned and available programs
    const ownedPrograms = allPrograms.filter(program => 
      purchasedProgramIds.has(program.id)
    ).map(program => {
      const purchase = userPurchases.find(p => p.trainingProgramId === program.id);
      return {
        ...program,
        purchaseDate: purchase?.purchaseDate,
        isOwned: true
      };
    });

    const browsePrograms = allPrograms.filter(program => 
      !purchasedProgramIds.has(program.id)
    ).map(program => ({
      ...program,
      isOwned: false
    }));

    return NextResponse.json({
      success: true,
      data: {
        ownedPrograms,
        browsePrograms,
        totalPrograms: allPrograms.length,
        ownedCount: ownedPrograms.length,
        browseCount: browsePrograms.length
      }
    });

  } catch (error) {
    console.error('Error fetching programs:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}