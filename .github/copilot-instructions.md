# HypertroQ - AI Fitness Coach Development Guide

## 🏗️ Architecture Overview

**HypertroQ** is a sophisticated RAG-powered AI fitness coaching platform with enterprise-level architecture featuring personalized client memory, multilingual support, scientific knowledge base integration, and subscription management.

### Core Components
- **RAG System**: Hybrid vector similarity + keyword search using Gemini embeddings with optimized chunking
- **Client Memory**: Auto-extracting user profiling system with 50+ structured fields and AI function calling
- **AI Configuration**: Admin-controlled singleton pattern for system prompts, model selection, and RAG parameters
- **Authentication**: Supabase SSR with role-based access, onboarding flow, and login-required chat
- **File Processing**: Multi-format pipeline (PDF, DOC, TXT, MD) with semantic chunking and embedding generation
- **Subscription System**: Two-tier (FREE/PRO) with daily limits, LemonSqueezy integration, and usage tracking
- **Internationalization**: Full i18n with next-intl supporting Arabic RTL, French, and English
- **Error Handling**: Centralized `ApiErrorHandler` with structured logging, correlation IDs, and type-safe errors
- **Performance**: Comprehensive caching strategy with optimized components and smart data fetching
- **Modern UI**: Glassmorphism design with animations, gradients, and mobile-first responsive layouts

### Critical Architecture Decisions
- **Admin-Required Setup**: All AI operations require admin configuration through singleton `AIConfiguration` table
- **Hybrid RAG Search**: Combines vector similarity + keyword matching with configurable thresholds and muscle-specific priority
- **Function-Calling Memory**: AI automatically extracts user information via Gemini function calling instead of regex patterns
- **Login-Required Chat**: Unauthenticated users must login to send messages (no guest messaging)
- **JSON Vector Storage**: Temporary embedding storage as JSON strings until pgvector migration
- **Server-Side Limits**: Subscription enforcement with daily message tracking and monthly upload quotas
- **Multi-Image Base64**: Gallery display with base64 storage and conditional rendering patterns
- **Windows Development**: PowerShell-optimized debug scripts and file path handling
- **Batched Vector Processing**: Optimized JSON similarity search with batching (100-chunk batches) for performance

## 🚀 Development Workflows

### Essential Commands
```bash
npm run dev              # Development server
npm run dev:turbo        # Development with turbopack (faster builds)
npm run build           # Prisma generate + Next.js production build
npm start               # Production server
npm run lint            # ESLint validation
npx prisma migrate dev  # Apply schema changes with migration name
npx prisma studio       # Visual database browser
npm run postinstall     # Generate Prisma client (auto-run after install)
```

### Critical Environment Variables
```bash
# Core Services
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public key for client-side
SUPABASE_SERVICE_ROLE_KEY=       # Server-side admin operations
GEMINI_API_KEY=                  # Google Gemini API for AI/embeddings
DATABASE_URL=                    # PostgreSQL connection string
DIRECT_URL=                      # Direct DB connection (for migrations)

# Subscription System (LemonSqueezy) - Current Pricing: $9/month, $90/year
LEMONSQUEEZY_API_KEY=            # API key for payment processing
LEMONSQUEEZY_STORE_ID=           # Store ID for product management
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID=  # Monthly subscription product
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=  # Monthly subscription variant
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID=   # Yearly subscription product (same as monthly)
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=   # Yearly subscription variant (different from monthly)
LEMONSQUEEZY_WEBHOOK_SECRET=     # Webhook signature verification
NEXT_PUBLIC_SITE_URL=            # Site URL for checkout success/cancel redirects
```
DIRECT_URL=                      # Direct DB connection (for migrations)

# Subscription System (LemonSqueezy) - Current Pricing: $9/month, $90/year
LEMONSQUEEZY_API_KEY=            # API key for payment processing
LEMONSQUEEZY_STORE_ID=           # Store ID for product management
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID=  # Monthly subscription product
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=  # Monthly subscription variant
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID=   # Yearly subscription product (same as monthly)
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=   # Yearly subscription variant (different from monthly)
LEMONSQUEEZY_WEBHOOK_SECRET=     # Webhook signature verification
NEXT_PUBLIC_SITE_URL=            # Site URL for checkout success/cancel redirects
```

### Debug Scripts (Run from project root)
**Essential Testing & Debugging:**
- `debug-rag-system.js` - Test vector search and context retrieval
- `check-ai-config.js` - Validate AI configuration setup
- `manage-user-plans.js` - Admin tool for managing user subscriptions and billing
- `check-user-plan.js` - Verify individual user subscription status
- `find-users.js` - Get actual user IDs for testing
- `debug-lemonsqueezy-checkout.js` - Test LemonSqueezy checkout URL generation

**Knowledge Base & RAG:**
- `examine-knowledge.js` - Analyze knowledge base content
- `debug-knowledge-chunks.js` - Debug PDF processing and chunking
- `test-rag-fixes.js` - Test RAG configuration and context retrieval
- `check-pdf-items.js` - Debug PDF processing and chunking

**Specialized Tools:**
- `create-admin.js` - Create admin user accounts
- `test-arabic-support.js` - Test Arabic language detection and responses
- `final-google-oauth-onboarding-verification.js` - Verify OAuth onboarding flow

### Windows Environment Notes
- Use PowerShell as the default shell when running terminal commands
- Debug scripts are Node.js files, run with `node script-name.js`
- File paths use backslashes in Windows but forward slashes work in most contexts
- All debug scripts use CommonJS (require/module.exports) pattern
- Environment variables must be accessible from project root for debug scripts

## 📋 Project-Specific Patterns

### 1. AI Configuration Enforcement
- **All AI operations require admin setup** via `getAIConfiguration()` in `/src/lib/gemini.ts`
- System will throw errors if `AIConfiguration` table is empty or incomplete
- Admin must configure prompts, model parameters, and feature flags via `/admin` page
- Uses singleton pattern: single row with `id: 'singleton'` in database
- **Available models**: Latest Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash models with tiered access (FREE/PRO)
- **Model selection**: Admin can choose from dropdown with descriptions (speed vs accuracy trade-offs)

### 2. RAG System Architecture (`/src/lib/vector-search.ts`)
```typescript
// Vector embeddings stored as JSON strings (pgvector migration pending)
// Hybrid search: semantic similarity + keyword matching
await fetchRelevantKnowledge(queryEmbedding, topK, highRelevanceThreshold)
```
- Uses Gemini text-embedding-004 model (768 dimensions)
- Chunking strategy: 512 chars with 100 char overlap for fitness content
- Search combines cosine similarity + exact keyword matching
- **IMPORTANT**: AI context is clean (no titles/sources) - use `getContextSources()` for UI article links
- **Configurable RAG parameters**: Similarity threshold, max chunks, high relevance threshold via admin settings

### 3. Client Memory Auto-Extraction (`/src/lib/client-memory.ts`)
```typescript
// AI automatically extracts user information from chat messages  
await updateClientMemory(userId, memoryUpdate)
// Function calling approach with 50+ structured profile fields
const memorySummary = await generateMemorySummary(userId)
```
- AI automatically extracts user information from chat messages via Gemini function calling
- Structured storage in `ClientMemory` table with 50+ profile fields
- Includes training history, goals, limitations, preferences, sleep patterns
- **Training Structure Support**: Handles both weekly (1-7 days/week) and cycle-based patterns (1 on/1 off, 2 on/1 off, custom cycles)

### 4. API Route Patterns (`/src/app/api/*/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Auth required for chat operations (no guest mode)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
    }
    
    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type');
    let body, imageFile;
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = { message: formData.get('message') as string };
      imageFile = formData.get('image') as File;
    } else {
      body = await request.json();
    }
    
    // Validate, process, return
    // ...
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
```
- Always use `ApiErrorHandler.createContext(request)` for structured logging
- Handle both JSON and FormData (for image uploads) in POST routes
- User authentication via `createClient()` from `@/lib/supabase/server`
- Structure: validate → authenticate → process → return with error handling
- **Authentication Required**: Return 401 for unauthenticated users (no guest mode)
- **Content-Type Detection**: Use `request.headers.get('content-type')` to handle multipart vs JSON

### 7. Internationalization & Arabic Support
```typescript
// Full i18n support with locale routing and translations
import { useTranslations, useLocale } from 'next-intl';
import { isArabicText, getTextDirection } from '@/lib/text-formatting';

const t = useTranslations('ChatPage');
const locale = useLocale();
const direction = getTextDirection(text); // Automatic RTL/LTR detection
```
- Language files: `messages/en.json`, `messages/ar.json`, `messages/fr.json`
- Automatic Arabic detection via `isArabicText()` function (30% threshold)
- Arabic-aware input components: `arabic-aware-input.tsx`, `arabic-aware-textarea.tsx`
- RTL/LTR text direction handling with mixed content support
- Dynamic locale switching with URL preservation

### 8. Database Schema & Operations (`/prisma/schema.prisma`)
```typescript
// Core data models with specific relationships
model User {
  plan: UserPlan @default(FREE)
  hasCompletedOnboarding: Boolean @default(false)
  messagesUsedToday: Int @default(0)
  lastMessageReset: DateTime @default(now())
  clientMemory: ClientMemory?
  subscription: Subscription?
}

model AIConfiguration {
  id: String @id @default("singleton") // Singleton pattern
  ragSimilarityThreshold: Float @default(0.1)
  ragMaxChunks: Int @default(17)
  freeModelName: String @default("gemini-2.5-flash")
  proModelName: String @default("gemini-2.5-pro")
}
```
- Use `@/lib/prisma` for database client (single instance with query logging)
- Cascade deletes: `KnowledgeChunk` → `KnowledgeItem`, `Message` → `Chat`
- Include patterns: Always include related data needed for UI in single queries
- Transaction usage: Wrap multi-table operations in `prisma.$transaction()`
- **Schema cleanup**: Removed unused `Profile` and `Document` tables

### 9. File Processing Pipeline (`/src/lib/enhanced-file-processor.ts`)
```typescript
// Process → Chunk → Embed → Store workflow
await processFileWithEmbeddings(buffer, mimeType, fileName, knowledgeItemId)
// Creates KnowledgeChunk records with embeddings and proper indexing
```
- Supports PDF, DOC/DOCX, TXT, MD via `mammoth`, `pdf-parse` libraries
- Fitness-specific chunking with 512 chars + 100 char overlap for context preservation
- Title prefixing: `${title}\n\n${content}` for better embedding context
- Automatic embedding generation with Gemini text-embedding-004 model

### 10. Chat System Architecture (`/src/app/[locale]/chat/page.tsx`)
```typescript
// Uses Vercel AI SDK useChat hook for robust state management
const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  api: '/api/chat',
  body: { conversationId, isGuest: !user },
  onFinish: (message) => {
    // Handle conversation ID from response headers
    if (serverData?.conversationId) {
      setConversationId(serverData.conversationId);
      window.history.replaceState(null, '', `/${locale}/chat?id=${serverData.conversationId}`);
    }
  }
});
```
- **State Management**: Uses AI SDK's built-in state instead of custom React state
- **Conversation Flow**: New chats get ID from first response, URL updates automatically
- **Image Support**: FormData handling for multipart uploads with multiple images
- **Error Handling**: Structured error responses with toast notifications
- **Authentication Gate**: Users must login before sending any messages

## 🔧 Key Integration Points

### Supabase Auth Middleware (`/src/middleware.ts`)
- Automatic session refresh for all protected routes using createServerClient
- Cookie-based authentication state management with SSR support
- Handles auth state without blocking user navigation
- Admin route protection: redirects unauthenticated users to login
- Integrates with next-intl for internationalized route handling

### Error Handling (`/src/lib/error-handler.ts`)
- Centralized `ApiErrorHandler` with request context tracking
- Structured logging with correlation IDs for debugging
- Validates files, auth states, and request bodies with typed errors
- Uses `AppError` class with specific error types (VALIDATION, AUTHENTICATION, etc.)

### API Route Patterns (`/src/app/api/*/route.ts`)
- Always use `ApiErrorHandler.createContext(request)` for logging
- Handle both JSON and FormData (for image uploads) in POST routes
- User authentication via `createClient()` from `@/lib/supabase/server`
- Structure: validate → authenticate → process → return with error handling
- Use try-catch with structured error responses
- **Authentication Required**: All chat operations require login (no guest mode)
- **Content-Type Detection**: Use `request.headers.get('content-type')` to handle multipart vs JSON

### API Route Example Pattern
```typescript
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Authentication required for all chat operations
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
    }
    
    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type');
    let body, imageFile;
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = { message: formData.get('message') as string };
      imageFile = formData.get('image') as File;
    } else {
      body = await request.json();
    }
    
    // Validate, process, return
    // ...
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
```

### Component Patterns
- **Arabic-aware components**: Use `arabic-aware-input.tsx`, `arabic-aware-textarea.tsx` for proper RTL support
- **Plan badges**: Use `PlanBadge` component with `UserPlan` enum (FREE/PRO)
- **Subscription UI**: `UpgradeButton` handles Lemon Squeezy checkout flow
- **Theme support**: All components support dark/light mode via `next-themes`
- **Text Direction**: Use `getTextDirection()` from `@/lib/text-formatting` for mixed Arabic/English content
- **Client-Only Wrapping**: Use `ClientOnly` wrapper for components with hydration issues
- **Authentication State**: Use `createClient()` from `@/lib/supabase/client` for client-side auth

### Error Handling Integration
- Import `AppError`, `ValidationError`, `AuthenticationError` from `@/lib/error-handler`
- Use `ApiErrorHandler.validateFile()` for file uploads with size/type constraints
- Wrap API routes with `ApiErrorHandler.handleError(error, context)` in catch blocks
- Error types: `VALIDATION`, `AUTHENTICATION`, `AUTHORIZATION`, `NOT_FOUND`, `RATE_LIMIT`

### Database Schema Highlights (`/prisma/schema.prisma`)
- `KnowledgeChunk` - Chunked content with embeddings (chunkIndex for ordering)
- `ClientMemory` - Comprehensive user profiling (50+ fields covering fitness data)
- `AIConfiguration` - Single-row config table (`id: 'singleton'`) for system behavior
  - **NEW**: RAG configuration fields (`ragSimilarityThreshold`, `ragMaxChunks`, `ragHighRelevanceThreshold`)
- `User.hasCompletedOnboarding` - Tracks onboarding completion for user flow
- `User.plan` - Subscription tier (FREE/PRO) with message tracking
- `User.uploadsThisMonth` / `lastUploadReset` - Monthly upload tracking for free tier limits
- `Subscription` - Lemon Squeezy integration with billing periods and variants
- `Message.imageData` - Base64 encoded image storage with `imageMimeType`
- `ProcessingStatus` - Tracks file processing states (`PROCESSING`, `READY`, `FAILED`)

### Database Operation Patterns
- Use `@/lib/prisma` for database client (single instance with query logging)
- Cascade deletes: `KnowledgeChunk` → `KnowledgeItem`, `Message` → `Chat`
- Include patterns: Always include related data needed for UI in single queries
- Transaction usage: Wrap multi-table operations in `prisma.$transaction()`
- **Schema cleanup**: Removed unused `Profile` and `Document` tables (replaced by `ClientMemory` and `KnowledgeChunk`)

### Tech Stack Essentials
- **Framework**: Next.js 15 with App Router and Server Components
- **Database**: PostgreSQL with Prisma ORM (vector embeddings as JSON, pgvector migration pending)
- **AI/ML**: Google Gemini API (`text-embedding-004` model, 768 dimensions)
- **Authentication**: Supabase SSR with role-based access control
- **UI**: Tailwind CSS + shadcn/ui components with `next-themes` dark mode
- **File Processing**: `mammoth` (DOC), `pdf-parse` (PDF), `@tiptap/react` (rich text)
- **Payments**: Lemon Squeezy webhook integration with same-tab checkout flow
- **Chat**: Vercel AI SDK `useChat` hook for state management
- **Development**: TypeScript, ESLint, Prisma Studio for DB management
- **Internationalization**: next-intl with Arabic RTL support and dynamic locale detection
- **Animation**: Framer Motion for glassmorphism UI and smooth transitions
- **Analytics**: Vercel Analytics for performance tracking

## 🎯 Testing & Debugging

### Manual Testing Scripts
- Run debug scripts from project root (not src/)
- Use `find-users.js` to get actual user IDs for testing
- Test knowledge base with `knowledge-test.js`
- Check PDF processing with `check-pdf-items.js`
- Verify Google OAuth onboarding with `final-google-oauth-onboarding-verification.js`

### Debug Script Architecture
```javascript
// All debug scripts use CommonJS (require/module.exports)
const { PrismaClient } = require('@prisma/client');
const { functionName } = require('./src/lib/module-name');
// Execute from project root: node debug-script-name.js
```

### Development Environment Setup
- **Database**: PostgreSQL with connection pooling via Prisma
- **Local Development**: `npm run dev` or `npm run dev:turbo` (faster with turbopack)
- **Build Process**: `npm run build` includes Prisma client generation
- **Environment**: Windows PowerShell default - use forward slashes in paths
- **Debugging**: VS Code with Prisma extension for schema management

### Common Issues
- **"AI Configuration not found"** → Run `/admin` setup first
- **Empty knowledge responses** → Check vector embeddings with debug scripts
- **Hydration mismatches** → Use `ClientOnly` wrapper for dynamic content
- **Auth issues during onboarding** → Check `hasCompletedOnboarding` flag in User table
- **Arabic text rendering issues** → Verify `isArabicText()` detection and direction handling
- **Subscription plan issues** → Use `check-user-plan.js` to verify billing status
- **PDF processing failures** → Check `check-pdf-items.js` for chunking issues
- **Lemon Squeezy webhook errors** → Verify environment variables and webhook URL configuration
- **Checkout URL generation fails** → Check product/variant IDs in `debug-lemonsqueezy-checkout.js`
- **Currency conversion errors** → Multi-currency support handles rate limiting gracefully
- **Message limit not enforcing** → Check daily reset logic and database `messagesUsedToday`
- **Guest user trying to chat** → Returns 401, login dialog should appear immediately
- **Chat not creating new conversation ID** → Check API response headers and `onFinish` handler
- **Vector search performance issues** → Verify batch processing (100-chunk batches) is working
- **Middleware conflicts** → Ensure Supabase auth and next-intl middleware are properly chained
- **Build failures** → Run `npm run postinstall` to regenerate Prisma client

## 📝 File Naming Conventions

- `/src/app/api/*/route.ts` - API endpoints
- `/src/components/ui/` - shadcn/ui components  
- `/src/components/arabic-aware-*.tsx` - Arabic language support components
- `/debug-*.js` - Root-level debugging utilities
- `*-test.js` - Manual testing scripts
- `check-*.js` - Validation and verification scripts

### 🗂️ Key Directory Structure
```
src/
├── app/
│   ├── [locale]/               # Internationalized routes
│   │   ├── chat/              # Main chat interface
│   │   ├── knowledge/         # Knowledge base management
│   │   ├── admin/             # Admin configuration panel
│   │   └── onboarding/        # User onboarding flow
│   └── api/                   # Next.js API routes
│       ├── chat/              # Chat processing endpoint
│       ├── knowledge/         # Knowledge CRUD operations
│       ├── auth/              # Authentication routes
│       └── webhooks/          # External service webhooks
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── arabic-aware-*.tsx     # RTL-aware input components
│   ├── chat/                  # Chat-specific UI components
│   ├── knowledge/             # Knowledge management UI
│   └── plan-badge.tsx         # Subscription plan indicators
├── lib/
│   ├── gemini.ts              # Core AI integration
│   ├── vector-search.ts       # RAG system implementation
│   ├── client-memory.ts       # User profiling system
│   ├── subscription.ts        # Plan management logic
│   ├── error-handler.ts       # Centralized error handling
│   ├── supabase/             # Authentication utilities
│   └── utils/                # Helper functions
└── prisma/
    └── schema.prisma          # Database schema definition
```

**Navigation Tips**: Admin features (`/src/app/admin/`), Core AI logic (`/src/lib/gemini.ts`), Vector operations (`/src/lib/vector-search.ts`), Subscription system (`/src/lib/subscription.ts`, `/src/lib/lemonsqueezy.ts`, `/src/components/plan-badge.tsx`, `/src/components/upgrade-button.tsx`), Arabic support (`/src/components/arabic-aware-*.tsx`, `/src/lib/text-formatting.ts`), Error handling (`/src/lib/error-handler.ts` with `ApiErrorHandler` class), Client memory (`/src/lib/client-memory.ts` for automatic user profile extraction), Multi-currency support (`/src/lib/currency.ts`), Webhook processing (`/src/app/api/webhooks/lemon-squeezy/route.ts`)

## 💳 Subscription System Details

### Current Pricing Structure (USD)
- **FREE Plan**: 15 messages/day, 5 uploads/month, max 10MB files, 10 knowledge items
- **PRO Plan Monthly**: $9/month - Unlimited messages, unlimited uploads, max 100MB files, unlimited knowledge items  
- **PRO Plan Yearly**: $90/year (10 months pricing) - Same features as monthly

### LemonSqueezy Integration
- **Same Product ID**: Both monthly and yearly use the same product ID but different variant IDs
- **Pre-created Checkout URLs**: Uses direct checkout URLs instead of dynamic API creation
- **Same-Tab Checkout**: Redirects in same tab to avoid popup blocker issues
- **Webhook Events**: Handles `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_payment_success`
- **Custom Data**: Passes user ID through checkout custom data for webhook processing
- **Success Flow**: Redirects to `/checkout/success` after payment completion

### Subscription Enforcement
- **Server-Side Validation**: All limits enforced in API routes with HTTP 429 responses
- **Daily Reset**: Message counts reset at midnight via `lastMessageReset` field
- **Monthly Reset**: Upload counts reset monthly via `lastUploadReset` field
- **Plan Checking**: Use `getUserPlan()` and `canUserSendMessage()` functions

````
