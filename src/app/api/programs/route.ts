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

    // If not authenticated, return browse-only view
    if (userError || !user) {
      const browsePrograms = allPrograms.map(program => ({
        ...program,
        isOwned: false
      }));

      return NextResponse.json({
        success: true,
        data: {
          ownedPrograms: [],
          browsePrograms,
          totalPrograms: allPrograms.length,
          ownedCount: 0,
          browseCount: browsePrograms.length,
          isAdmin: false
        }
      });
    }

    // Get user details including role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    const isAdmin = dbUser?.role === 'admin';

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

    // For admin users, all programs are "owned"
    if (isAdmin) {
      const ownedPrograms = allPrograms.map(program => {
        const purchase = userPurchases.find(p => p.trainingProgramId === program.id);
        return {
          ...program,
          purchaseDate: purchase?.purchaseDate,
          isOwned: true,
          isAdminAccess: !purchase // Flag to indicate admin access vs real purchase
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          ownedPrograms,
          browsePrograms: [], // Admin sees all as owned
          totalPrograms: allPrograms.length,
          ownedCount: ownedPrograms.length,
          browseCount: 0,
          isAdmin: true
        }
      });
    }

    // For regular users, separate owned and available programs
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
        browseCount: browsePrograms.length,
        isAdmin: false
      }
    });

  } catch (error) {
    console.error('Error fetching programs:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}