/**
 * API route to create checkout URL for training program purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lemonSqueezyService } from '@/lib/lemonsqueezy';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { programId, variantId } = body;

    if (!programId || !variantId) {
      return NextResponse.json(
        { error: 'Program ID and Variant ID are required' },
        { status: 400 }
      );
    }

    // Get program details
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      select: {
        id: true,
        name: true,
        price: true,
        lemonSqueezyId: true,
        isActive: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (!program.isActive) {
      return NextResponse.json(
        { error: 'Program is not available for purchase' },
        { status: 400 }
      );
    }

    if (!program.lemonSqueezyId) {
      return NextResponse.json(
        { error: 'Program is not set up for purchase' },
        { status: 400 }
      );
    }

    // Check if user already purchased this program
    const existingPurchase = await prisma.userPurchase.findUnique({
      where: {
        userId_trainingProgramId: {
          userId: user.id,
          trainingProgramId: programId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this program' },
        { status: 400 }
      );
    }

    // Create checkout URL
    const checkoutUrl = await lemonSqueezyService.createProgramCheckoutUrl({
      productId: program.lemonSqueezyId,
      variantId,
      userId: user.id,
      userEmail: user.email || '',
      programId: program.id,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/${programId}/guide?purchased=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/${programId}`,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Error creating program checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
