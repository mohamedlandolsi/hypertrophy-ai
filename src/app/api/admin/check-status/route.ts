import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required', isAdmin: false },
        { status: 401 }
      );
    }

    // Check user role in database using Prisma (server-side)
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        role: true, 
        hasCompletedOnboarding: true,
        plan: true 
      }
    });

    if (!userData) {
      return NextResponse.json(
        { 
          error: 'User not found in database', 
          isAdmin: false,
          userExists: false
        },
        { status: 404 }
      );
    }

    const isAdmin = userData.role === 'admin';

    return NextResponse.json({
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        role: userData.role,
        plan: userData.plan,
        hasCompletedOnboarding: userData.hasCompletedOnboarding
      },
      error: null
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { 
        error: 'Server error: ' + (error as Error).message, 
        isAdmin: false 
      },
      { status: 500 }
    );
  }
}
