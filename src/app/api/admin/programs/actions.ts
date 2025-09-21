'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { programCreationSchema } from '@/lib/validations/program-creation';

// Update schema for partial updates
const UpdateTrainingProgramSchema = z.object({
  id: z.string().cuid('Invalid program ID'),
  name: z.object({
    en: z.string().min(1, 'English text is required'),
    ar: z.string().min(1, 'Arabic text is required'),
    fr: z.string().min(1, 'French text is required'),
  }).optional(),
  description: z.object({
    en: z.string().min(1, 'English text is required'),
    ar: z.string().min(1, 'Arabic text is required'),
    fr: z.string().min(1, 'French text is required'),
  }).optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  lemonSqueezyId: z.string().min(1, 'LemonSqueezy ID is required').optional(),
  programType: z.enum([
    'Upper/Lower',
    'FB EOD',
    'Anterior/Posterior',
    'PPL x UL',
    'Upper/Lower x5'
  ]).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  estimatedDuration: z.number().min(1).max(52).optional(),
  sessionCount: z.number().min(1).max(7).optional(),
  hasInteractiveBuilder: z.boolean().optional(),
  allowsCustomization: z.boolean().optional(),
  isActive: z.boolean().optional(),
  programGuide: z.object({
    introduction: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    structure: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    exerciseSelection: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    volumeAdjustment: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    beginnerGuidelines: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    progressionPlan: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    faq: z.array(z.object({
      question: z.object({
        en: z.string().min(1, 'English text is required'),
        ar: z.string().min(1, 'Arabic text is required'),
        fr: z.string().min(1, 'French text is required'),
      }),
      answer: z.object({
        en: z.string().min(1, 'English text is required'),
        ar: z.string().min(1, 'Arabic text is required'),
        fr: z.string().min(1, 'French text is required'),
      }),
    })).default([]),
  }).optional(),
  workoutTemplates: z.array(z.object({
    name: z.object({
      en: z.string().min(1, 'English text is required'),
      ar: z.string().min(1, 'Arabic text is required'),
      fr: z.string().min(1, 'French text is required'),
    }),
    order: z.number().min(1),
    requiredMuscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
  })).optional(),
});

// Helper function to check admin access
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

// Helper function to revalidate caches
function revalidateCaches() {
  revalidatePath('/admin/programs');
  revalidatePath('/programs');
}

/**
 * Create a new training program with associated guide and workout templates
 */
export async function createTrainingProgram(formData: z.infer<typeof programCreationSchema>) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate input data
    const validatedData = programCreationSchema.parse(formData);

    // Check if lemonSqueezyId is unique
    const existingProgram = await prisma.trainingProgram.findUnique({
      where: { lemonSqueezyId: validatedData.lemonSqueezyId }
    });

    if (existingProgram) {
      throw new Error('A program with this LemonSqueezy ID already exists');
    }

    // Create program with associated data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the training program
      const trainingProgram = await tx.trainingProgram.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          lemonSqueezyId: validatedData.lemonSqueezyId,
          programType: validatedData.programType,
          estimatedDuration: validatedData.estimatedDuration,
          sessionCount: validatedData.sessionCount,
          difficulty: validatedData.difficulty || 'INTERMEDIATE',
          hasInteractiveBuilder: validatedData.hasInteractiveBuilder ?? true,
          allowsCustomization: validatedData.allowsCustomization ?? true,
        },
      });

      // Create the program guide
      await tx.programGuide.create({
        data: {
          trainingProgramId: trainingProgram.id,
          content: validatedData.programGuide,
        },
      });

      // Create workout templates
      await tx.workoutTemplate.createMany({
        data: validatedData.workoutTemplates.map((template) => ({
          trainingProgramId: trainingProgram.id,
          name: template.name,
          order: template.order,
          requiredMuscleGroups: template.requiredMuscleGroups,
        })),
      });

      return trainingProgram;
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: result,
      message: 'Training program created successfully',
    };
  } catch (error) {
    console.error('Error creating training program:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update an existing training program and its related data
 */
export async function updateTrainingProgram(formData: z.infer<typeof UpdateTrainingProgramSchema>) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate input data
    const validatedData = UpdateTrainingProgramSchema.parse(formData);

    // Check if program exists
    const existingProgram = await prisma.trainingProgram.findUnique({
      where: { id: validatedData.id },
      include: {
        programGuide: true,
        workoutTemplates: true,
      },
    });

    if (!existingProgram) {
      throw new Error('Training program not found');
    }

    // Check if lemonSqueezyId is unique (if being updated)
    if (validatedData.lemonSqueezyId && validatedData.lemonSqueezyId !== existingProgram.lemonSqueezyId) {
      const duplicateProgram = await prisma.trainingProgram.findUnique({
        where: { lemonSqueezyId: validatedData.lemonSqueezyId }
      });

      if (duplicateProgram) {
        throw new Error('A program with this LemonSqueezy ID already exists');
      }
    }

    // Update program with associated data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the training program
      const updateData: Record<string, unknown> = {};
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.description) updateData.description = validatedData.description;
      if (validatedData.price !== undefined) updateData.price = validatedData.price;
      if (validatedData.lemonSqueezyId) updateData.lemonSqueezyId = validatedData.lemonSqueezyId;

      const trainingProgram = await tx.trainingProgram.update({
        where: { id: validatedData.id },
        data: updateData,
      });

      // Update program guide if provided
      if (validatedData.programGuide) {
        await tx.programGuide.upsert({
          where: { trainingProgramId: validatedData.id },
          update: { content: validatedData.programGuide },
          create: {
            trainingProgramId: validatedData.id,
            content: validatedData.programGuide,
          },
        });
      }

      // Update workout templates if provided
      if (validatedData.workoutTemplates) {
        // Delete existing templates
        await tx.workoutTemplate.deleteMany({
          where: { trainingProgramId: validatedData.id },
        });

        // Create new templates
        await tx.workoutTemplate.createMany({
          data: validatedData.workoutTemplates.map((template) => ({
            trainingProgramId: validatedData.id,
            name: template.name,
            order: template.order,
            requiredMuscleGroups: template.requiredMuscleGroups,
          })),
        });
      }

      return trainingProgram;
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: result,
      message: 'Training program updated successfully',
    };
  } catch (error) {
    console.error('Error updating training program:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a training program and all associated data
 */
export async function deleteTrainingProgram(programId: string) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate program ID
    if (!programId || typeof programId !== 'string') {
      throw new Error('Invalid program ID');
    }

    // Check if program exists
    const existingProgram = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        userPurchases: true,
        userPrograms: true,
      },
    });

    if (!existingProgram) {
      throw new Error('Training program not found');
    }

    // Check if there are active purchases (optional: you might want to prevent deletion)
    if (existingProgram.userPurchases.length > 0) {
      throw new Error('Cannot delete program with existing purchases. Consider deactivating instead.');
    }

    // Delete the program (cascade will handle related data)
    await prisma.trainingProgram.delete({
      where: { id: programId },
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      message: 'Training program deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting training program:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Toggle the active status of a training program
 */
export async function toggleProgramStatus(programId: string, currentStatus: boolean) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate inputs
    if (!programId || typeof programId !== 'string') {
      throw new Error('Invalid program ID');
    }

    if (typeof currentStatus !== 'boolean') {
      throw new Error('Invalid current status');
    }

    // Check if program exists
    const existingProgram = await prisma.trainingProgram.findUnique({
      where: { id: programId },
    });

    if (!existingProgram) {
      throw new Error('Training program not found');
    }

    // Toggle the status
    const updatedProgram = await prisma.trainingProgram.update({
      where: { id: programId },
      data: { isActive: !currentStatus },
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: updatedProgram,
      message: `Training program ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error('Error toggling program status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get all training programs (for admin management)
 */
export async function getTrainingPrograms(includeInactive = false) {
  try {
    // Validate admin access
    await checkAdminAccess();

    const programs = await prisma.trainingProgram.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        programGuide: true,
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            userPurchases: true,
            userPrograms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: programs,
    };
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a single training program by ID (for editing)
 */
export async function getTrainingProgram(programId: string) {
  try {
    // Validate admin access
    await checkAdminAccess();

    if (!programId || typeof programId !== 'string') {
      throw new Error('Invalid program ID');
    }

    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        programGuide: true,
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!program) {
      throw new Error('Training program not found');
    }

    return {
      success: true,
      data: program,
    };
  } catch (error) {
    console.error('Error fetching training program:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}