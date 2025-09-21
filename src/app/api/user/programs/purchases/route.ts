import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch user's purchased programs
    const purchases = await prisma.userPurchase.findMany({
      where: {
        userId: user.id,
      },
      include: {
        trainingProgram: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}