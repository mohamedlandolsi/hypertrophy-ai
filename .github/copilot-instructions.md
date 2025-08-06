# HypertroQ - AI Fitness Coach Development Guide

## 🏗️ Architecture Overview

**HypertroQ** is a sophisticated RAG-powered AI fitness coaching platform built with Next.js 15 App Router, featuring personalized client memory, multilingual support, and subscription management.

### Critical System Requirements
- **Admin-Only AI Operations**: All AI functionality requires admin configuration via singleton `AIConfiguration` table - system will fail if not configured
- **Authentication Gate**: Users must login before sending messages (no guest mode)
- **Subscription Enforcement**: Server-side validation with daily/monthly limits enforced in API routes
- **Vector Storage**: Embeddings stored as JSON strings (768 dimensions via Gemini text-embedding-004)

### Core Components
- **RAG System**: Optimized pgvector + AND-based keyword search (`/src/lib/vector-search.ts`)
- **Client Memory**: AI auto-extracts user data via Gemini function calling (`/src/lib/client-memory.ts`)
- **Authentication**: Supabase SSR with role-based access (`/src/lib/supabase/server.ts`)
- **File Processing**: Multi-format pipeline with semantic chunking (`/src/lib/enhanced-file-processor.ts`)
- **Error Handling**: Centralized `ApiErrorHandler` with correlation IDs (`/src/lib/error-handler.ts`)
- **Internationalization**: Arabic RTL + French/English with automatic detection (`/src/lib/text-formatting.ts`)

## 🔧 RAG Pipeline Performance Fixes

### Critical Retrieval Improvements
- **Eliminated Batch Limits**: pgvector SQL searches full database, not batched JSON fallback
- **AND-Based Keywords**: PostgreSQL full-text search with `&` logic for precision 
- **Query Translation Fix**: Non-English queries translated to English for vector search compatibility
- **Simplified Pipeline**: Disabled multi-query/hybrid for reliability and speed
- **Performance**: <1000ms retrieval time, searches all chunks simultaneously

### Multi-Language RAG Support
```typescript
// CRITICAL: Knowledge base is in English, queries may be Arabic/French
// System automatically translates for vector search, responds in original language

// Arabic query: "أعطيني تمارين" 
// → Translates to: "give me exercises"
// → Searches English knowledge base
// → Responds in Arabic with retrieved context

if (isArabic) {
  userQuery = await translateQueryToEnglish(originalQuery, 'arabic');
}
```

### Usage Pattern
```typescript
// 1. Use efficient vector search for semantic matching
const vectorResults = await fetchRelevantKnowledge(embedding, 10, 0.3);

// 2. Use AND keyword search for exact term matching  
const keywordResults = await performAndKeywordSearch(query, 10);

// 3. Combine results as needed (avoid complex hybrid for now)
const combined = [...vectorResults, ...keywordResults];
```

## 🚀 Essential Development Workflows

### Critical Commands
```bash
npm run dev              # Development server
npm run dev:turbo        # Development with turbopack (faster builds)
npm run build           # Prisma generate + Next.js production build
npx prisma migrate dev  # Apply schema changes with migration name
npx prisma studio       # Visual database browser
npm run postinstall     # Generate Prisma client (auto-run after install)
```

### Must-Have Environment Variables
```bash
# Core Services (Required)
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public key for client-side
SUPABASE_SERVICE_ROLE_KEY=       # Server-side admin operations
GEMINI_API_KEY=                  # Google Gemini API for AI/embeddings
DATABASE_URL=                    # PostgreSQL connection string
DIRECT_URL=                      # Direct DB connection (for migrations)

# Subscription System (LemonSqueezy)
LEMONSQUEEZY_API_KEY=            # API key for payment processing
LEMONSQUEEZY_STORE_ID=           # Store identifier
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=    # Monthly subscription variant
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=     # Yearly subscription variant  
LEMONSQUEEZY_WEBHOOK_SECRET=     # Webhook signature verification
NEXT_PUBLIC_SITE_URL=            # Site URL for checkout redirects
```

### Essential Debug Scripts (Run from project root)
- `check-ai-config.js` - Validate AI configuration setup (run this first!)
- `debug-rag-system.js` - Test vector search and context retrieval
- `find-users.js` - Get actual user IDs for testing
- `create-admin.js` - Create admin user accounts
- `check-user-plan.js` - Verify individual user subscription status

## 📋 Critical Project Patterns

### 1. AI Configuration Enforcement (REQUIRED FOR SYSTEM TO WORK)
```typescript
// All AI operations require admin setup via getAIConfiguration() in /src/lib/gemini.ts
const config = await getAIConfiguration(userPlan); // Throws if not configured
```
- **First-time setup**: Visit `/admin/settings` to configure AI system prompts and models
- **Admin access required**: Only users with `role: 'admin'` can configure the system
- **Singleton pattern**: Single row with `id: 'singleton'` in `AIConfiguration` table
- **No fallbacks**: System will fail if configuration is missing (by design)

### 2. API Route Authentication Pattern
```typescript
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // ALWAYS authenticate first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please log in to send messages' },
        { status: 401 }
      );
    }
    
    // Handle both JSON and FormData (for image uploads)
    const contentType = request.headers.get('content-type');
    let body, imageFile;
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = { message: formData.get('message') as string };
      imageFile = formData.get('image') as File;
    } else {
      body = await request.json();
    }
    
    // Your logic here
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
```

### 3. Database Operations with Prisma
```typescript
import { prisma } from '@/lib/prisma'; // Use this singleton instance

// Always include related data in single queries
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    clientMemory: true,
    chats: { take: 10, orderBy: { createdAt: 'desc' } },
    subscription: true
  }
});

// Use transactions for multi-table operations
await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { plan: 'PRO' } }),
  prisma.subscription.create({ data: subscriptionData })
]);
```

### 4. Vector Search & RAG System
```typescript
// OPTIMIZED RAG: Uses efficient pgvector SQL, no batch limits
import { fetchRelevantKnowledge, performAndKeywordSearch } from '@/lib/vector-search';

// Vector search - efficient pgvector with full database coverage
const vectorResults = await fetchRelevantKnowledge(
  queryEmbedding.embedding, 
  topK: 10,           // Configurable via admin
  threshold: 0.3      // Configurable via admin
);

// AND-based keyword search for precision
const keywordResults = await performAndKeywordSearch(query, 10);

// CRITICAL: AI context is clean (no titles/sources)
// Use getContextSources() for UI article links
```

### 5. Subscription Plan Enforcement
```typescript
import { getUserPlan, canUserSendMessage } from '@/lib/subscription';

// Check limits before processing
const { plan, messagesUsedToday } = await getUserPlan(userId);
const canSend = await canUserSendMessage(userId);

if (!canSend) {
  return NextResponse.json(
    { error: 'Daily message limit reached' },
    { status: 429 }
  );
}
```

## 🔧 Key Integration Points

### Supabase Authentication & Middleware
```typescript
// Server-side auth in API routes
import { createClient } from '@/lib/supabase/server';

// Client-side auth in components
import { createClient } from '@/lib/supabase/client';

// Admin operations (service role)
import { createAdminClient } from '@/lib/supabase/server';
```
- **Middleware**: Automatic session refresh, admin route protection at `/src/middleware.ts`
- **Role-based access**: `User.role` field controls admin access (`'admin'` | `'user'`)
- **No guest mode**: All chat operations require authenticated users

### Arabic & Internationalization
```typescript
// Language detection and direction handling
import { isArabicText, getTextDirection } from '@/lib/text-formatting';

const direction = getTextDirection(text); // 'rtl' | 'ltr'
const isArabic = isArabicText(text); // 30% Arabic characters threshold
```
- **Dynamic locale routing**: `/[locale]/` prefix for all pages
- **Arabic-aware components**: Use `arabic-aware-input.tsx` for proper RTL support
- **Language files**: `messages/{en,ar,fr}.json` for translations

### Error Handling Pattern
```typescript
import { ApiErrorHandler, AppError, ValidationError } from '@/lib/error-handler';

// In API routes - ALWAYS use this pattern
const context = ApiErrorHandler.createContext(request);
try {
  // Your logic
} catch (error) {
  return ApiErrorHandler.handleError(error, context);
}

// Throw typed errors
throw new ValidationError('Invalid file size');
throw new AuthenticationError('User must be logged in');
```

### Database Schema Highlights
- **AIConfiguration**: Singleton table (`id: 'singleton'`) controlling all AI behavior
- **ClientMemory**: 50+ fields for comprehensive user profiling via AI extraction
- **KnowledgeChunk**: Chunked content with JSON embeddings (768 dimensions)
- **User.plan**: `FREE` | `PRO` with usage tracking fields
- **Cascade deletes**: Proper cleanup when removing parent records

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
