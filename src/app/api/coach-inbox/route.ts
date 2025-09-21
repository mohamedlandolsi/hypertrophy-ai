import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function GET(request: Request) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a coach (role can be "coach" or include "coach" in comma-separated roles)
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

    // Get unread messages count for this coach
    const unreadCount = await prisma.coachMessage.count({
      where: {
        isRead: false,
        coachChat: {
          coachId: user.id
        }
      }
    });

    // Get recent unread messages with user info for preview
    const recentMessages = await prisma.coachMessage.findMany({
      where: {
        isRead: false,
        coachChat: {
          coachId: user.id
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            clientMemory: {
              select: {
                name: true
              }
            }
          }
        },
        coachChat: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                clientMemory: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      unreadCount,
      recentMessages: recentMessages.map(msg => ({
        id: msg.id,
        content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
        createdAt: msg.createdAt,
        senderName: msg.sender.clientMemory?.name || msg.coachChat.user.clientMemory?.name || 'Anonymous',
        coachChatId: msg.coachChatId
      }))
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
