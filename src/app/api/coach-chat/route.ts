import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Create a new coach chat
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has PRO plan
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true }
    });

    if (!userData || userData.plan !== 'PRO') {
      return NextResponse.json({ error: 'PRO plan required' }, { status: 403 });
    }

    const { coachId } = await request.json();

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
    }

    // Verify coach exists and has coach role
    const coach = await prisma.user.findFirst({
      where: {
        id: coachId,
        OR: [
          { role: 'coach' },
          { role: { contains: 'coach' } }
        ]
      }
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Check if there's already an active chat with this coach
    const existingChat = await prisma.coachChat.findFirst({
      where: {
        userId: user.id,
        coachId: coachId,
        status: 'ACTIVE'
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        coach: {
          select: {
            id: true
          }
        }
      }
    });

    if (existingChat) {
      return NextResponse.json(existingChat);
    }

    // Create new coach chat
    const newChat = await prisma.coachChat.create({
      data: {
        userId: user.id,
        coachId: coachId,
        title: `Chat with Coach ${coachId.slice(-6)}`,
        status: 'ACTIVE'
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true
              }
            }
          }
        },
        coach: {
          select: {
            id: true
          }
        }
      }
    });

    return NextResponse.json(newChat);
  } catch (error) {
    console.error('Error creating coach chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's coach chats
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await prisma.coachChat.findMany({
      where: {
        userId: user.id
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        coach: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching coach chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
