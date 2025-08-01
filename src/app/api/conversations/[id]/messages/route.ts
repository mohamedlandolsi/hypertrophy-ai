import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id }
    });

    const { id: conversationId } = await params;

    // Fetch the conversation with all messages
    const conversation = await prisma.chat.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Format messages for the frontend
    const messages = conversation.messages.map(msg => {
      const messageResponse: {
        id: string;
        role: string;
        content: string;
        createdAt: Date;
        imageData?: string;
        imageMimeType?: string;
        images?: Array<{ data: string; mimeType: string; name: string }>;
      } = {
        id: msg.id,
        role: msg.role.toLowerCase(), // Convert 'USER'/'ASSISTANT' to 'user'/'assistant'
        content: msg.content,
        createdAt: msg.createdAt,
      };
      
      // Handle image data based on storage format
      if (msg.imageData && msg.imageMimeType) {
        if (msg.imageMimeType === 'application/json') {
          // Multiple images stored as JSON
          try {
            const imagesJson = JSON.parse(msg.imageData) as Array<{ data: string; mimeType: string; name: string }>;
            messageResponse.images = imagesJson.map((img) => ({
              data: `data:${img.mimeType};base64,${img.data}`,
              mimeType: img.mimeType,
              name: img.name
            }));
            // For backward compatibility, also set single image fields to the first image
            if (imagesJson.length > 0) {
              messageResponse.imageData = `data:${imagesJson[0].mimeType};base64,${imagesJson[0].data}`;
              messageResponse.imageMimeType = imagesJson[0].mimeType;
            }
          } catch (error) {
            console.error('Error parsing images JSON for message:', msg.id, error);
          }
        } else {
          // Single image stored directly
          messageResponse.imageData = `data:${msg.imageMimeType};base64,${msg.imageData}`;
          messageResponse.imageMimeType = msg.imageMimeType;
          // Also provide in new structured format
          messageResponse.images = [{
            data: `data:${msg.imageMimeType};base64,${msg.imageData}`,
            mimeType: msg.imageMimeType,
            name: 'Image'
          }];
        }
      }
      
      return messageResponse;
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        messages
      }
    });

  } catch (error) {
    console.error('Conversation messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
