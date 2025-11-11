'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Simple audit trail function
async function createAuditTrail(eventType: string, userId: string, data: Record<string, unknown>): Promise<void> {
  try {
    // You can store audit data in a dedicated table or just log it
    if (process.env.NODE_ENV === 'development') { console.log('Audit Trail:', { eventType, userId, data, timestamp: new Date().toISOString() }); }
    // TODO: Implement proper audit trail storage if needed
  } catch (error) {
    console.error('Failed to create audit trail:', error);
  }
}

// Validation schemas
const SaveUserProgramSchema = z.object({
  trainingProgramId: z.string().cuid(),
  categoryType: z.enum(['MINIMALIST', 'ESSENTIALIST', 'MAXIMALIST']),
  configuration: z.record(z.string(), z.array(z.string())), // workoutTemplateId -> exerciseIds[]
});

// Get program details with workout templates for the builder
export async function getProgramBuilderData(programId: string) {
  try {
    // First, get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user has purchased this program
    const userPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: programId,
      },
    });

    if (!userPurchase) {
      throw new Error('Program not purchased');
    }

    // Get program with workout templates
    const program = await prisma.trainingProgram.findUnique({
      where: { 
        id: programId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        workoutTemplates: {
          select: {
            id: true,
            name: true,
            order: true,
            requiredMuscleGroups: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!program) {
      throw new Error('Program not found');
    }

    // Get all available exercises
    const exercises = await prisma.trainingExercise.findMany({
      select: {
        id: true,
        name: true,
        primaryMuscleGroup: true,
        secondaryMuscleGroups: true,
        type: true,
      },
      orderBy: [
        { primaryMuscleGroup: 'asc' },
        { name: 'asc' },
      ],
    });

    // Check if user has an existing configuration
    const existingUserProgram = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: programId,
      },
      select: {
        id: true,
        categoryType: true,
        configuration: true,
      },
    });

    return {
      success: true,
      data: {
        program,
        exercises,
        existingConfiguration: existingUserProgram,
      },
    };
  } catch (error) {
    console.error('Error fetching program builder data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch program data',
    };
  }
}

// Save user's program configuration
export async function saveUserProgram(data: z.infer<typeof SaveUserProgramSchema>) {
  try {
    // Validate input
    const validatedData = SaveUserProgramSchema.parse(data);
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Verify user has purchased this program
    const userPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: validatedData.trainingProgramId,
      },
    });

    if (!userPurchase) {
      throw new Error('Program not purchased');
    }

    // Verify the program exists and is active
    const program = await prisma.trainingProgram.findUnique({
      where: { 
        id: validatedData.trainingProgramId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        workoutTemplates: {
          select: {
            id: true,
            requiredMuscleGroups: true,
          },
        },
      },
    });

    if (!program) {
      throw new Error('Program not found or inactive');
    }

    // Validate configuration against workout templates
    const workoutTemplateIds = program.workoutTemplates.map(wt => wt.id);
    const configWorkoutIds = Object.keys(validatedData.configuration);
    
    // Check that all configured workouts exist in the program
    for (const workoutId of configWorkoutIds) {
      if (!workoutTemplateIds.includes(workoutId)) {
        throw new Error(`Invalid workout template ID: ${workoutId}`);
      }
    }

    // Validate that all selected exercises exist
    const allExerciseIds = Object.values(validatedData.configuration).flat();
    if (allExerciseIds.length > 0) {
      const existingExercises = await prisma.trainingExercise.findMany({
        where: { 
          id: { in: allExerciseIds },
        },
        select: { id: true },
      });
      
      const existingExerciseIds = existingExercises.map(ex => ex.id);
      for (const exerciseId of allExerciseIds) {
        if (!existingExerciseIds.includes(exerciseId)) {
          throw new Error(`Invalid exercise ID: ${exerciseId}`);
        }
      }
    }

    // Check if user already has a configuration for this program
    const existingUserProgram = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: validatedData.trainingProgramId,
      },
    });

    let userProgram;
    
    if (existingUserProgram) {
      // Update existing configuration
      userProgram = await prisma.userProgram.update({
        where: { id: existingUserProgram.id },
        data: {
          categoryType: validatedData.categoryType,
          configuration: validatedData.configuration,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new configuration
      userProgram = await prisma.userProgram.create({
        data: {
          userId: user.id,
          trainingProgramId: validatedData.trainingProgramId,
          categoryType: validatedData.categoryType,
          configuration: validatedData.configuration,
        },
      });
    }

    // Create audit trail
    await createAuditTrail('user_program_saved', user.id, {
      userProgramId: userProgram.id,
      trainingProgramId: validatedData.trainingProgramId,
      categoryType: validatedData.categoryType,
      exerciseCount: allExerciseIds.length,
      workoutCount: configWorkoutIds.length,
    });

    return {
      success: true,
      data: {
        userProgramId: userProgram.id,
        message: existingUserProgram ? 'Program configuration updated successfully' : 'Program configuration saved successfully',
      },
    };
  } catch (error) {
    console.error('Error saving user program:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid data provided',
        details: error.errors,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save program configuration',
    };
  }
}

// Get user's saved program configuration
export async function getUserProgramConfiguration(programId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const userProgram = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: programId,
      },
      select: {
        id: true,
        categoryType: true,
        configuration: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: userProgram,
    };
  } catch (error) {
    console.error('Error fetching user program configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch program configuration',
    };
  }
}

// Delete user's program configuration
export async function deleteUserProgramConfiguration(programId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const userProgram = await prisma.userProgram.findFirst({
      where: {
        userId: user.id,
        trainingProgramId: programId,
      },
    });

    if (!userProgram) {
      throw new Error('Program configuration not found');
    }

    await prisma.userProgram.delete({
      where: { id: userProgram.id },
    });

    // Create audit trail
    await createAuditTrail('user_program_deleted', user.id, {
      userProgramId: userProgram.id,
      trainingProgramId: programId,
    });

    revalidatePath(`/programs/${programId}/build`);

    return {
      success: true,
      data: { message: 'Program configuration deleted successfully' },
    };
  } catch (error) {
    console.error('Error deleting user program configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete program configuration',
    };
  }
}