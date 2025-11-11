import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  if (process.env.NODE_ENV === 'development') { console.log('📝 Conversations API: Starting request'); }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      if (process.env.NODE_ENV === 'development') { console.log('❌ Conversations API: Authentication failed'); }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') { console.log(`👤 Conversations API: User authenticated - ${user.id}`); }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    if (process.env.NODE_ENV === 'development') { console.log(`📄 Conversations API: Pagination - page: ${page}, limit: ${limit}, skip: ${skip}`); }

    // Ensure user exists in our database (simple upsert)
    if (process.env.NODE_ENV === 'development') { console.log('🔄 Conversations API: Upserting user'); }
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Get total count for pagination info
    if (process.env.NODE_ENV === 'development') { console.log('🔢 Conversations API: Getting total count'); }
    const totalCount = await prisma.chat.count({
      where: {
        userId: user.id,
      }
    });
    if (process.env.NODE_ENV === 'development') { console.log(`📊 Conversations API: Total count - ${totalCount}`); }

    // Fetch conversations for the user with pagination (optimized - no message includes)
    if (process.env.NODE_ENV === 'development') { console.log('💬 Conversations API: Fetching conversations'); }
    const conversations = await prisma.chat.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Conversations API: Found ${conversations.length} conversations`); }

    // Format the response (simplified without message data for performance)
    const formattedConversations = conversations.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.createdAt, // Use chat createdAt since we don't have message data
      lastMessage: null, // Remove for performance - can be added back with separate query if needed
      messageCount: 0 // Remove for performance - can be added back with separate query if needed
    }));

    const hasMore = skip + limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') { console.log(`🎉 Conversations API: Request completed in ${duration}ms`); }

    return NextResponse.json({ 
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Conversations API error (after ${duration}ms):`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
