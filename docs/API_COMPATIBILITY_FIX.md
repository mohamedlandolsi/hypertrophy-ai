# API Compatibility Fix for Vercel AI SDK

## Problem: API Response Format Mismatch

Your current API returns:
```json
{
  "conversationId": "chat_123",
  "assistantReply": "AI response text",
  "userMessage": {...},
  "assistantMessage": {...}
}
```

But the Vercel AI SDK expects either:
1. A streaming text response, OR
2. A structured message format with specific fields

## Solution: Modify API Route for AI SDK Compatibility

Update your `/api/chat/route.ts` to return the format expected by the AI SDK:

```typescript
// At the end of your POST function, replace the current return with:

// For the AI SDK, we need to return the assistant's message content directly
// and include metadata in the response headers or as structured data

return new Response(aiResult.content, {
  status: 200,
  headers: {
    'Content-Type': 'text/plain',
    // Include conversation ID and other metadata in headers
    'X-Conversation-Id': chatId,
    'X-Message-Id': assistantMessage.id,
    // Or use a custom header for structured data
    'X-Metadata': JSON.stringify({
      conversationId: chatId,
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt,
        imageData: userMessage.imageData ? `data:${userMessage.imageMimeType};base64,${userMessage.imageData}` : undefined,
        imageMimeType: userMessage.imageMimeType || undefined,
      },
      assistantMessage: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt,
      },
      citations: aiResult.citations || []
    })
  }
});
```

## Alternative: Keep Current API and Use onResponse Handler

If you prefer to keep your current API format, modify the `useChat` configuration:

```typescript
const {
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  data,
  setMessages,
  setInput,
} = useChat({
  api: '/api/chat',
  
  body: {
    conversationId,
    isGuest: !user,
  },
  
  onRequest: ({ messages, options }) => {
    const lastMessage = messages[messages.length - 1];
    
    return {
      ...options,
      body: JSON.stringify({
        ...options.body,
        message: lastMessage.content,
      }),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
  },
  
  // Handle the custom response format
  onResponse: async (response) => {
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    const data = await response.json();
    
    // Store the conversation ID and other metadata
    if (data.conversationId && !conversationId) {
      setConversationId(data.conversationId);
      setActiveChatId(data.conversationId);
      window.history.replaceState(null, '', `/${locale}/chat?id=${data.conversationId}`);
      loadChatHistory();
    }
    
    // Return the assistant's message content for the AI SDK
    return new Response(data.assistantMessage.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  },
  
  onFinish: (message) => {
    // Update message counts
    if (user && userPlan && userPlan.plan === 'FREE') {
      setUserPlan(prev => prev ? { 
        ...prev, 
        messagesUsedToday: Math.min(prev.messagesUsedToday + 1, prev.dailyLimit)
      } : null);
    }
    
    if (!user) {
      setGuestMessageCount(prev => prev + 1);
    }
  },
  
  onError: (err) => {
    console.error('Chat error:', err);
    
    if (err.message?.includes('MESSAGE_LIMIT_REACHED')) {
      if (userPlan) {
        setUserPlan(prev => prev ? { ...prev, messagesUsedToday: prev.dailyLimit } : null);
      }
      showToast.error(t('toasts.limitReachedTitle'), t('toasts.limitReachedText'));
    } else {
      showToast.error(t('toasts.errorSendingMessage'), err.message || t('toasts.genericError'));
    }
  },
});
```

## Recommendation

I recommend **Option 1** (modifying the API) because:
- It's simpler and more maintainable
- It follows AI SDK conventions
- It reduces complexity in the frontend
- It's more compatible with future AI SDK updates

The key is to return the assistant's message content as plain text while including metadata in headers or through other means.
