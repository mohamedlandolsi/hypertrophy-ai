/**
 * Example API route demonstrating tier limit enforcement
 * 
 * This route shows how to use withTierCheck middleware to protect API endpoints
 * based on subscription tiers and usage limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTierCheck, enforceLimit, incrementUsage, checkFeatureAccess } from '@/lib/tier-limits';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // Required for Prisma

// ============================================================================
// EXAMPLE 1: Simple tier requirement
// ============================================================================

/**
 * GET endpoint that requires PRO tier
 * Returns 403 if user is on FREE tier
 */
export const GET = withTierCheck(
  async (_request, _context) => {
    // User is guaranteed to have PRO_MONTHLY or PRO_YEARLY at this point
    const data = {
      message: 'Welcome to Pro features!',
      features: ['advanced_analytics', 'workout_templates', 'conversation_memory'],
    };

    return NextResponse.json(data);
  },
  {
    requiredTier: ['PRO_MONTHLY', 'PRO_YEARLY'],
  }
);

// ============================================================================
// EXAMPLE 2: Feature-based access control
// ============================================================================

/**
 * POST endpoint that checks specific feature access
 * Example: Export program to PDF (only available on PRO_YEARLY)
 */
export const POST = withTierCheck(
  async (request, _context) => {
    const body = await request.json();
    const { programId } = body;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate PDF (feature is already checked by middleware)
    const pdf = await generateProgramPDF(programId);

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="program-${programId}.pdf"`,
      },
    });
  },
  {
    feature: 'export_pdf', // Checks if user can access PDF export
    logUsage: true, // Log to analytics
  }
);

// ============================================================================
// EXAMPLE 3: Usage limit enforcement
// ============================================================================

/**
 * PUT endpoint that enforces usage limits
 * Example: Customize program (limited to 5/month on FREE, unlimited on PRO)
 */
export const PUT = withTierCheck(
  async (request, _context) => {
    const body = await request.json();
    const { programId, customizations } = body;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply customizations (limit already checked by middleware)
    const updatedProgram = await applyCustomizations(programId, customizations);

    // Increment usage count
    await incrementUsage(user.id, 'customizations');

    return NextResponse.json({ program: updatedProgram });
  },
  {
    limitType: 'customizations', // Checks if user has remaining customizations
    logUsage: true,
  }
);

// ============================================================================
// EXAMPLE 4: Manual tier checking (for complex logic)
// ============================================================================

/**
 * DELETE endpoint with manual tier checking for complex scenarios
 * Use this when you need custom logic beyond simple middleware
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programId } = body;

    // Manual feature check
    const access = await checkFeatureAccess(user.id, 'advanced_analytics');
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: 'Feature access denied',
          reason: access.reason,
          upgradePath: access.upgradePath,
        },
        { status: 403 }
      );
    }

    // Manual limit check
    const limit = await enforceLimit(user.id, 'programs');
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Program limit reached',
          current: limit.current,
          limit: limit.limit,
          remaining: limit.remaining,
          resetDate: limit.resetDate,
          upgradePath: '/pricing',
        },
        { status: 429 }
      );
    }

    // Perform deletion with custom logic
    const result = await deleteProgram(programId, user.id);

    // Decrement program count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        customProgramsCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS (mock implementations)
// ============================================================================

async function generateProgramPDF(programId: string): Promise<Buffer> {
  // Mock PDF generation
  // In production, use a library like pdfkit or puppeteer
  return Buffer.from(`PDF content for program ${programId}`);
}

async function applyCustomizations(
  programId: string,
  customizations: Record<string, unknown>
): Promise<unknown> {
  // Mock customization logic
  const program = await prisma.trainingProgram.update({
    where: { id: programId },
    data: {
      // Apply customizations
      ...customizations,
    },
  });

  return program;
}

async function deleteProgram(programId: string, _userId: string): Promise<unknown> {
  // Mock deletion logic
  // In production, verify ownership before deleting
  const result = await prisma.trainingProgram.delete({
    where: {
      id: programId,
    },
  });

  return result;
}
