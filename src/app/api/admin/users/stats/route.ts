import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users/stats - Get user statistics
export async function GET() {
  try {
    // Verify admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate more detailed stats from Prisma
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalUsersResult,
      totalAdminsResult,
      activeUsersResult,
      usersWithChatsThisWeek
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { hasCompletedOnboarding: true } }),
      prisma.user.count({
        where: {
          chats: {
            some: {
              createdAt: {
                gte: oneWeekAgo
              }
            }
          }
        }
      })
    ]);

    // Get new users this week from Supabase auth using admin client
    const adminClient = createAdminClient();
    const { data: authUsers, error: supabaseError } = await adminClient.auth.admin.listUsers();
    
    let newUsersThisWeek = 0;
    if (!supabaseError && authUsers) {
      newUsersThisWeek = authUsers.users.filter((authUser: { created_at: string }) => {
        const createdAt = new Date(authUser.created_at);
        return createdAt >= oneWeekAgo;
      }).length;
    } else {
      console.error('Supabase admin error:', supabaseError);
      // Use users with chats this week as fallback
      newUsersThisWeek = usersWithChatsThisWeek;
    }

    const stats = {
      totalUsers: totalUsersResult,
      totalAdmins: totalAdminsResult,
      newUsersThisWeek,
      activeUsers: activeUsersResult
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
