import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with role containing 'coach'
    const coaches = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'coach' },
          { role: { contains: 'coach' } }
        ]
      },
      select: {
        id: true,
        role: true,
      }
    });

    // Fetch user details from Supabase Auth for each coach
    const adminClient = createAdminClient();
    const coachesWithDetails = await Promise.all(
      coaches.map(async (coach) => {
        try {
          const { data: authUser, error } = await adminClient.auth.admin.getUserById(coach.id);
          
          if (error || !authUser.user) {
            console.warn(`Failed to fetch auth data for coach ${coach.id}:`, error);
            return {
              id: coach.id,
              name: 'Unknown Coach',
              email: 'unknown@example.com',
              status: 'inactive' as const,
              role: coach.role,
              user_metadata: {}
            };
          }

          return {
            id: coach.id,
            name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Coach',
            email: authUser.user.email || 'unknown@example.com',
            status: 'active' as const,
            role: coach.role,
            user_metadata: authUser.user.user_metadata || {}
          };
        } catch (error) {
          console.warn(`Error fetching details for coach ${coach.id}:`, error);
          return {
            id: coach.id,
            name: 'Unknown Coach',
            email: 'unknown@example.com',
            status: 'inactive' as const,
            role: coach.role,
            user_metadata: {}
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true,
      coaches: coachesWithDetails
    });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
