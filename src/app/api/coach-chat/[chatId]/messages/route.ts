import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    const { chatId } = await params;
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { id: authData.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has coach role
    const hasCoachRole = user.role?.split(',').map(r => r.trim()).includes('coach');
    if (!hasCoachRole) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Verify chat belongs to this coach
    const chat = await prisma.coachChat.findFirst({
      where: {
        id: chatId,
        coachId: user.id
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Get messages
    const [messages, total] = await Promise.all([
      prisma.coachMessage.findMany({
        where: { coachChatId: chatId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          isRead: true
        }
      }),
      prisma.coachMessage.count({
        where: { coachChatId: chatId }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
