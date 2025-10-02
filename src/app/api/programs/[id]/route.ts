import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/program-access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { id: programId } = await params;

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional for public viewing)
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError && !userError.message.includes('JWTExpired')) {
      console.error('Auth error:', userError);
    }

    // Fetch the specific program (only active programs for public viewing)
    const program = await prisma.trainingProgram.findUnique({
      where: {
        id: programId,
        isActive: true, // Only show active programs
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        lemonSqueezyId: true,
        lemonSqueezyVariantId: true,
        isActive: true,
        thumbnailUrl: true,
        aboutContent: true,
        createdAt: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check if user owns this program (if authenticated)
    let isOwned = false;
    let hasPurchased = false;
    let hasProAccess_check = false;
    
    if (user) {
      const userProgram = await prisma.userProgram.findFirst({
        where: {
          userId: user.id,
          trainingProgramId: program.id,
        },
      });
      isOwned = !!userProgram;

      // Check purchase status
      const userPurchase = await prisma.userPurchase.findUnique({
        where: {
          userId_trainingProgramId: {
            userId: user.id,
            trainingProgramId: program.id,
          },
        },
      });
      hasPurchased = !!userPurchase;

      // Check Pro subscription access
      hasProAccess_check = await hasProAccess(user.id);
    }

    const responseData = {
      ...program,
      isOwned,
      hasPurchased,
      hasProAccess: hasProAccess_check,
    };

    return NextResponse.json({
      success: true,
      program: responseData,
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}