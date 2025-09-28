import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/server';

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
    if (user) {
      const userProgram = await prisma.userProgram.findFirst({
        where: {
          userId: user.id,
          trainingProgramId: program.id,
        },
      });
      isOwned = !!userProgram;
    }

    const responseData = {
      ...program,
      isOwned,
    };

    return NextResponse.json({
      success: true,
      program: responseData,
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}