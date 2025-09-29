import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

interface CustomizationRequest {
  trainingProgramId: string;
  customization: {
    structureId: string;
    categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
    workoutConfiguration: Record<string, string[]>;
  };
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to customize your program.'
      }, { status: 401 });
    }

    const body: CustomizationRequest = await request.json();
    const { trainingProgramId, customization } = body;

    if (!trainingProgramId || !customization) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'Training program ID and customization data are required.'
      }, { status: 400 });
    }

    // Verify user has purchased this program OR is an admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    const isAdmin = dbUser?.role === 'admin';
    
    if (!isAdmin) {
      const purchase = await prisma.userPurchase.findUnique({
        where: {
          userId_trainingProgramId: {
            userId: user.id,
            trainingProgramId
          }
        }
      });

      if (!purchase) {
        return NextResponse.json({
          error: 'Access denied',
          message: 'You must purchase this program to customize it.'
        }, { status: 403 });
      }
    }

    // Validate the program exists and structure exists
    const program = await prisma.trainingProgram.findUnique({
      where: { id: trainingProgramId },
      include: {
        programStructures: true,
        workoutTemplates: true
      }
    });

    if (!program) {
      return NextResponse.json({
        error: 'Program not found',
        message: 'The specified training program does not exist.'
      }, { status: 404 });
    }

    // Validate structure ID
    const validStructure = program.programStructures.find(s => s.id === customization.structureId);
    if (!validStructure) {
      return NextResponse.json({
        error: 'Invalid structure',
        message: 'The specified program structure does not exist.'
      }, { status: 400 });
    }

    // Validate workout configuration
    const validWorkoutIds = program.workoutTemplates.map(w => w.id);
    const configuredWorkoutIds = Object.keys(customization.workoutConfiguration);
    const invalidWorkoutIds = configuredWorkoutIds.filter(id => !validWorkoutIds.includes(id));
    
    if (invalidWorkoutIds.length > 0) {
      return NextResponse.json({
        error: 'Invalid workout configuration',
        message: `Invalid workout template IDs: ${invalidWorkoutIds.join(', ')}`
      }, { status: 400 });
    }

    // Check if user already has customization for this program
    const existingCustomization = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId
      }
    });

    let userProgram;
    
    if (existingCustomization) {
      // Update existing customization
      userProgram = await prisma.userProgram.update({
        where: { id: existingCustomization.id },
        data: {
          categoryType: customization.categoryType,
          configuration: {
            structureId: customization.structureId,
            workoutConfiguration: customization.workoutConfiguration,
            customizedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Create new customization
      userProgram = await prisma.userProgram.create({
        data: {
          userId: user.id,
          trainingProgramId,
          categoryType: customization.categoryType,
          configuration: {
            structureId: customization.structureId,
            workoutConfiguration: customization.workoutConfiguration,
            customizedAt: new Date().toISOString()
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      userProgram,
      message: 'Program customization saved successfully.'
    });

  } catch (error) {
    console.error('[PROGRAM_CUSTOMIZE] Error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingProgramId = searchParams.get('programId');

    if (!trainingProgramId) {
      return NextResponse.json({
        error: 'Program ID required'
      }, { status: 400 });
    }

    // Get user's customization for this program
    const userProgram = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId
      }
    });

    return NextResponse.json({
      userProgram: userProgram || null
    });

  } catch (error) {
    console.error('[PROGRAM_CUSTOMIZE] GET Error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}