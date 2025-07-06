import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { 
  ApiErrorHandler, 
  AuthenticationError, 
  logger 
} from '@/lib/error-handler';

// GET - Fetch all knowledge items for the authenticated user
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('Knowledge items fetch requested', context);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    logger.info('Fetching knowledge items', { ...context, userId: user.id });

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Fetch knowledge items for the user
    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Knowledge items fetched successfully', { 
      ...context, 
      userId: user.id,
      itemCount: knowledgeItems.length 
    });

    return NextResponse.json({ knowledgeItems });
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// POST - Create a new knowledge item (text content)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, type } = await request.json();

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Title, content, and type are required' },
        { status: 400 }
      );
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    // Create knowledge item
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        title,
        content,
        type: type.toUpperCase(),
        status: 'READY',
        userId: user.id,
      }
    });

    return NextResponse.json({ knowledgeItem });
  } catch (error) {
    console.error('Error creating knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
}
