'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating/updating program templates
const ProgramTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  difficultyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
    required_error: 'Difficulty level is required',
  }),
  splitId: z.string().cuid('Invalid split ID'),
  structureId: z.string().cuid('Invalid structure ID'),
  workoutStructureType: z.enum(['REPEATING', 'AB', 'ABC'], {
    required_error: 'Workout structure type is required',
  }),
  estimatedDurationWeeks: z.number().int().min(1).max(52),
  targetAudience: z.string().min(1, 'Target audience is required'),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

const UpdateProgramTemplateSchema = ProgramTemplateSchema.partial().extend({
  id: z.string().cuid('Invalid template ID'),
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
  revalidatePath('/admin/templates');
  revalidatePath('/programs');
}

/**
 * Create a new program template with associated workouts
 */
export async function createProgramTemplate(formData: z.infer<typeof ProgramTemplateSchema>) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate input data
    const validatedData = ProgramTemplateSchema.parse(formData);

    // Check if split exists
    const split = await prisma.trainingSplit.findUnique({
      where: { id: validatedData.splitId },
    });

    if (!split) {
      throw new Error('Training split not found');
    }

    // Check if structure exists
    const structure = await prisma.trainingSplitStructure.findUnique({
      where: { id: validatedData.structureId },
    });

    if (!structure) {
      throw new Error('Training split structure not found');
    }

    // Create program template
    const template = await prisma.programTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        difficultyLevel: validatedData.difficultyLevel,
        splitId: validatedData.splitId,
        structureId: validatedData.structureId,
        workoutStructureType: validatedData.workoutStructureType,
        estimatedDurationWeeks: validatedData.estimatedDurationWeeks,
        targetAudience: validatedData.targetAudience,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        isActive: validatedData.isActive ?? true,
        popularity: 0, // Start with 0 popularity
      },
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: template,
      message: 'Program template created successfully',
    };
  } catch (error) {
    console.error('Error creating program template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update an existing program template
 */
export async function updateProgramTemplate(formData: z.infer<typeof UpdateProgramTemplateSchema>) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate input data
    const validatedData = UpdateProgramTemplateSchema.parse(formData);

    // Check if template exists
    const existingTemplate = await prisma.programTemplate.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingTemplate) {
      throw new Error('Program template not found');
    }

    // If split or structure is being updated, verify they exist
    if (validatedData.splitId) {
      const split = await prisma.trainingSplit.findUnique({
        where: { id: validatedData.splitId },
      });

      if (!split) {
        throw new Error('Training split not found');
      }
    }

    if (validatedData.structureId) {
      const structure = await prisma.trainingSplitStructure.findUnique({
        where: { id: validatedData.structureId },
      });

      if (!structure) {
        throw new Error('Training split structure not found');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.difficultyLevel !== undefined) updateData.difficultyLevel = validatedData.difficultyLevel;
    if (validatedData.splitId !== undefined) updateData.splitId = validatedData.splitId;
    if (validatedData.structureId !== undefined) updateData.structureId = validatedData.structureId;
    if (validatedData.workoutStructureType !== undefined) updateData.workoutStructureType = validatedData.workoutStructureType;
    if (validatedData.estimatedDurationWeeks !== undefined) updateData.estimatedDurationWeeks = validatedData.estimatedDurationWeeks;
    if (validatedData.targetAudience !== undefined) updateData.targetAudience = validatedData.targetAudience;
    if (validatedData.thumbnailUrl !== undefined) updateData.thumbnailUrl = validatedData.thumbnailUrl || null;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    // Update the template
    const template = await prisma.programTemplate.update({
      where: { id: validatedData.id },
      data: updateData,
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: template,
      message: 'Program template updated successfully',
    };
  } catch (error) {
    console.error('Error updating program template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a program template
 */
export async function deleteProgramTemplate(templateId: string) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate template ID
    if (!templateId || typeof templateId !== 'string') {
      throw new Error('Invalid template ID');
    }

    // Check if template exists
    const existingTemplate = await prisma.programTemplate.findUnique({
      where: { id: templateId },
      include: {
        trainingPrograms: true, // Check if any user programs reference this template
      },
    });

    if (!existingTemplate) {
      throw new Error('Program template not found');
    }

    // Check if there are user programs using this template
    if (existingTemplate.trainingPrograms.length > 0) {
      throw new Error(
        `Cannot delete template with ${existingTemplate.trainingPrograms.length} active user program(s). Consider deactivating instead.`
      );
    }

    // Delete the template (cascade will handle related workouts)
    await prisma.programTemplate.delete({
      where: { id: templateId },
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      message: 'Program template deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting program template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Toggle the active status of a program template
 */
export async function toggleTemplateStatus(templateId: string, currentStatus: boolean) {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Validate inputs
    if (!templateId || typeof templateId !== 'string') {
      throw new Error('Invalid template ID');
    }

    if (typeof currentStatus !== 'boolean') {
      throw new Error('Invalid current status');
    }

    // Check if template exists
    const existingTemplate = await prisma.programTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      throw new Error('Program template not found');
    }

    // Toggle the status
    const updatedTemplate = await prisma.programTemplate.update({
      where: { id: templateId },
      data: { isActive: !currentStatus },
    });

    // Revalidate caches
    revalidateCaches();

    return {
      success: true,
      data: updatedTemplate,
      message: `Program template ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error('Error toggling template status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get all program templates (for admin management)
 */
export async function getProgramTemplates(includeInactive = false) {
  try {
    // Validate admin access
    await checkAdminAccess();

    const templates = await prisma.programTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        trainingSplit: {
          select: {
            id: true,
            name: true,
          },
        },
        splitStructure: {
          select: {
            id: true,
            pattern: true,
            daysPerWeek: true,
          },
        },
        templateWorkouts: {
          orderBy: { order: 'asc' },
          include: {
            templateExercises: {
              orderBy: { order: 'asc' },
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            trainingPrograms: true, // Number of times this template has been used
            templateWorkouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: templates,
    };
  } catch (error) {
    console.error('Error fetching program templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a single program template by ID (for editing/viewing)
 */
export async function getProgramTemplate(templateId: string) {
  try {
    // Validate admin access
    await checkAdminAccess();

    if (!templateId || typeof templateId !== 'string') {
      throw new Error('Invalid template ID');
    }

    const template = await prisma.programTemplate.findUnique({
      where: { id: templateId },
      include: {
        trainingSplit: true,
        splitStructure: true,
        templateWorkouts: {
          orderBy: { order: 'asc' },
          include: {
            templateExercises: {
              orderBy: { order: 'asc' },
              include: {
                exercise: true,
              },
            },
          },
        },
        trainingPrograms: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Get recent 10 programs created from this template
        },
        _count: {
          select: {
            trainingPrograms: true,
            templateWorkouts: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Program template not found');
    }

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    console.error('Error fetching program template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get template usage statistics
 */
export async function getTemplateStats() {
  try {
    // Validate admin access
    await checkAdminAccess();

    // Get total templates
    const totalTemplates = await prisma.programTemplate.count();

    // Get active templates
    const activeTemplates = await prisma.programTemplate.count({
      where: { isActive: true },
    });

    // Get total times templates have been used (sum of all trainingPrograms)
    const usageStats = await prisma.programTemplate.findMany({
      select: {
        _count: {
          select: {
            trainingPrograms: true,
          },
        },
      },
    });

    const totalTimesUsed = usageStats.reduce((sum, template) => sum + template._count.trainingPrograms, 0);

    // Get most popular templates (top 5)
    const popularTemplates = await prisma.programTemplate.findMany({
      orderBy: {
        popularity: 'desc',
      },
      take: 5,
      include: {
        trainingSplit: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            trainingPrograms: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        totalTemplates,
        activeTemplates,
        totalTimesUsed,
        popularTemplates: popularTemplates.map(t => ({
          ...t,
          split: t.trainingSplit,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching template stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
