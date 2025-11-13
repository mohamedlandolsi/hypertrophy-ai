import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { hasProAccess } from '@/lib/program-access';

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

    // Get user details including role and Pro status
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, plan: true }
    });

    const isAdmin = dbUser?.role === 'admin';
    
    // Check if user has Pro subscription (access to all programs)
    const isPro = await hasProAccess(user.id);

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

    // Get user's custom created programs
    const customPrograms = await prisma.customTrainingProgram.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['DRAFT', 'ACTIVE']
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        trainingSplit: {
          select: {
            name: true
          }
        },
        splitStructure: {
          select: {
            daysPerWeek: true,
            pattern: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For admin users, all programs are "owned"
    if (isAdmin) {
      const ownedPrograms = allPrograms.map(program => {
        const purchase = userPurchases.find(p => p.trainingProgramId === program.id);
        return {
          ...program,
          purchaseDate: purchase?.purchaseDate,
          isOwned: true,
          isAdminAccess: !purchase, // Flag to indicate admin access vs real purchase
          accessReason: 'admin' as const,
          isCustomProgram: false
        };
      });

      // Map custom programs to match the TrainingProgram structure
      const customProgramsFormatted = customPrograms.map(cp => ({
        id: cp.id,
        name: { en: cp.name },
        description: { en: cp.description || '' },
        price: 0,
        isActive: cp.status === 'ACTIVE',
        thumbnailUrl: null,
        aboutContent: null,
        createdAt: cp.createdAt,
        isOwned: true,
        isCustomProgram: true,
        customProgramData: {
          split: cp.trainingSplit?.name,
          daysPerWeek: cp.splitStructure?.daysPerWeek,
          pattern: cp.splitStructure?.pattern,
          status: cp.status
        }
      }));

      return NextResponse.json({
        success: true,
        data: {
          ownedPrograms: [...customProgramsFormatted, ...ownedPrograms],
          browsePrograms: [], // Admin sees all as owned
          totalPrograms: allPrograms.length,
          ownedCount: ownedPrograms.length + customPrograms.length,
          browseCount: 0,
          isAdmin: true,
          isPro: dbUser?.plan === 'PRO'
        }
      });
    }

    // For Pro users, all programs are accessible
    if (isPro) {
      const ownedPrograms = allPrograms.map(program => {
        const purchase = userPurchases.find(p => p.trainingProgramId === program.id);
        return {
          ...program,
          purchaseDate: purchase?.purchaseDate,
          isOwned: true,
          isProAccess: !purchase, // Flag to indicate Pro access vs actual purchase
          accessReason: purchase ? 'purchased' : 'pro_subscription' as const,
          isCustomProgram: false
        };
      });

      // Map custom programs to match the TrainingProgram structure
      const customProgramsFormatted = customPrograms.map(cp => ({
        id: cp.id,
        name: { en: cp.name },
        description: { en: cp.description || '' },
        price: 0,
        isActive: cp.status === 'ACTIVE',
        thumbnailUrl: null,
        aboutContent: null,
        createdAt: cp.createdAt,
        isOwned: true,
        isCustomProgram: true,
        customProgramData: {
          split: cp.trainingSplit?.name,
          daysPerWeek: cp.splitStructure?.daysPerWeek,
          pattern: cp.splitStructure?.pattern,
          status: cp.status
        }
      }));

      return NextResponse.json({
        success: true,
        data: {
          ownedPrograms: [...customProgramsFormatted, ...ownedPrograms],
          browsePrograms: [], // Pro users see all as owned
          totalPrograms: allPrograms.length,
          ownedCount: ownedPrograms.length + customPrograms.length,
          browseCount: 0,
          isAdmin: false,
          isPro: true
        }
      });
    }

    // For regular users, only show their custom programs (hide admin programs for now)
    // Map custom programs to match the TrainingProgram structure
    const customProgramsFormatted = customPrograms.map(cp => ({
      id: cp.id,
      name: { en: cp.name },
      description: { en: cp.description || '' },
      price: 0,
      isActive: cp.status === 'ACTIVE',
      thumbnailUrl: null,
      aboutContent: null,
      createdAt: cp.createdAt,
      isOwned: true,
      isCustomProgram: true,
      customProgramData: {
        split: cp.trainingSplit?.name,
        daysPerWeek: cp.splitStructure?.daysPerWeek,
        pattern: cp.splitStructure?.pattern,
        status: cp.status
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        ownedPrograms: customProgramsFormatted,
        browsePrograms: [], // Regular users only see their custom programs
        totalPrograms: customPrograms.length,
        ownedCount: customPrograms.length,
        browseCount: 0,
        isAdmin: false,
        isPro: false
      }
    });

  } catch (error) {
    console.error('Error fetching programs:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}
