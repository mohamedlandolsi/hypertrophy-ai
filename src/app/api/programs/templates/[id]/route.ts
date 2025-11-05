import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch template with full details
    const template = await prisma.programTemplate.findUnique({
      where: { id },
      include: {
        trainingSplit: {
          select: {
            name: true,
          },
        },
        splitStructure: {
          select: {
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
                    name: true,
                    primaryMuscle: true,
                    secondaryMuscles: true,
                  },
                },
              },
            },
          },
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
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Template is not available' },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
