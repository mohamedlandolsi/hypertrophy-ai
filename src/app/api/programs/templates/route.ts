import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/programs/templates
 * Fetch all active program templates for users to browse
 */
export async function GET() {
  try {
    // Authenticate user (optional - templates can be public, but we check for tier limits later)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch all active templates
    const templates = await prisma.programTemplate.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        difficultyLevel: true,
        targetAudience: true,
        estimatedDurationWeeks: true,
        thumbnailUrl: true,
        popularity: true,
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
        _count: {
          select: {
            trainingPrograms: true,
            templateWorkouts: true,
          },
        },
      },
      orderBy: {
        popularity: 'desc',
      },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
