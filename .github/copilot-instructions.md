# HypertroQ — AI Coding Agent Instructions```instructions

# HypertroQ — Copilot instructions (concise & actionable)

An AI-powered fitness coaching application specializing in hypertrophy training. This guide provides essential patterns and workflows for AI agents to be immediately productive.

This file collects repository-specific facts and quick checks so an AI coding agent can be productive immediately.

## 🏗️ Architecture Overview

Key facts

**Stack**: Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL (pgvector) + Supabase + Google Gemini AI- Framework: Next.js 15 (App Router) + TypeScript. API route files that must be edge-safe live under `src/app/api/**/route.ts`.

- Data: Prisma + PostgreSQL with pgvector. Embeddings are stored as JSON arrays (768 dims).

**Key Concepts**:- Auth/Storage: Supabase (SSR helpers in `src/lib/supabase/*`). No guest chat — users must be authenticated.

- **RAG-powered AI**: Knowledge base content drives all AI responses via vector embeddings (768 dims)- AI config: an admin-only `AIConfiguration` singleton is required for AI features (see `prisma/schema.prisma` and `src/lib/gemini.ts`).

- **Multi-language support**: Arabic/English with automatic detection and RTL/LTR handling- UI components: React with server components, Tailwind CSS, shadcn/ui and Radix UI.

- **Subscription-gated**: Freemium model with LemonSqueezy integration and server-side limit enforcement

- **Admin-controlled AI**: All AI features require `AIConfiguration` singleton managed by adminsPriority checklist before edits

- Open `src/lib/gemini.ts` first and search for `getAIConfiguration()` — many flows intentionally throw when missing.

## ⚡ Priority Workflow (Read This First)- When changing Prisma schema: run `npm run postinstall` then `npx prisma migrate dev` (dev only). `npm run build` triggers Prisma generate.

- After code changes: run `npm run lint` and `npm run build` locally to catch typing/migration generation issues.

1. **AI Configuration**: Open `src/lib/gemini.ts` and search for `getAIConfiguration()` — most AI flows intentionally throw when missing

2. **Schema Changes**: Run `npm run postinstall` → `npx prisma migrate dev` (dev only) → `npm run build`Files to read first (high impact)

3. **Code Quality**: Run `npm run lint` and `npm run build` after changes to catch typing/generation issues- `src/lib/gemini.ts` — central AI helpers, prompt & embedding orchestration.

- `src/lib/vector-search.ts` — pgvector queries; use `fetchRelevantKnowledge()` here.

## 📁 High-Impact Files to Understand- `src/lib/client-memory.ts` — memory extraction and JSON repair logic used by RAG flows.

- `src/lib/subscription.ts` & `src/lib/lemonsqueezy.ts` — plan enforcement and webhook/payment logic.

```- `src/middleware.ts` and `src/app/api/**/route.ts` — must stay Edge-runtime compatible (avoid node-only APIs).

src/lib/gemini.ts                 # Central AI orchestration & embedding helpers- `prisma/schema.prisma` and repo-root debug scripts (`check-ai-config.js`, `debug-rag-system.js`, `test-ai-integration.js`).

src/lib/vector-search.ts          # pgvector queries; use fetchRelevantKnowledge()

src/lib/enhanced-rag-v2.ts        # Multi-stage RAG with fallback protocolsImportant, repo-specific patterns

src/lib/client-memory.ts          # User memory extraction & JSON repair logic- Embeddings are persisted as plain JSON arrays (768 floats). Use existing helpers (in `src/lib/gemini.ts`) to produce/update them.

src/lib/subscription.ts           # Plan enforcement & usage tracking- AI flows require the `AIConfiguration` admin singleton; do not remove guard checks — add migrations/seeds instead.

src/lib/error-handler.ts          # Standardized API error handling- Server-side enforcement: subscription/usage limits and quotas are checked server-side (see `src/lib/subscription.ts`) and return 429 when exceeded.

src/middleware.ts                 # Edge-safe Supabase auth + i18n chaining- Edge-runtime constraint: API routes and middleware are designed to run on the Edge runtime — avoid filesystem or native Node APIs in those files.

src/app/api/**/route.ts           # Edge runtime compatible API routes

prisma/schema.prisma              # Data models & pgvector setupSmall, copy-paste examples

```- Vector search: fetchRelevantKnowledge(queryEmbedding.embedding, topK, threshold) — see `src/lib/vector-search.ts`.

- Keyword AND search: performAndKeywordSearch(query, 10) — merge these hits with vector results for precision.

## 🔧 Essential Patterns- API error pattern: wrap handlers with `ApiErrorHandler.createContext(request)` and call `ApiErrorHandler.handleError(error, context)` (`src/lib/error-handler.ts`).



### Vector Search & RAGDeveloper commands & quick checks

```typescript- Dev server: `npm run dev` (or `npm run dev:turbo`).

// Vector search pattern- Rebuild after deps/schema changes: `npm run postinstall` && `npm run build`.

import { fetchRelevantKnowledge } from "@/lib/vector-search";- Migrations (dev): `npx prisma migrate dev` after `npm run postinstall`.

const context = await fetchRelevantKnowledge(embedding, topK, threshold);- Helpful quick scripts: `node check-ai-config.js`, `node debug-rag-system.js`, `node test-ai-integration.js`.



// Enhanced RAG with fallbacksWhen changing public behavior

import enhancedKnowledgeRetrieval from "@/lib/enhanced-rag-v2";- Add a focused debug script at repo root that reproduces the changed flow (example scripts already accepted in PRs).

const results = await enhancedKnowledgeRetrieval(query, { maxChunks: 15 });

```Where to look for common issues

- "AI Configuration not found": check `src/app/admin/` and run `node check-ai-config.js`.

### API Error Handling- Empty knowledge responses: inspect embeddings with `debug-rag-system.js` and tune `fetchRelevantKnowledge()` thresholds in `src/lib/vector-search.ts`.

```typescript- Middleware conflicts: ensure Supabase auth and `next-intl` are chained in `src/middleware.ts`.

import { ApiErrorHandler } from "@/lib/error-handler";

If you need more detail

export async function POST(request: NextRequest) {- Call out the file or area (for example: `src/lib/gemini.ts` prompts, or `src/lib/subscription.ts` limits) and I will expand this doc with concrete examples and code snippets.

  const context = ApiErrorHandler.createContext(request);

  try {```

    // API logic here# HypertroQ — concise Copilot instructions

  } catch (error) {

    return ApiErrorHandler.handleError(error, context);This file gives AI coding agents focused, high-value guidance to be productive quickly. Keep it short and actionable.

  }

}Key facts

```- Next.js 15 App Router + TypeScript. Server & edge-safe API routes live under `src/app/api/**/route.ts`.

- Prisma + PostgreSQL (pgvector) for embeddings stored as JSON arrays (768 dims).

### Subscription Enforcement- Supabase SSR for auth/storage. No guest chat flows — users must be authenticated.

```typescript- All AI features require an admin `AIConfiguration` singleton (see `prisma/schema.prisma` and `src/lib/gemini.ts`).

import { canUserSendMessage, incrementUserMessageCount } from "@/lib/subscription";

Priority checklist before edits

const canSend = await canUserSendMessage(userId);- Check `src/lib/gemini.ts` for `getAIConfiguration()` usage. Preserve admin-only checks.

if (!canSend.allowed) {- When changing Prisma schema: run `npm run postinstall` then `npx prisma migrate dev` (dev only).

  return NextResponse.json({ error: "Usage limit exceeded" }, { status: 429 });- After edits run `npm run lint` and `npm run build` (build runs Prisma generate).

}

await incrementUserMessageCount(userId);High-impact files to open first

```- `src/lib/gemini.ts` — central AI & embeddings helpers.

- `src/lib/vector-search.ts` — pgvector queries + `fetchRelevantKnowledge()`.

## 🚨 Critical Constraints- `src/lib/client-memory.ts` — user memory extraction + JSON repair.

- `src/lib/subscription.ts` & `src/lib/lemonsqueezy.ts` — plan limits and webhook handling.

- **Edge Runtime**: API routes + middleware must avoid Node.js APIs (use web-standard alternatives)- `src/lib/supabase/*` — server/client Supabase helpers used by API routes.

- **AI Configuration**: Never bypass `getAIConfiguration()` checks — add admin setup instead

- **Embedding Format**: 768-dimensional JSON arrays stored in PostgreSQL — use existing helpersImportant project patterns (do not change lightly)

- **Authentication**: No guest flows allowed — all features require Supabase auth- AI flows throw when `AIConfiguration` is missing — this is intentional. Add migrations/seed rather than removing the guard.

- **Internationalization**: Use `src/app/[locale]/` structure for all routes- Embeddings are stored as JSON arrays; use existing helpers to generate/update them.

- API routes and middleware are written to be Edge-runtime friendly — avoid Node-only APIs in `src/middleware.ts` and `src/app/api/*/route.ts`.

## 🛠️ Developer Commands- Subscription & usage limits enforced server-side (`src/lib/subscription.ts`). Return 429 when limits exceeded.



```bashExamples & quick references

# Development- Vector search: use `fetchRelevantKnowledge(queryEmbedding.embedding, topK, threshold)` in `src/lib/vector-search.ts`.

npm run dev                    # Standard dev server- Keyword AND search: `performAndKeywordSearch(query, 10)` — merge with vector hits for best precision.

npm run dev:turbo             # Turbopack dev server- Error handling in API routes: wrap with `ApiErrorHandler.createContext(request)` and `ApiErrorHandler.handleError(error, context)` (`src/lib/error-handler.ts`).



# Database & BuildDev/runtime tips

npm run postinstall           # Generate Prisma client- Dev server: `npm run dev` (or `npm run dev:turbo`).

npx prisma migrate dev        # Apply migrations (dev only)- Rebuild after package/schema changes: `npm run postinstall` then `npm run build`.

npm run build                 # Build + Prisma generate- Useful debug scripts at repo root: `check-ai-config.js`, `debug-rag-system.js`, `test-ai-integration.js`.



# Debugging (run from project root)Where to look for common issues

node check-ai-config.js       # Verify AI configuration- "AI Configuration not found": open `/src/app/admin/` or run `node check-ai-config.js`.

node debug-rag-system.js      # Analyze RAG performance  - Empty knowledge responses: verify embeddings via debug scripts and `fetchRelevantKnowledge()` thresholds.

node debug-lemonsqueezy-checkout.js  # Test subscription flows- Middleware conflicts: ensure Supabase auth and next-intl are correctly chained in `src/middleware.ts`.

```

If you change public behavior

## 🐛 Common Issues & Solutions- Add/update a small debug script under repo root that reproduces the flow, run it, and include it with your PR.



| Issue | Check | Fix |Feedback

|-------|-------|-----|- If any project area is unclear (AI config, embedding format, or subscription logic), tell me which file and I will expand this doc with precise examples.

| "AI Configuration not found" | `src/app/admin/` or run `node check-ai-config.js` | Create admin config via admin panel |- **Server-Side Validation**: All limits enforced in API routes with HTTP 429 responses

| Empty AI responses | Run `node debug-rag-system.js` | Tune thresholds in `fetchRelevantKnowledge()` |- **Daily Reset**: Message counts reset at midnight via `lastMessageReset` field

| Middleware conflicts | Verify `src/middleware.ts` chains | Ensure Supabase auth → next-intl order |- **Monthly Reset**: Upload counts reset monthly via `lastUploadReset` field

| Build failures | Check TypeScript errors | Run `npm run lint` before build |- **Plan Checking**: Use `getUserPlan()` and `canUserSendMessage()` functions

| Subscription errors | Check LemonSqueezy webhook logs | Verify webhook endpoints in dashboard |- **Maintenance Mode**: Admin bypass during system maintenance periods



## 📋 Development Best Practices## 🎯 Development Best Practices



### Performance### Performance & Optimization

- Use optimized components: `OptimizedMessage`, `OptimizedImage` for chat- Use `OptimizedMessage`, `OptimizedImage` components for chat performance

- Leverage caching hooks: `useOptimizedChatHistory`, `useOptimizedUserPlan`- Leverage `useOptimizedChatHistory`, `useOptimizedUserPlan` hooks for caching

- Monitor with `npx @next/bundle-analyzer`- Implement memoization with React.memo for heavy components

- pgvector handles large-scale searches efficiently- Use pgvector for efficient vector search (no batch limits)

- Monitor bundle size with `npx @next/bundle-analyzer`

### Quality & Security

- Always use `ApiErrorHandler` pattern in API routes### Error Handling & Debugging

- Validate subscription limits server-side (return 429 when exceeded)- Always use `ApiErrorHandler.createContext()` and `ApiErrorHandler.handleError()` 

- Store sensitive configs in environment variables only- Run debug scripts from project root to troubleshoot issues

- Use Supabase RLS policies for data isolation- Check AI configuration first with `check-ai-config.js`

- Test with debug scripts before deploying changes- Use correlation IDs for tracking request flows

- Test subscription flows with `debug-lemonsqueezy-checkout.js`

### Code Organization

- Debug scripts: CommonJS in project root (`check-*.js`, `debug-*.js`)### Security & Authentication

- I18n routes: Follow `/src/app/[locale]/` structure strictly- Implement middleware for route protection (`/src/middleware.ts`)

- Business logic: Keep in `/src/lib/` separate from components- Use role-based access control (`admin` vs `user` roles)

- Type safety: Use TypeScript throughout with proper Prisma types- Validate subscription limits server-side in all API endpoints

- Store sensitive configs in environment variables

## 📖 When You Make Changes- Use Supabase RLS policies for data isolation



1. **Test locally**: Use relevant debug scripts to verify behavior### Code Organization

2. **Document patterns**: Update this file if introducing new conventions- Keep debug scripts in project root using CommonJS

3. **Add debug script**: For new features, create `test-[feature].js` in project root- Follow `/src/app/[locale]/` structure for i18n routes

4. **Verify edge compatibility**: Ensure API routes work on Vercel Edge Runtime- Use TypeScript for all core logic with proper typing

- Maintain separation: UI components, business logic (`/lib`), API routes

---- Document complex patterns in markdown files for future reference


*For specific implementation details, examine the referenced files or run the debug scripts to understand current system state.*