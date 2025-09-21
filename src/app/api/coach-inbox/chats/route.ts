import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function GET(request: Request) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a coach
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCoach = dbUser.role === 'coach' || dbUser.role.includes('coach');
    
    if (!isCoach) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      );
    }

    // Get coach chats with latest message and unread count
    const coachChats = await prisma.coachChat.findMany({
      where: {
        coachId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            clientMemory: {
              select: {
                name: true
              }
            }
          }
        },
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: user.id // Only count messages from the user, not from the coach
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    });

    const totalCount = await prisma.coachChat.count({
      where: {
        coachId: user.id
      }
    });

    const formattedChats = coachChats.map(chat => ({
      id: chat.id,
      userId: chat.userId,
      userName: chat.user.clientMemory?.name || 'Anonymous',
      status: chat.status,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      unreadCount: chat._count.messages,
      lastMessage: chat.messages[0] ? {
        id: chat.messages[0].id,
        content: chat.messages[0].content.substring(0, 100) + (chat.messages[0].content.length > 100 ? '...' : ''),
        createdAt: chat.messages[0].createdAt,
        isFromUser: chat.messages[0].senderId !== user.id
      } : null
    }));

    return NextResponse.json({
      chats: formattedChats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
