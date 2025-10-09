'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { programCreationSchema, guideSectionSchema, GuideSection } from '@/lib/validations/program-creation';
import { sanitizeGuideSectionsForSubmit } from '@/lib/program-guide';

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
  lemonSqueezyId: z.string().optional(),
  lemonSqueezyVariantId: z.string().optional(),
  programStructures: z.array(z.object({
    id: z.string().optional(),
    name: z.object({
      en: z.string().min(1, 'English name is required'),
      ar: z.string().optional().default(''),
      fr: z.string().optional().default(''),
    }),
    structureType: z.enum(['weekly', 'cyclic']),
    sessionCount: z.number().min(1).max(7).optional(),
    trainingDays: z.number().min(1).max(7).optional(),
    restDays: z.number().min(1).max(7).optional(),
    weeklySchedule: z.object({
      day1: z.string().optional(),
      day2: z.string().optional(),
      day3: z.string().optional(),
      day4: z.string().optional(),
      day5: z.string().optional(),
      day6: z.string().optional(),
      day7: z.string().optional(),
    }).optional(),
    order: z.number().default(0),
    isDefault: z.boolean().default(false),
  })).optional(),
  hasInteractiveBuilder: z.boolean().optional(),
  allowsCustomization: z.boolean().optional(),
  isActive: z.boolean().optional(),
  workoutNames: z.array(z.string()).optional(),
  workoutTemplates: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Workout name is required'),
    muscleGroups: z.array(z.string()).default([]),
    exercisesPerMuscle: z.record(z.string(), z.number()).optional(),
    volumeRange: z.record(z.string(), z.object({
      min: z.number().min(0).max(20),
      max: z.number().min(0).max(20)
    })).optional(),
    exercises: z.array(z.object({
      id: z.string(),
      targetedMuscle: z.enum(['CHEST', 'BACK', 'SIDE_DELTS', 'FRONT_DELTS', 'REAR_DELTS', 'ELBOW_FLEXORS', 'TRICEPS', 'FOREARMS', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'ADDUCTORS', 'CALVES', 'ERECTORS', 'ABS', 'OBLIQUES', 'HIP_FLEXORS']).optional(),
      selectedExercise: z.string().optional(),
    })).default([]),
  })).optional(),
  
  // Guide sections
  guideSections: z.array(guideSectionSchema).optional(),
  
  // About program content
  aboutContent: z.string().optional(),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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

    // Check if lemonSqueezyId is unique (only if provided)
    if (validatedData.lemonSqueezyId) {
      const existingProgram = await prisma.trainingProgram.findUnique({
        where: { lemonSqueezyId: validatedData.lemonSqueezyId }
      });

      if (existingProgram) {
        throw new Error('A program with this LemonSqueezy ID already exists');
      }
    }

    // Create program with associated data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the training program
      const trainingProgram = await tx.trainingProgram.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          ...(validatedData.lemonSqueezyId && { lemonSqueezyId: validatedData.lemonSqueezyId }),
          ...(validatedData.lemonSqueezyVariantId && { lemonSqueezyVariantId: validatedData.lemonSqueezyVariantId }),
          hasInteractiveBuilder: validatedData.hasInteractiveBuilder ?? true,
          allowsCustomization: validatedData.allowsCustomization ?? true,
          isActive: validatedData.isActive ?? true,
          workoutNames: validatedData.workoutNames || [],
          ...(validatedData.aboutContent && { aboutContent: validatedData.aboutContent }),
          ...(validatedData.thumbnailUrl && { thumbnailUrl: validatedData.thumbnailUrl }),
        },
      });

      // Create program structures
      if (validatedData.programStructures && validatedData.programStructures.length > 0) {
        await tx.programStructure.createMany({
          data: validatedData.programStructures.map((structure, index) => ({
            trainingProgramId: trainingProgram.id,
            name: structure.name,
            structureType: structure.structureType,
            sessionCount: structure.sessionCount || 4,
            trainingDays: structure.trainingDays || 3,
            restDays: structure.restDays || 1,
            weeklySchedule: structure.weeklySchedule || {},
            order: structure.order || index,
            isDefault: structure.isDefault || index === 0, // First structure is default if none specified
          })),
        });
      }

      // Create workout templates
      if (validatedData.workoutTemplates && validatedData.workoutTemplates.length > 0) {
        await tx.workoutTemplate.createMany({
          data: validatedData.workoutTemplates.map((template, index) => ({
            trainingProgramId: trainingProgram.id,
            name: {
              en: template.name,
              ar: template.name, // For now, use the same name for all languages
              fr: template.name,
            },
            order: index + 1,
            requiredMuscleGroups: template.muscleGroups,
            exercisesPerMuscle: template.exercisesPerMuscle || undefined,
            volumeRange: template.volumeRange || undefined,
          })),
        });
      }

      // Create program guide if provided
      if (validatedData.guideSections && validatedData.guideSections.length > 0) {
        const sanitizedGuideSections = sanitizeGuideSectionsForSubmit(validatedData.guideSections)
          .map((section, index) => ({
            id: section.id,
            title: section.title,
            content: section.content,
            order: section.order ?? index + 1,
          })) as GuideSection[];

        if (sanitizedGuideSections.length > 0) {
          await tx.programGuide.create({
            data: {
              trainingProgramId: trainingProgram.id,
              content: sanitizedGuideSections,
            },
          });
        }
      }

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
      if (validatedData.lemonSqueezyVariantId) updateData.lemonSqueezyVariantId = validatedData.lemonSqueezyVariantId;
      if (validatedData.hasInteractiveBuilder !== undefined) updateData.hasInteractiveBuilder = validatedData.hasInteractiveBuilder;
      if (validatedData.allowsCustomization !== undefined) updateData.allowsCustomization = validatedData.allowsCustomization;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
      if (validatedData.workoutNames !== undefined) updateData.workoutNames = validatedData.workoutNames;
      if (validatedData.aboutContent !== undefined) updateData.aboutContent = validatedData.aboutContent;
      if (validatedData.thumbnailUrl !== undefined) updateData.thumbnailUrl = validatedData.thumbnailUrl;

      const trainingProgram = await tx.trainingProgram.update({
        where: { id: validatedData.id },
        data: updateData,
      });

      // Update program structures if provided
      if (validatedData.programStructures) {
        // Delete existing structures
        await tx.programStructure.deleteMany({
          where: { trainingProgramId: validatedData.id },
        });

        // Create new structures
        if (validatedData.programStructures.length > 0) {
          await tx.programStructure.createMany({
            data: validatedData.programStructures.map((structure, index) => ({
              trainingProgramId: validatedData.id,
              name: structure.name,
              structureType: structure.structureType,
              sessionCount: structure.sessionCount || 4,
              trainingDays: structure.trainingDays || 3,
              restDays: structure.restDays || 1,
              weeklySchedule: structure.weeklySchedule || {},
              order: structure.order || index,
              isDefault: structure.isDefault || index === 0,
            })),
          });
        }
      }

      // Update workout templates if provided
      if (validatedData.workoutTemplates) {
        // Delete existing templates
        await tx.workoutTemplate.deleteMany({
          where: { trainingProgramId: validatedData.id },
        });

        // Create new templates with exercise data
        if (validatedData.workoutTemplates.length > 0) {
          // Create workout templates one by one to handle exercise data properly
          for (let i = 0; i < validatedData.workoutTemplates.length; i++) {
            const template = validatedData.workoutTemplates[i];
            await tx.workoutTemplate.create({
              data: {
                id: template.id.startsWith('new-') ? undefined : template.id, // Let DB generate new ID for new templates
                trainingProgramId: validatedData.id,
                name: {
                  en: template.name,
                  ar: template.name, // TODO: Handle multilingual names properly
                  fr: template.name,
                  // Temporarily store exercise data in the name JSON field
                  // This is a workaround until we add an exercises field to the schema
                  _exerciseData: template.exercises || [],
                },
                order: i + 1,
                requiredMuscleGroups: template.muscleGroups,
                exercisesPerMuscle: template.exercisesPerMuscle || undefined,
                volumeRange: template.volumeRange || undefined,
              },
            });
          }
        }
      }

      // Update program guide if provided
      if (validatedData.guideSections !== undefined) {
        const sanitizedGuideSections = sanitizeGuideSectionsForSubmit(validatedData.guideSections)
          .map((section, index) => ({
            id: section.id,
            title: section.title,
            content: section.content,
            order: section.order ?? index + 1,
          })) as GuideSection[];

        if (sanitizedGuideSections.length > 0) {
          await tx.programGuide.upsert({
            where: { trainingProgramId: validatedData.id },
            update: { content: sanitizedGuideSections },
            create: {
              trainingProgramId: validatedData.id,
              content: sanitizedGuideSections,
            },
          });
        } else {
          await tx.programGuide.deleteMany({
            where: { trainingProgramId: validatedData.id },
          });
        }
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