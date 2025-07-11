# HypertroQ - AI Fitness Coach Codebase Guide

## 🏗️ Architecture Overview

**HypertroQ** is a RAG-powered AI fitness coaching platform built with Next.js 15, featuring personalized client memory, multilingual support (Arabic/English), and scientific knowledge base integration.

### Core Components
- **RAG System**: Vector embeddings via Gemini + Prisma ORM with chunked knowledge storage
- **Client Memory**: Comprehensive user profiling with automatic information extraction  
- **AI Configuration**: Admin-controlled system prompts and model parameters (singleton pattern)
- **Authentication**: Supabase Auth with role-based access (user/admin) + onboarding flow
- **File Processing**: Multi-format support (PDF, DOC, TXT, MD) with semantic chunking
- **Error Handling**: Centralized `ApiErrorHandler` with correlation IDs and structured logging

## 🚀 Development Workflows

### Essential Build Commands
```bash
npm run dev              # Development server
npm run dev:turbo        # Development with turbopack (faster)
npm run build           # Prisma generate + Next.js build
npx prisma migrate dev  # Apply schema changes  
npx prisma studio       # Visual database browser
```

### Debug Scripts (Run from root, not src/)
- `debug-rag-system.js` - Test vector search and context retrieval
- `debug-users.js` - Inspect user data and permissions  
- `check-ai-config.js` - Validate AI configuration setup
- `examine-knowledge.js` - Analyze knowledge base content
- `find-users.js` - Get actual user IDs for testing
- `knowledge-test.js` - Test knowledge base functionality
- `create-admin.js` - Create admin user accounts
- `test-subscription-tiers.js` - Test subscription functionality end-to-end
- `manage-user-plans.js` - Admin tool for managing user subscriptions

### Critical Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public key for client-side
SUPABASE_SERVICE_ROLE_KEY=       # Server-side admin operations
GEMINI_API_KEY=                  # Google Gemini API for AI/embeddings
DATABASE_URL=                    # PostgreSQL connection string
DIRECT_URL=                      # Direct DB connection (for migrations)
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

### 3. Client Memory Auto-Extraction (`/src/lib/client-memory.ts`)
- AI automatically extracts user information from chat messages  
- Call `updateClientMemory()` function for any personal data mentioned
- Structured storage in `ClientMemory` table with 50+ profile fields
- Includes training history, goals, limitations, preferences, sleep patterns

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

### 6. Subscription Tiers (`/src/lib/subscription.ts`)
```typescript
// Two-tier system: FREE (15 msgs/day) vs PRO (unlimited)
const planInfo = await getUserPlan()
await canUserSendMessage() // Check daily limits
await incrementUserMessageCount() // Track usage
```
- Free tier: 15 messages/day, no conversation memory, stateless sessions
- Pro tier: Unlimited messages, persistent memory, progress tracking
- Daily usage tracking with automatic reset at midnight
- Lemon Squeezy integration for payment processing

## 🔧 Key Integration Points

### Supabase Auth Middleware (`/src/middleware.ts`)
- Automatic session refresh for all protected routes
- Cookie-based authentication state management
- Handles auth state without blocking user navigation

### Error Handling (`/src/lib/error-handler.ts`)
- Centralized `ApiErrorHandler` with request context tracking
- Structured logging with correlation IDs for debugging
- Validates files, auth states, and request bodies with typed errors

### API Route Patterns (`/src/app/api/*/route.ts`)
- Always use `ApiErrorHandler.createContext(request)` for logging
- Handle both JSON and FormData (for image uploads) in POST routes
- User authentication via `createClient()` from `@/lib/supabase/server`
- Structure: validate → authenticate → process → return with error handling

### Database Schema Highlights (`/prisma/schema.prisma`)
- `KnowledgeChunk` - Chunked content with embeddings (chunkIndex for ordering)
- `ClientMemory` - Comprehensive user profiling (50+ fields covering fitness data)
- `AIConfiguration` - Single-row config table (`id: 'singleton'`) for system behavior
- `User.hasCompletedOnboarding` - Tracks onboarding completion for user flow
- `User.plan` - Subscription tier (FREE/PRO) with message tracking
- `Subscription` - Lemon Squeezy integration with billing periods

## 🎯 Testing & Debugging

### Manual Testing Scripts
- Run debug scripts from project root (not src/)
- Use `find-users.js` to get actual user IDs for testing
- Test knowledge base with `knowledge-test.js`
- Check PDF processing with `check-pdf-items.js`
- Verify Google OAuth onboarding with `final-google-oauth-onboarding-verification.js`

### Common Issues
- **"AI Configuration not found"** → Run `/admin` setup first
- **Empty knowledge responses** → Check vector embeddings with debug scripts
- **Hydration mismatches** → Use `ClientOnly` wrapper for dynamic content
- **Auth issues during onboarding** → Check `hasCompletedOnboarding` flag in User table
- **Arabic text rendering issues** → Verify `isArabicText()` detection and direction handling

## 📝 File Naming Conventions

- `/src/app/api/*/route.ts` - API endpoints
- `/src/components/ui/` - shadcn/ui components  
- `/src/components/arabic-aware-*.tsx` - Arabic language support components
- `/debug-*.js` - Root-level debugging utilities
- `*-test.js` - Manual testing scripts
- `check-*.js` - Validation and verification scripts

## 🔍 Navigation Tips

- Admin features: `/src/app/admin/`
- Core AI logic: `/src/lib/gemini.ts`
- Vector operations: `/src/lib/vector-search.ts`
- UI patterns: `/src/components/` (Arabic-aware variants available)
- Auth flows: `/src/app/auth/`, `/src/app/onboarding/`
- Client memory system: `/src/lib/client-memory.ts` (auto-extracts user data from chats)
- Subscription system: `/src/lib/subscription.ts` (plan management and limits)
- Subscription UI: `/src/components/plan-badge.tsx`, `/src/components/upgrade-button.tsx`
- API endpoints: `/src/app/api/user/plan/`, `/src/app/api/webhooks/lemon-squeezy/`
