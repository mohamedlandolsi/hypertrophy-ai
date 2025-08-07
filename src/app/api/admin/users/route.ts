import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - Fetch all users
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

    // Fetch all users from Prisma with more detailed information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        plan: true,
        hasCompletedOnboarding: true,
        chats: {
          select: {
            id: true,
            createdAt: true,
            title: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        knowledgeItems: {
          select: {
            id: true
          }
        },
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            planId: true,
            variantId: true
          }
        }
      },
      orderBy: {
        role: 'desc' // Admins first
      }
    });

    // Get auth data from Supabase for email and display names using admin client
    const adminClient = createAdminClient();
    
    let authUsers;
    let supabaseError;
    
    try {
      console.log('Attempting to fetch users with admin client...');
      const result = await adminClient.auth.admin.listUsers();
      authUsers = result.data;
      supabaseError = result.error;
      
      if (supabaseError) {
        console.error('Supabase admin listUsers error:', {
          message: supabaseError.message,
          status: supabaseError.status,
          code: supabaseError.code || 'unknown'
        });
      } else {
        console.log(`Successfully fetched ${authUsers?.users?.length || 0} auth users`);
      }
    } catch (adminError) {
      console.error('Admin client error:', adminError);
      supabaseError = adminError;
    }
    
    if (supabaseError || !authUsers?.users) {
      console.error('Failed to get user data from Supabase admin API. Error:', supabaseError);
      console.log('Attempting fallback approach...');
      
      // Fallback: Try to get at least some user data by using regular client for current user
      // and provide a more informative response
      const regularClient = await createClient();
      const { data: { user: currentUser } } = await regularClient.auth.getUser();
      
      const fallbackUsers = users.map(user => {
        const lastChat = user.chats[0];
        
        // If this is the current admin user, we can get their real data
        const isCurrentUser = currentUser && user.id === currentUser.id;
        
        return {
          id: user.id,
          email: isCurrentUser ? (currentUser.email || 'Admin User') : `user-${user.id.substring(0, 8)}@hidden.email`,
          displayName: isCurrentUser 
            ? (currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Admin User')
            : `User ${user.id.substring(0, 8)}`,
          role: user.role,
          plan: user.plan,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          createdAt: lastChat?.createdAt || new Date().toISOString(),
          lastSignIn: lastChat?.createdAt || null,
          emailConfirmed: isCurrentUser ? true : false,
          chatCount: user.chats.length,
          knowledgeItemsCount: user.knowledgeItems.length,
          lastChatTitle: lastChat?.title || null,
          isActive: user.chats.length > 0,
          avatarUrl: isCurrentUser ? (currentUser.user_metadata?.avatar_url || null) : null,
          subscription: user.subscription ? {
            id: user.subscription.id,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
            planId: user.subscription.planId
          } : null,
          _note: isCurrentUser ? 'Real data' : 'Limited data - Admin API unavailable'
        };
      });
      
      return NextResponse.json({
        users: fallbackUsers,
        warning: 'Limited user data available. Supabase admin API access failed. Please check service role key configuration.',
        adminApiError: (supabaseError as Error)?.message || String(supabaseError) || 'Admin API access failed'
      });
    }

    // Create a map of auth users for easier lookup
    const authUserMap = new Map();
    authUsers.users.forEach((authUser) => {
      authUserMap.set(authUser.id, authUser);
    });

    // Combine Prisma and Supabase data with real emails and display names
    const combinedUsers = users.map(user => {
      const authUser = authUserMap.get(user.id);
      const lastChat = user.chats[0];
      
      return {
        id: user.id,
        email: authUser?.email || 'No email',
        displayName: authUser?.user_metadata?.display_name || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || `User ${user.id.substring(0, 8)}`,
        role: user.role,
        plan: user.plan,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: authUser?.created_at || lastChat?.createdAt || new Date().toISOString(),
        lastSignIn: authUser?.last_sign_in_at || lastChat?.createdAt || null,
        emailConfirmed: authUser?.email_confirmed_at ? true : false,
        chatCount: user.chats.length,
        knowledgeItemsCount: user.knowledgeItems.length,
        lastChatTitle: lastChat?.title || null,
        isActive: user.chats.length > 0,
        avatarUrl: authUser?.user_metadata?.avatar_url || null,
        subscription: user.subscription ? {
          id: user.subscription.id,
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
          planId: user.subscription.planId
        } : null
      };
    });

    return NextResponse.json(combinedUsers);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
