# HypertroQ - AI Fitness Coach Development Guide

## 🏗️ Architecture Overview

**HypertroQ** is a sophisticated RAG-powered AI fitness coaching platform built with Next.js 15 App Router, featuring personalized client memory, multilingual support, subscription management, and advanced performance optimizations.

### Critical System Requirements
- **Admin-Only AI Operations**: All AI functionality requires admin configuration via singleton `AIConfiguration` table - system will fail if not configured
- **Authentication Gate**: Users must login before sending messages (no guest mode)
- **Subscription Enforcement**: Server-side validation with daily/monthly limits enforced in API routes
- **Vector Storage**: Embeddings stored as JSON strings (768 dimensions via Gemini text-embedding-004)
- **Performance-First**: Optimized for <2s page loads with advanced caching and component optimization
- **Next.js 15 + React 19**: Latest versions with App Router, Server Components, and React concurrent features
- **PostgreSQL + pgvector**: Advanced vector similarity search with full-text search integration
- **Edge Runtime Compatibility**: Middleware and API routes designed for Vercel Edge Runtime limitations

### Core Components
- **RAG System**: Optimized pgvector + AND-based keyword search (`/src/lib/vector-search.ts`)
- **Client Memory**: AI auto-extracts user data via Gemini function calling (`/src/lib/client-memory.ts`)
- **Authentication**: Supabase SSR with role-based access (`/src/lib/supabase/server.ts`)
- **File Processing**: Serverless pipeline with Supabase Storage (`/src/lib/enhanced-file-processor.ts`)
- **Error Handling**: Centralized `ApiErrorHandler` with correlation IDs (`/src/lib/error-handler.ts`)
- **Internationalization**: Arabic RTL + French/English with automatic detection (`/src/lib/text-formatting.ts`)
- **Performance Layer**: Smart caching, memoization, and lazy loading (`/src/hooks/use-optimized-*`)
- **Subscription System**: LemonSqueezy integration with webhook processing (`/src/lib/lemonsqueezy.ts`)

### Tech Stack & Dependencies
- **Framework**: Next.js 15.3.3 with App Router and Turbopack support
- **Database**: PostgreSQL with Prisma ORM (v6.9.0) and pgvector extension
- **Authentication**: Supabase SSR (v0.6.1) with role-based access control
- **AI/ML**: Google Gemini API (v0.24.1) for chat and embeddings
- **UI**: Radix UI + Tailwind CSS + shadcn/ui components
- **Payments**: LemonSqueezy for subscription management
# Copilot instructions — Hypertrophy AI (concise)

This file gives AI coding agents the minimum, high-value project knowledge needed to be productive immediately.

Key assumptions for agents
- Repo uses Next.js (App Router) + TypeScript, Prisma + PostgreSQL (pgvector) and Supabase for auth/storage.
- AI features are gated by an admin `AIConfiguration` singleton — many flows will throw if it is missing.

Quick checklist for any edit
- Verify `AIConfiguration` usage in `src/lib/gemini.ts` before changing AI flows.
- When touching DB schema run: `npm run postinstall` then `npx prisma migrate dev` (dev DB only).
- Run `npm run lint` and `npm run build` after changes; debug scripts live at repo root (e.g. `check-ai-config.js`).

Important files & patterns (open these first)
- `src/lib/gemini.ts` — central AI integration; calls getAIConfiguration(), embeddings, chat generation.
- `src/lib/vector-search.ts` — RAG retrieval (pgvector + AND-keyword search). Use `fetchRelevantKnowledge` and `performAndKeywordSearch`.
- `src/lib/client-memory.ts` — user memory extraction and JSON repair heuristics.
- `src/lib/subscription.ts` & `src/lib/lemonsqueezy.ts` — server-side usage limits and payment webhook handling.
- `src/lib/supabase/*` — server & client Supabase helpers; API routes expect SSR auth (`createClient()` patterns).
- `src/app/[locale]/` — i18n App Router layout; Arabic RTL support handled by `src/lib/text-formatting.ts`.
- `prisma/schema.prisma` — single-row `AIConfiguration` and `User.freeMessagesRemaining` behavior are important conventions.

Concrete, repo-specific rules for agents
- Do not introduce guest chat flows — authentication is enforced in API routes. See pattern in API route handlers that call `createClient()` then `supabase.auth.getUser()`.
- AI behavior: code must preserve the admin-only singleton check (throwing on missing config is intentional).
- Embeddings are stored as JSON arrays (768 dims). When generating/updating embeddings use existing helpers in `src/lib/gemini.ts`/`src/lib/vector-search.ts`.
- Middleware and API routes aim for Edge runtime compatibility—avoid Node-only APIs in those files (`src/middleware.ts`, `src/app/api/*/route.ts`).

Commands & quick scripts
- Dev server: `npm run dev` (or `npm run dev:turbo` for turbopack).
- Build: `npm run build` (runs Prisma generate + Next build).
- Prisma dev: `npx prisma migrate dev` and view DB: `npx prisma studio`.
- Postinstall (important after package changes or Prisma edits): `npm run postinstall`.
- Helpful debug scripts (repo root): `check-ai-config.js`, `debug-rag-system.js`, `test-ai-integration.js`.

Examples to follow
- Vector search usage: call `fetchRelevantKnowledge(queryEmbedding.embedding, topK, threshold)` — thresholds controlled by AIConfiguration.
- Keyword AND search: `performAndKeywordSearch(query, 10)` and merge results with vector hits; avoid complex hybrid searches.

When changing public behavior
- Add or update small tests or a debug script replicating the flow (e.g., a debug file under repo root). Run it and commit it with the change.

If you need more context
- Open `src/lib/*` first. If AI fails at runtime, check `AIConfiguration` in the DB and run `node check-ai-config.js`.

Feedback requested
- Tell me which section feels incomplete or which file you'd like a short example for, and I'll iterate.

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

### 4. Database Operations with Prisma
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

### 5. Vector Search & RAG System
```typescript
// OPTIMIZED RAG: Uses efficient pgvector SQL, no batch limits
import { fetchRelevantKnowledge, performAndKeywordSearch } from '@/lib/vector-search';

// Vector search - efficient pgvector with full database coverage
const vectorResults = await fetchRelevantKnowledge(
  queryEmbedding.embedding, 
  topK: 10,           // Configurable via admin
  threshold: 0.05     // Configurable via admin (recommended: 0.05-0.1)
);

// AND-based keyword search for precision
const keywordResults = await performAndKeywordSearch(query, 10);

// CRITICAL: AI context is clean (no titles/sources)
// Use getContextSources() for UI article links
```

### 6. Performance Optimization Pattern
```typescript
// Use optimized hooks for chat performance
import { 
  useOptimizedChatHistory, 
  useOptimizedUserPlan, 
  useOptimizedUserRole 
} from '@/hooks/use-optimized-fetch';
import { OptimizedMessage } from '@/components/optimized-message';
import { OptimizedImage } from '@/components/optimized-image';

// Smart caching with TTL
const { data, loading, error } = useOptimizedChatHistory(page, limit);

// Memoized components for performance
const MessageComponent = React.memo(OptimizedMessage, (prev, next) => 
  prev.message.id === next.message.id && prev.message.content === next.message.content
);
```

### 7. Subscription Plan Enforcement
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

### 8. Internationalization & Routing Patterns
```typescript
// Dynamic locale routing with middleware
// Structure: /[locale]/page → /en/chat, /ar/chat, /fr/chat
// Middleware handles automatic locale detection and admin route protection

// Arabic text detection and RTL support
import { isArabicText, getTextDirection } from '@/lib/text-formatting';
const direction = getTextDirection(text); // 'rtl' | 'ltr'
const isArabic = isArabicText(text); // 30% Arabic characters threshold

// Use arabic-aware components for proper RTL support
import { ArabicAwareInput } from '@/components/arabic-aware-input';
import { ArabicAwareTextarea } from '@/components/arabic-aware-textarea';
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

### Serverless File Processing
```typescript
// Direct uploads to Supabase Storage, no server memory usage
const uploadUrl = await getSignedUploadUrl(fileName, contentType, userId);
// Process files from storage, not server filesystem
const fileContent = await downloadFromStorage(filePath);
```
- **Scalable**: No memory limits, handles large files via Supabase Storage
- **Bucket Structure**: User-specific folders with RLS policies
- **Processing Pipeline**: Text extraction → chunking → embedding generation → database storage

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
- **Performance indexes**: Optimized queries for vector search and pagination

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

### Performance Testing & Optimization
- **Performance Scripts**: Use `test-performance-optimizations.js` to validate system performance
- **Chat Optimizations**: Comprehensive performance layer with memoized components (`/src/components/optimized-*`)
- **Bundle Analysis**: `npx @next/bundle-analyzer` to monitor chunk sizes
- **Database Optimization**: Connection pooling settings in `.env` for scalability

### Common Issues
- **"AI Configuration not found"** → Run `/admin/settings` setup first
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
- **Maintenance mode not working** → Set both `MAINTENANCE_MODE` and `NEXT_PUBLIC_MAINTENANCE_MODE` environment variables
- **Edge Runtime compatibility** → Avoid Node.js specific APIs in middleware and API routes

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

**Navigation Tips**: Admin features (`/src/app/admin/`), Core AI logic (`/src/lib/gemini.ts`), Vector operations (`/src/lib/vector-search.ts`), Subscription system (`/src/lib/subscription.ts`, `/src/lib/lemonsqueezy.ts`, `/src/components/plan-badge.tsx`, `/src/components/upgrade-button.tsx`), Arabic support (`/src/components/arabic-aware-*.tsx`, `/src/lib/text-formatting.ts`), Error handling (`/src/lib/error-handler.ts` with `ApiErrorHandler` class), Client memory (`/src/lib/client-memory.ts` for automatic user profile extraction), Multi-currency support (`/src/lib/currency.ts`), Webhook processing (`/src/app/api/webhooks/lemon-squeezy/route.ts`), Performance optimizations (`/src/hooks/use-optimized-*`, `/src/components/optimized-*`)

## 💳 Subscription System Details

### Maintenance Mode System
```typescript
// Global maintenance mode with admin bypass
// Check src/app/maintenance/page.tsx for maintenance page
// Admin users can still access the system during maintenance
// Controlled via environment variable MAINTENANCE_MODE=true
// IMPORTANT: Must set both MAINTENANCE_MODE and NEXT_PUBLIC_MAINTENANCE_MODE
// Client-side components use NEXT_PUBLIC_MAINTENANCE_MODE
// API routes use MAINTENANCE_MODE (server-side)
```

### Free Messages System (NEW!)
```typescript
// New users get 15 free messages before daily limits kick in
const { freeMessagesRemaining, messagesUsedToday } = await getUserPlan();

// Free messages are consumed first, then daily limits apply
if (freeMessagesRemaining > 0) {
  // Use free message
  await prisma.user.update({
    where: { id: userId },
    data: { freeMessagesRemaining: { decrement: 1 } }
  });
} else {
  // Use daily message (for FREE users only)
  await prisma.user.update({
    where: { id: userId },
    data: { messagesUsedToday: { increment: 1 } }
  });
}
```
- **New User Experience**: 15 free messages before daily limits
- **Existing Users**: All existing users granted 15 free messages (one-time)
- **UI Updates**: Message limit indicator shows free messages with green progress bar
- **Database Field**: `User.freeMessagesRemaining` (default: 15 for new users)

### Current Pricing Structure (USD)
- **FREE Plan**: 15 free messages + 5 messages/day thereafter, 5 uploads/month, max 10MB files, 10 knowledge items
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
- **Maintenance Mode**: Admin bypass during system maintenance periods

## 🎯 Development Best Practices

### Performance & Optimization
- Use `OptimizedMessage`, `OptimizedImage` components for chat performance
- Leverage `useOptimizedChatHistory`, `useOptimizedUserPlan` hooks for caching
- Implement memoization with React.memo for heavy components
- Use pgvector for efficient vector search (no batch limits)
- Monitor bundle size with `npx @next/bundle-analyzer`

### Error Handling & Debugging
- Always use `ApiErrorHandler.createContext()` and `ApiErrorHandler.handleError()` 
- Run debug scripts from project root to troubleshoot issues
- Check AI configuration first with `check-ai-config.js`
- Use correlation IDs for tracking request flows
- Test subscription flows with `debug-lemonsqueezy-checkout.js`

### Security & Authentication
- Implement middleware for route protection (`/src/middleware.ts`)
- Use role-based access control (`admin` vs `user` roles)
- Validate subscription limits server-side in all API endpoints
- Store sensitive configs in environment variables
- Use Supabase RLS policies for data isolation

### Code Organization
- Keep debug scripts in project root using CommonJS
- Follow `/src/app/[locale]/` structure for i18n routes
- Use TypeScript for all core logic with proper typing
- Maintain separation: UI components, business logic (`/lib`), API routes
- Document complex patterns in markdown files for future reference
