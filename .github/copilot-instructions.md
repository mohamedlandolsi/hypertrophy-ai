# HypertroQ - AI Fitness Coach Codebase Guide

## 🏗️ Architecture Overview

**HypertroQ** is a RAG-powered AI fitness coaching platform built with Next.js 15, featuring personalized client memory, multilingual support (Arabic/English), scientific knowledge base integration, and subscription-based access control.

### Core Components
- **RAG System**: Vector embeddings via Gemini + Prisma ORM with chunked knowledge storage
- **Client Memory**: Comprehensive user profiling with automatic information extraction from chat
- **AI Configuration**: Admin-controlled system prompts and model parameters (singleton pattern)
- **Authentication**: Supabase Auth with role-based access (user/admin) + onboarding flow
- **File Processing**: Multi-format support (PDF, DOC, TXT, MD) with semantic chunking
- **Subscription System**: FREE (15 msgs/day) vs PRO (unlimited) with Lemon Squeezy integration
- **Arabic Language Support**: Automatic detection with RTL/LTR handling and fitness terminology
- **Error Handling**: Centralized `ApiErrorHandler` with correlation IDs and structured logging

### Critical Architecture Decisions
- **Guest Mode Support**: Chat API handles both authenticated and guest users (no DB persistence for guests)
- **Singleton AI Config**: Single row configuration table prevents system usage without admin setup
- **Hybrid Search**: Vector similarity + keyword matching for better fitness content retrieval
- **Chunking Strategy**: 512 chars with 100 char overlap optimized for fitness/scientific content
- **Embedding Storage**: JSON strings (temporary) until pgvector migration - not efficient for large scale
- **Subscription Enforcement**: Server-side limits for messages, uploads, and knowledge items

## 🚀 Development Workflows

### Essential Build Commands
```bash
npm run dev              # Development server
npm run dev:turbo        # Development with turbopack (faster) 
npm run build           # Prisma generate + Next.js build
npm start               # Production server
npm run lint            # ESLint validation
npx prisma migrate dev  # Apply schema changes  
npx prisma studio       # Visual database browser
npm run postinstall     # Generate Prisma client (auto-run after install)
```

### Windows Environment Notes
- Use PowerShell as the default shell when running terminal commands
- Debug scripts are Node.js files, run with `node script-name.js`
- File paths use backslashes in Windows but forward slashes work in most contexts

### Debug Scripts (Run from root, not src/)
**Essential Testing & Debugging:**
- `debug-rag-system.js` - Test vector search and context retrieval
- `check-ai-config.js` - Validate AI configuration setup
- `manage-user-plans.js` - Admin tool for managing user subscriptions and billing
- `check-user-plan.js` - Verify individual user subscription status
- `test-subscription-tiers.js` - Test subscription functionality end-to-end
- `find-users.js` - Get actual user IDs for testing

**Specialized Debugging:**
- `debug-users.js` - Inspect user data and permissions  
- `examine-knowledge.js` - Analyze knowledge base content
- `knowledge-test.js` - Test knowledge base functionality
- `create-admin.js` - Create admin user accounts
- `check-pdf-items.js` - Debug PDF processing and chunking
- `final-google-oauth-onboarding-verification.js` - Verify OAuth onboarding flow
- `test-arabic-support.js` - Test Arabic language detection and responses
- `debug-lemonsqueezy-checkout.js` - Test LemonSqueezy payment integration
- `test-rag-fixes.js` - Test RAG configuration and context retrieval without titles

### Critical Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public key for client-side
SUPABASE_SERVICE_ROLE_KEY=       # Server-side admin operations
GEMINI_API_KEY=                  # Google Gemini API for AI/embeddings
DATABASE_URL=                    # PostgreSQL connection string
DIRECT_URL=                      # Direct DB connection (for migrations)

# Subscription System (Lemon Squeezy)
LEMONSQUEEZY_API_KEY=            # API key for Lemon Squeezy
LEMONSQUEEZY_STORE_ID=           # Store ID for product management
LEMONSQUEEZY_PRO_MONTHLY_PRODUCT_ID=  # Monthly subscription product
LEMONSQUEEZY_PRO_YEARLY_PRODUCT_ID=   # Yearly subscription product
LEMONSQUEEZY_WEBHOOK_SECRET=     # Webhook signature verification
```

## 📋 Project-Specific Patterns

### 1. AI Configuration Enforcement
- **All AI operations require admin setup** via `getAIConfiguration()` in `/src/lib/gemini.ts`
- System will throw errors if `AIConfiguration` table is empty or incomplete
- Admin must configure prompts, model parameters, and feature flags via `/admin` page
- Uses singleton pattern: single row with `id: 'singleton'` in database

### 2. RAG System Architecture (`/src/lib/vector-search.ts`)
```typescript
// Vector embeddings stored as JSON strings (pgvector migration pending)
// Hybrid search: semantic similarity + keyword matching
await getRelevantContext(query, { userId, limit: 10, threshold: 0.7 })
```
- Uses Gemini text-embedding-004 model (768 dimensions)
- Chunking strategy: 512 chars with 100 char overlap for fitness content
- Search combines cosine similarity + exact keyword matching
- **IMPORTANT**: AI context is clean (no titles/sources) - use `getContextSources()` for UI article links
- **Configurable RAG parameters**: Similarity threshold, max chunks, high relevance threshold via admin settings

### 3. Client Memory Auto-Extraction (`/src/lib/client-memory.ts`)
- AI automatically extracts user information from chat messages  
- Call `updateClientMemory()` function for any personal data mentioned
- Structured storage in `ClientMemory` table with 50+ profile fields
- Includes training history, goals, limitations, preferences, sleep patterns
- **Training Structure Support**: Handles both weekly (1-7 days/week) and cycle-based patterns (1 on/1 off, 2 on/1 off, custom cycles)

### 4. Arabic Language Support (`/src/lib/text-formatting.ts`)
- Automatic language detection via `isArabicText()` function (30% threshold)
- RTL/LTR text direction handling in components
- Arabic-aware input components: `arabic-aware-input.tsx`, `arabic-aware-textarea.tsx`
- Mixed content handling with `getTextDirection()` returning 'auto' mode

### 5. File Processing Pipeline (`/src/lib/enhanced-file-processor.ts`)
```typescript
// Process → Chunk → Embed → Store
await processFileWithEmbeddings(buffer, mimeType, fileName, knowledgeItemId)
// Creates KnowledgeChunk records with embeddings
```
- Supports PDF, DOC/DOCX, TXT, MD via `mammoth`, `pdf-parse` libraries
- Fitness-specific chunking with overlap for context preservation

### 6. Subscription System (`/src/lib/subscription.ts`)
```typescript
// Two-tier system: FREE (15 msgs/day) vs PRO (unlimited)
const planInfo = await getUserPlan()
await canUserSendMessage() // Check daily limits
await incrementUserMessageCount() // Track usage
await canUserUploadFile(fileSizeInMB) // File size and monthly limits
await canUserCreateKnowledgeItem() // Knowledge base limits
```
- **FREE tier**: 15 messages/day, 5 uploads/month, 10 knowledge items max, 10MB files
- **PRO tier**: Unlimited messages, uploads, knowledge items, 100MB files  
- **Daily usage tracking** with automatic reset at midnight
- **Lemon Squeezy integration** for payment processing and webhooks
- **Webhook handling**: `/src/app/api/webhooks/lemon-squeezy/route.ts`
- **Admin tools**: Use `manage-user-plans.js` script for subscription operations

## 🔧 Key Integration Points

### Supabase Auth Middleware (`/src/middleware.ts`)
- Automatic session refresh for all protected routes
- Cookie-based authentication state management
- Handles auth state without blocking user navigation

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
- **Guest Mode**: Check `isGuest` parameter and skip DB operations for guest users
- **Content-Type Detection**: Use `request.headers.get('content-type')` to handle multipart vs JSON

### API Route Example Pattern
```typescript
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Auth (optional for guest endpoints)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
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
- `Subscription` - Lemon Squeezy integration with billing periods
- `Message.imageData` - Base64 encoded image storage with `imageMimeType`
- `ProcessingStatus` - Tracks file processing states (`PROCESSING`, `READY`, `FAILED`)

### Database Operation Patterns
- Use `@/lib/prisma` for database client (single instance)
- Cascade deletes: `KnowledgeChunk` → `KnowledgeItem`, `Message` → `Chat`
- Include patterns: Always include related data needed for UI in single queries
- Transaction usage: Wrap multi-table operations in `prisma.$transaction()`

### Tech Stack Essentials
- **Framework**: Next.js 15 with App Router and Server Components
- **Database**: PostgreSQL with Prisma ORM (vector embeddings as JSON, pgvector migration pending)
- **AI/ML**: Google Gemini API (`text-embedding-004` model, 768 dimensions)
- **Authentication**: Supabase SSR with role-based access control
- **UI**: Tailwind CSS + shadcn/ui components with `next-themes` dark mode
- **File Processing**: `mammoth` (DOC), `pdf-parse` (PDF), `@tiptap/react` (rich text)
- **Payments**: Lemon Squeezy webhook integration
- **Development**: TypeScript, ESLint, Prisma Studio for DB management

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

## 📝 File Naming Conventions

- `/src/app/api/*/route.ts` - API endpoints
- `/src/components/ui/` - shadcn/ui components  
- `/src/components/arabic-aware-*.tsx` - Arabic language support components
- `/debug-*.js` - Root-level debugging utilities
- `*-test.js` - Manual testing scripts
- `check-*.js` - Validation and verification scripts

- **Navigation Tips**: Admin features (`/src/app/admin/`), Core AI logic (`/src/lib/gemini.ts`), Vector operations (`/src/lib/vector-search.ts`), Subscription system (`/src/lib/subscription.ts`, `/src/components/plan-badge.tsx`, `/src/components/upgrade-button.tsx`), Arabic support (`/src/components/arabic-aware-*.tsx`, `/src/lib/text-formatting.ts`)
