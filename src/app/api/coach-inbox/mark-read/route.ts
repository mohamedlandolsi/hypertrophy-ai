import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function PUT(request: Request) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { coachChatId } = await request.json();

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

    // Verify the coach chat belongs to this coach
    const coachChat = await prisma.coachChat.findFirst({
      where: {
        id: coachChatId,
        coachId: user.id
      }
    });

    if (!coachChat) {
      return NextResponse.json(
        { error: 'Coach chat not found' },
        { status: 404 }
      );
    }

    // Mark all unread messages in this chat as read (only messages from the user, not from the coach)
    await prisma.coachMessage.updateMany({
      where: {
        coachChatId: coachChatId,
        isRead: false,
        senderId: {
          not: user.id // Only mark user messages as read, not coach's own messages
        }
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
