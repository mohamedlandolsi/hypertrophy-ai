# HypertroQ — AI Coding Agent Instructions

An AI-powered hypertrophy training coach using RAG (Retrieval-Augmented Generation) with pgvector embeddings. This guide helps AI agents be immediately productive in this codebase.

## 🏗️ Architecture Overview

**Stack**: Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL (pgvector) + Supabase Auth/Storage + Google Gemini AI

**Core Concepts**:
- **RAG-Powered AI**: All AI responses driven by vector embeddings (768-dim) stored in PostgreSQL with pgvector extension
- **Admin Singleton Pattern**: `AIConfiguration` table contains exactly ONE admin-managed config row that controls all AI behavior
- **Multi-language**: Automatic Arabic/English/French detection with RTL/LTR support via `next-intl` (`messages/ar.json`, `messages/en.json`, `messages/fr.json`)
- **Subscription-Gated**: Freemium model with LemonSqueezy webhooks. Server-side enforcement via `canUserSendMessage()` and `incrementUserMessageCount()`
- **Edge Runtime Constraints**: Most API routes use `export const runtime = 'nodejs'` for Prisma/file operations. Only use Edge runtime when explicitly required
- **Training Programs**: Interactive program builder with multi-structure support (weekly/cyclic schedules) and category-based customization (MINIMALIST, ESSENTIALIST, MAXIMALIST)

## ⚡ Critical Workflows (Start Here)

### 1. AI Configuration Dependency
**Every AI feature requires `AIConfiguration` singleton**. Many functions in `src/lib/gemini.ts` intentionally throw if missing:
```typescript
const config = await getAIConfiguration(); // Throws if not found
```
- Check: Run `node check-ai-config.js` to verify it exists
- Fix: Create via admin UI at `/admin/ai-config` or seed/migration

### 2. Schema Changes Workflow
```bash
npm run postinstall          # Generate Prisma client (runs prisma generate)
npx prisma migrate dev       # Dev only - creates migration + auto-generates client
npm run build                # Verify everything compiles (also runs prisma generate)
```
**Important**: `npm run build` auto-runs Prisma generate via the build script. The `postinstall` script ensures Prisma client is available after `npm install`. Never commit schema changes without running `npm run build` first to catch TypeScript errors.

### 3. Pre-Commit Checklist
```bash
npm run lint                 # ESLint check
npm run build                # TypeScript + Prisma validation
node check-ai-config.js      # Verify AI config exists
```

## 📁 High-Impact Files to Read

### Core AI System
- **`src/lib/gemini.ts`** (2000+ lines) — Central AI orchestration. Search for `getAIConfiguration()` to understand the admin config dependency. Contains embedding generation, prompt construction, and RAG pipeline.
- **`src/lib/vector-search.ts`** — pgvector similarity search. Use `fetchRelevantKnowledge(embedding, topK, threshold)` for basic RAG. Includes query type detection (`isProgramGeneration`, `isProgramReview`) and category prioritization.
- **`src/lib/enhanced-rag-v2.ts`** — Advanced multi-stage RAG with HyDE, query transformation, and hybrid search. Falls back to SQL-based search if enhanced pipeline fails.
- **`src/lib/client-memory.ts`** — Extracts user profile info and conversation memories from chat. Handles JSON repair for malformed AI responses.

### API Route Pattern
- **`src/app/api/chat/route.ts`** — Reference implementation showing:
  - Runtime config: `export const runtime = 'nodejs'` (required for Prisma, file processing, and Node.js APIs)
  - Timeout config: `export const maxDuration = 60` (overrides Vercel's default 30s for heavy operations)
  - Error handling: `ApiErrorHandler.createContext(request)` → `ApiErrorHandler.handleError(error, context)`
  - Rate limiting: `canUserSendMessage()` → `incrementUserMessageCount()` → return 429 if exceeded
  - Image validation: `validateImageSignature()` checks magic bytes (FFD8FF for JPEG, 89504E47 for PNG, etc.)
  - Auth pattern: `const supabase = await createClient()` → `await supabase.auth.getUser()` → return 401 if missing

### Subscription & Auth
- **`src/lib/subscription.ts`** — Plan limits (`PLAN_LIMITS`), usage counting, automatic downgrade on expired subscriptions
- **`src/lib/lemonsqueezy.ts`** — Checkout URL generation, webhook validation, subscription sync
- **`src/middleware.ts`** — Supabase auth + `next-intl` locale handling. Admin route protection (auth check only; role check in API routes)

### Error Handling
- **`src/lib/error-handler.ts`** — Centralized error types (`ValidationError`, `AuthenticationError`, etc.). Pattern:
```typescript
const context = ApiErrorHandler.createContext(request);
try {
  // ... route logic
} catch (error) {
  return ApiErrorHandler.handleError(error, context);
}
```

## 🎯 Project-Specific Patterns

### RAG Pipeline Pattern (Hybrid Search)
Vector search + keyword search for high precision:
```typescript
// 1. Generate embedding
const embedding = await getEmbedding(query);

// 2. Vector search
const vectorResults = await fetchRelevantKnowledge(embedding, 20, 0.3);

// 3. Keyword search
const keywordResults = await performAndKeywordSearch(query, 10);

// 4. Merge and deduplicate
const merged = mergeAndRankResults(vectorResults, keywordResults);
```

### Memory Extraction Pattern
User profile and conversation memories persist across chats:
```typescript
import { extractProfileInformation, saveProfileExtractions } from '@/lib/ai/memory-extractor';

const profileUpdates = await extractProfileInformation(userMessage, aiResponse);
await saveProfileExtractions(userId, profileUpdates);
```

### Subscription Enforcement Pattern
**Always enforce limits before AI operations**:
```typescript
import { canUserSendMessage, incrementUserMessageCount } from '@/lib/subscription';

const canSend = await canUserSendMessage(userId);
if (!canSend) {
  return NextResponse.json({ error: 'Daily message limit exceeded' }, { status: 429 });
}

// ... perform AI operation

await incrementUserMessageCount(userId);
```

### Multi-Language Pattern
Automatic language detection in chat (supports Arabic, English, French):
```typescript
function detectLanguage(text: string): 'ar' | 'en' | 'fr' {
  const arabicChars = /[\u0600-\u06FF]/;
  return arabicChars.test(text) ? 'ar' : 'en';
}

// System prompt includes: "If user writes in Arabic, respond in Arabic"
```
**Translation files**: `messages/{ar,en,fr}.json` loaded via `next-intl`. Use `useTranslations()` hook in client components. Pages use `[locale]` route segment (`src/app/[locale]/**/page.tsx`). Middleware in `src/middleware.ts` handles locale detection and routing.

## 🔧 Common Debugging Commands

Run from project root (all CommonJS scripts):
```bash
node check-ai-config.js                    # Verify AIConfiguration exists
node debug-rag-system.js                   # Test RAG retrieval pipeline
node test-ai-integration.js                # End-to-end AI flow test
node debug-lemonsqueezy-checkout.js        # Test subscription checkout
node check-pgvector-status.js              # Verify pgvector extension installed
node analyze-knowledge-base.js             # Inspect KB categories and chunks
```

See `scripts/README.md` for full script documentation.

## 🚨 Critical Rules (Do Not Skip)

1. **Admin Config Singleton**: Never bypass `getAIConfiguration()`. If missing, seed it or create via admin UI.
2. **Edge Runtime Safety**: API routes default to Edge. Use `export const runtime = 'nodejs'` only when needed (e.g., file processing, Prisma). Check `vercel.json` for function timeouts.
3. **No Guest Chat**: All chat endpoints require `await supabase.auth.getUser()` → return 401 if missing.
4. **Embedding Shape**: Always 768 floats stored as JSON string arrays (`embeddingData: string?`). Use `getEmbedding()` from `src/lib/gemini.ts`.
5. **Category Prioritization**: RAG system has strict category ordering (see `getPrioritizedCategories()` in `vector-search.ts`). Program generation queries prioritize `hypertrophy_programs` category.

## 🐛 Common Issues & Fixes

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| "AI Configuration not found" | `getAIConfiguration()` throwing | Run `node check-ai-config.js` or create via admin UI |
| Empty RAG responses | Threshold too high or no embeddings | Run `node debug-rag-system.js`, check `similarityThreshold` (0.3 default) |
| Subscription not syncing | LemonSqueezy webhook failing | Check `src/app/api/webhooks/lemonsqueezy/route.ts` logs |
| Prisma type errors after migration | Client not regenerated | Run `npm run postinstall` |
| Middleware crashes | Node.js API in Edge runtime | Check imports in `src/middleware.ts` - remove non-Edge APIs |

## 📦 Deployment Notes

- **Vercel**: API routes have 30s timeout by default (`vercel.json`). Chat endpoint overrides to 60s for image processing.
- **Environment Variables**: Required vars in `.env.local`:
  - `DATABASE_URL`, `DIRECT_URL` (Prisma)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY` (Google AI)
  - `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_STORE_ID`
- **Database Setup**: Requires `pgvector` extension. Run `CREATE EXTENSION IF NOT EXISTS vector;` in PostgreSQL.

## 🎨 UI Component Patterns

- **shadcn/ui**: All UI components in `src/components/ui/` (Button, Card, Dialog, etc.)
- **Server Components**: Default in Next.js 15. Use `'use client'` directive only when needed (event handlers, state, hooks)
- **Internationalization**: Wrap text with `useTranslations()` hook:
```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('chat');
return <Button>{t('sendMessage')}</Button>; // Auto-translates to Arabic/English/French
```
- **RTL Support**: Automatic via Tailwind CSS `rtl:` prefix. Use `dir="rtl"` for Arabic, `dir="ltr"` for English/French. Example: `<div className="text-left rtl:text-right">`

## 📚 Key Data Models

From `prisma/schema.prisma`:
- **User**: Auth + subscription + plan limits. Fields: `plan` (FREE/PRO), `messagesUsedToday`, `freeMessagesRemaining`
- **KnowledgeItem**: Uploaded content (PDFs, docs). Related to `KnowledgeChunk[]`
- **KnowledgeChunk**: Text chunks with `embeddingData` (768-dim vector as JSON string)
- **AIConfiguration**: Singleton admin config. Fields: `systemPrompt`, `ragHighRelevanceThreshold`, `strictMusclePriority`
- **Chat** / **Message**: User chat history with AI
- **Subscription**: LemonSqueezy sync. Fields: `status`, `lemonSqueezyId`, `currentPeriodEnd`

## ✅ When Making Changes

- **Adding new AI features**: Always call `getAIConfiguration()` first. Add config options to `AIConfiguration` schema if needed.
- **Adding API routes**: Use error handler pattern. Add `export const runtime = 'nodejs'` if using Prisma or file I/O.
- **Changing RAG logic**: Add a debug script to `scripts/` demonstrating the change. Update RAG thresholds carefully (test with `debug-rag-system.js`).
- **Schema changes**: Create migration, test locally with `prisma migrate dev`, verify with `npm run build`.
- **Subscription changes**: Test with `debug-lemonsqueezy-checkout.js`. Verify webhook handling still works.

## 🔗 Related Documentation

- `docs/` — Feature implementation docs (150+ markdown files)
- `scripts/README.md` — Debug script usage guide
- `migrations/README.md` — SQL migration history
- `README.md` — Project overview and getting started

---

**Need clarification?** Ask about specific files or patterns. Most complex logic is in `src/lib/gemini.ts` (AI orchestration) and `src/lib/vector-search.ts` (RAG retrieval).