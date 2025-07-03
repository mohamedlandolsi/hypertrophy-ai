import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user from database to get role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser) {
      // Create user if doesn't exist (with default role and onboarding status)
      const newUser = await prisma.user.create({
        data: {
          id: user.id,
          role: 'user',
          hasCompletedOnboarding: false
        }
      });
      
      return NextResponse.json({
        success: true,
        role: newUser.role
      });
    }

    return NextResponse.json({
      success: true,
      role: dbUser.role
    });

  } catch (error) {
    console.error('User role API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
