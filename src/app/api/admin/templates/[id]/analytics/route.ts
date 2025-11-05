import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Explicitly set runtime to nodejs (required for Prisma)
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/admin/templates/[id]/analytics
 * Get detailed analytics for a specific program template
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const templateId = params.id;

    // Validate template ID
    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Fetch template with detailed analytics
    const template = await prisma.programTemplate.findUnique({
      where: { id: templateId },
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
          include: {
            templateExercises: {
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
        trainingPrograms: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
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

    // Calculate usage statistics
    const totalUsers = template.trainingPrograms.length;
    const uniqueUsers = new Set(template.trainingPrograms.map(up => up.userId).filter(Boolean)).size;
    
    // Usage over time (group by month)
    const usageByMonth = template.trainingPrograms.reduce((acc, up) => {
      const month = new Date(up.createdAt).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent usage (last 10)
    const recentUsage = template.trainingPrograms.slice(0, 10).map(up => ({
      programId: up.id,
      userId: up.userId,
      createdAt: up.createdAt,
    }));

    // Most popular workouts from this template (if users modified them)
    const workoutPopularity = template.templateWorkouts.map(workout => ({
      workoutId: workout.id,
      workoutName: workout.name,
      exerciseCount: workout.templateExercises.length,
    }));

    // Calculate average engagement metrics
    const avgWorkoutsPerTemplate = template._count.templateWorkouts;
    const avgExercisesPerWorkout = template.templateWorkouts.reduce(
      (sum, w) => sum + w.templateExercises.length,
      0
    ) / (template.templateWorkouts.length || 1);

    // Build analytics response
    const analytics = {
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        difficultyLevel: template.difficultyLevel,
        isActive: template.isActive,
        popularity: template.popularity,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
      split: template.trainingSplit,
      structure: template.splitStructure,
      usage: {
        totalUsage: totalUsers,
        uniqueUsers: uniqueUsers,
        usageByMonth: Object.entries(usageByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count })),
      },
      workouts: {
        totalWorkouts: template._count.templateWorkouts,
        avgExercisesPerWorkout: Math.round(avgExercisesPerWorkout * 10) / 10,
        workoutBreakdown: workoutPopularity,
      },
      recentActivity: {
        recentUsage: recentUsage,
        lastUsed: template.trainingPrograms.length > 0 
          ? template.trainingPrograms[0].createdAt 
          : null,
      },
      metrics: {
        conversionRate: template.isActive 
          ? `${((totalUsers / 100) * 100).toFixed(1)}%` 
          : 'N/A', // Placeholder - could calculate vs views
        avgWorkoutsPerTemplate,
        retentionRate: 'N/A', // Could calculate based on active user programs
      },
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
