'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function signOut() {
  const supabase = await createClient();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Revalidate multiple paths to ensure cache is cleared
  revalidatePath('/', 'layout');
  revalidatePath('/chat'); // Specifically revalidate chat page
  revalidatePath('/login');
  
  // Redirect to home page
  redirect('/');
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

export interface ChatSession {
  id: string; // Prisma BigInt will be converted to string
  title: string | null;
  createdAt: Date;
  messages: ChatMessage[];
}

/**
 * Fetches all chat sessions for a given user.
 * Only returns id, title (from 'name' field), and createdAt.
 */
export async function getChatSessions(userEmail: string): Promise<{ id: string; title: string | null; createdAt: Date }[]> {
  if (!userEmail) {
    console.error('getChatSessions: userEmail is required');
    return [];
  }  try {
    const sessions = await prisma.chat.findMany({
      where: {
        userId: userEmail,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return sessions.map((s: { id: string; title: string; createdAt: Date }) => ({ ...s, title: s.title }));
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

/**
 * Fetches the details (including messages) for a specific chat session.
 */
export async function getChatSessionDetails(chatId: string): Promise<ChatSession | null> {
  if (!chatId) {
    console.error('getChatSessionDetails: chatId is required');
    return null;
  }
  try {
    const session = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return null;
    }

    const messages: ChatMessage[] = session.messages.map(msg => ({
      id: msg.id,
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      messages,
    };
  } catch (error) {
    console.error('Error fetching chat session details:', error);
    return null;
  }
}

/**
 * Creates a new chat session.
 */
export async function createNewChat(
  userId: string,
  userName: string | null,
  firstMessage: ChatMessage,
  initialTitle?: string
): Promise<ChatSession | null> {
  if (!userId) {
    console.error('createNewChat: userId is required');
    return null;
  }

  const title = initialTitle || `Chat on ${new Date().toLocaleDateString()}`;

  try {
    const newSession = await prisma.chat.create({
      data: {
        title: title,
        userId: userId,
      },
      include: {
        messages: true
      }
    });

    // Create the first message
    const newMessage = await prisma.message.create({
      data: {
        content: firstMessage.content,
        role: firstMessage.role.toUpperCase() as 'USER' | 'ASSISTANT',
        chatId: newSession.id,
      }
    });

    revalidatePath('/chat');
    return {
      id: newSession.id,
      title: newSession.title,
      createdAt: newSession.createdAt,
      messages: [{
        id: newMessage.id,
        role: newMessage.role.toLowerCase() as 'user' | 'assistant',
        content: newMessage.content,
        createdAt: newMessage.createdAt,
      }],
    };
  } catch (error) {
    console.error('Error creating new chat session:', error);
    return null;
  }
}

/**
 * Adds a message to an existing chat session.
 */
export async function addMessageToChat(
  chatId: string,
  newMessage: ChatMessage
): Promise<ChatSession | null> {
  if (!chatId) {
    console.error('addMessageToChat: chatId is required');
    return null;
  }
  try {
    const session = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      console.error('addMessageToChat: Session not found');      return null;
    }    // Add the new message to the database
    await prisma.message.create({
      data: {
        content: newMessage.content,
        role: newMessage.role.toUpperCase() as 'USER' | 'ASSISTANT',
        chatId: chatId,
      }
    });

    // Get the updated session with all messages
    const updatedSession = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!updatedSession) {
      console.error('addMessageToChat: Updated session not found');
      return null;
    }

    const messages: ChatMessage[] = updatedSession.messages.map(msg => ({
      id: msg.id,
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
      createdAt: msg.createdAt,
    }));

    return {
      id: updatedSession.id,
      title: updatedSession.title,
      createdAt: updatedSession.createdAt,
      messages: messages,
    };
  } catch (error) {
    console.error('Error adding message to chat:', error);
    return null;
  }
}
