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
        }
      },
      orderBy: {
        role: 'desc' // Admins first
      }
    });

    // Get auth data from Supabase for email and display names using admin client
    const adminClient = createAdminClient();
    const { data: authUsers, error: supabaseError } = await adminClient.auth.admin.listUsers();
    
    if (supabaseError) {
      console.error('Supabase admin error:', supabaseError);
      // If admin API fails, still return data but with masked emails
      const combinedUsers = users.map(user => {
        const lastChat = user.chats[0];
        return {
          id: user.id,
          email: `•••@user-${user.id.substring(0, 6)}.com`, // Masked email as fallback
          displayName: `User ${user.id.substring(0, 8)}`, // Fallback display name
          role: user.role,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          createdAt: lastChat?.createdAt || new Date().toISOString(),
          lastSignIn: lastChat?.createdAt || null,
          emailConfirmed: true,
          chatCount: user.chats.length,
          knowledgeItemsCount: user.knowledgeItems.length,
          lastChatTitle: lastChat?.title || null,
          isActive: user.chats.length > 0
        };
      });
      return NextResponse.json(combinedUsers);
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
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: authUser?.created_at || lastChat?.createdAt || new Date().toISOString(),
        lastSignIn: authUser?.last_sign_in_at || lastChat?.createdAt || null,
        emailConfirmed: authUser?.email_confirmed_at ? true : false,
        chatCount: user.chats.length,
        knowledgeItemsCount: user.knowledgeItems.length,
        lastChatTitle: lastChat?.title || null,
        isActive: user.chats.length > 0,
        avatarUrl: authUser?.user_metadata?.avatar_url || null
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
