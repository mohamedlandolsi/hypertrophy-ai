# Gemini 2.5 Integration Setup

This document explains how to set up and use the Gemini 2.5 AI integration in your Hypertrophy AI chat application.

## Prerequisites

1. **Gemini API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Supabase Setup**: Ensure your Supabase database is configured
3. **Prisma Setup**: Database schema should be migrated

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Gemini AI
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Database (already configured)
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Schema

Ensure your Prisma schema includes these models (should already be set up):

- `User`: For authentication
- `Chat`: For conversation sessions
- `Message`: For individual messages with role (USER/ASSISTANT)

### 3. Generate Prisma Client

```bash
npx prisma generate
```

## How It Works

### Chat Flow

1. **User Authentication**: Uses Supabase Auth to verify users
2. **Message Storage**: All messages are stored in PostgreSQL via Prisma
3. **AI Processing**: User messages are sent to Gemini 2.5 Flash
4. **Response Handling**: AI responses are stored and displayed

### API Endpoints

#### `/api/chat` (POST)
- **Purpose**: Send messages and get AI responses
- **Body**: `{ conversationId?: string, message: string }`
- **Response**: `{ conversationId, assistantReply, userMessage, assistantMessage }`

#### `/api/conversations` (GET)
- **Purpose**: Get list of user's conversations
- **Response**: `{ conversations: [...] }`

#### `/api/conversations/[id]/messages` (GET)
- **Purpose**: Get all messages for a specific conversation
- **Response**: `{ conversation: { id, title, messages: [...] } }`

### Frontend Features

1. **Real-time Chat**: Optimistic UI updates for smooth experience
2. **Conversation History**: Sidebar with previous chats
3. **Session Management**: Automatic conversation creation and loading
4. **Error Handling**: Graceful error handling with user feedback

## System Prompt

The AI is configured as a specialized fitness coach focused on:
- Hypertrophy (muscle building) training
- Progressive overload and periodization
- Exercise selection and technique
- Nutrition for muscle growth
- Recovery optimization
- Training split design

## Usage

1. **Start New Chat**: Click "New Chat" to begin a fresh conversation
2. **Send Messages**: Type in the input box and press Enter or click Send
3. **View History**: Previous conversations appear in the sidebar
4. **Load Previous Chats**: Click any conversation in the sidebar to continue

## Configuration Options

### Gemini Settings (in `/lib/gemini.ts`)

```typescript
generationConfig: {
  temperature: 0.7,      // Creativity level (0-1)
  topK: 40,             // Token selection diversity
  topP: 0.95,           // Nucleus sampling
  maxOutputTokens: 2048, // Maximum response length
}
```

### Model Selection

Currently using `gemini-2.0-flash-exp` (Gemini 2.0 Flash Experimental). You can change this in the `sendToGemini` function.

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Verify your Gemini API key is correct
2. **Database Errors**: Ensure Prisma schema is migrated
3. **Authentication Issues**: Check Supabase configuration
4. **Rate Limits**: Gemini API has usage limits

### Error Logs

Check browser console and server logs for detailed error messages.

## Development

To extend functionality:

1. **Custom System Prompts**: Modify the `systemPrompt` in `/lib/gemini.ts`
2. **Additional Models**: Update model selection in Gemini client
3. **Enhanced UI**: Modify the chat interface in `/app/chat/page.tsx`
4. **New Features**: Add new API routes as needed

## Security Notes

- API keys are server-side only
- User authentication required for all chat operations
- Messages are tied to authenticated users
- Database queries are parameterized to prevent injection

## Performance Optimizations

- Optimistic UI updates for responsiveness
- Conversation history pagination (can be added)
- Message streaming (can be implemented)
- Caching strategies (can be added)
