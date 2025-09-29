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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    const isAdmin = dbUser?.role === 'admin';

    if (isAdmin) {
      // Admin users get access to all active programs
      const allPrograms = await prisma.trainingProgram.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format as purchases for consistency
      const adminPurchases = allPrograms.map(program => ({
        id: `admin-${program.id}`,
        userId: user.id,
        trainingProgramId: program.id,
        purchaseDate: new Date(), // Current date for admin access
        isAdminAccess: true,
        trainingProgram: program,
      }));

      return NextResponse.json({
        success: true,
        purchases: adminPurchases,
        isAdmin: true,
      });
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
      isAdmin: false,
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}