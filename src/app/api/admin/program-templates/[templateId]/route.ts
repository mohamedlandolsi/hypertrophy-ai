import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for updating template basic info
const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficultyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  targetAudience: z.string().min(1).optional(),
  estimatedDurationWeeks: z.number().int().min(1).max(52).optional(),
  splitId: z.string().cuid().optional(),
  structureId: z.string().cuid().optional(),
  workoutStructureType: z.enum(['REPEATING', 'AB', 'ABC']).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// Helper to check admin access
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null; // No error
}

/**
 * GET /api/admin/program-templates/[templateId]
 * Get full template details with workouts and exercises
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const templateId = params.templateId;

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
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    primaryMuscle: true,
                    secondaryMuscles: true,
                    exerciseType: true,
                    volumeContributions: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            trainingPrograms: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/program-templates/[templateId]
 * Update template basic info
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const templateId = params.templateId;
    const body = await request.json();

    // Validate input
    const validatedData = UpdateTemplateSchema.parse(body);

    // Check if template exists
    const existingTemplate = await prisma.programTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate foreign keys if provided
    if (validatedData.splitId) {
      const split = await prisma.trainingSplit.findUnique({
        where: { id: validatedData.splitId },
      });
      if (!split) {
        return NextResponse.json({ error: 'Training split not found' }, { status: 400 });
      }
    }

    if (validatedData.structureId) {
      const structure = await prisma.trainingSplitStructure.findUnique({
        where: { id: validatedData.structureId },
      });
      if (!structure) {
        return NextResponse.json({ error: 'Split structure not found' }, { status: 400 });
      }
    }

    // Update template
    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.difficultyLevel !== undefined) updateData.difficultyLevel = validatedData.difficultyLevel;
    if (validatedData.targetAudience !== undefined) updateData.targetAudience = validatedData.targetAudience;
    if (validatedData.estimatedDurationWeeks !== undefined) updateData.estimatedDurationWeeks = validatedData.estimatedDurationWeeks;
    if (validatedData.splitId !== undefined) updateData.splitId = validatedData.splitId;
    if (validatedData.structureId !== undefined) updateData.structureId = validatedData.structureId;
    if (validatedData.workoutStructureType !== undefined) updateData.workoutStructureType = validatedData.workoutStructureType;
    if (validatedData.thumbnailUrl !== undefined) updateData.thumbnailUrl = validatedData.thumbnailUrl || null;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const updatedTemplate = await prisma.programTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error) {
    console.error('Error updating template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/program-templates/[templateId]
 * Delete template (with usage protection)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const params = await context.params;
    const templateId = params.templateId;

    // Check if template exists and has usage
    const template = await prisma.programTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            trainingPrograms: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template._count.trainingPrograms > 0) {
      return NextResponse.json(
        { error: `Cannot delete template with ${template._count.trainingPrograms} user program(s). Deactivate instead.` },
        { status: 400 }
      );
    }

    // Delete template (cascade will handle workouts and exercises)
    await prisma.programTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true, message: 'Template deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
