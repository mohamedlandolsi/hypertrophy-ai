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


# HypertroQ — Copilot instructions (concise & actionable)

This repo is an AI-powered hypertrophy coaching app (Next.js 15 + TypeScript). The file below highlights the repo-specific patterns, commands, and files an AI coding agent needs to be productive immediately. Keep this short and actionable.

Core facts
- Stack: Next.js 15 (App Router), TypeScript, Prisma + PostgreSQL (pgvector), Supabase, Google Gemini (AI). API routes must be Edge-runtime compatible and live under `src/app/api/**/route.ts`.
- Embeddings: 768-dimensional JSON arrays persisted in Postgres (pgvector).

Must-read files (start here)
- `src/lib/gemini.ts` — central AI orchestration, prompt & embedding helpers. Search for `getAIConfiguration()`; many flows intentionally throw if the admin singleton is missing.
- `src/lib/vector-search.ts` — pgvector queries. Use `fetchRelevantKnowledge(queryEmbedding.embedding, topK, threshold)`.
- `src/lib/enhanced-rag-v2.ts` — multi-stage RAG + fallbacks.
- `src/lib/client-memory.ts` — user memory extraction and JSON repair logic used by RAG.
- `src/lib/subscription.ts` & `src/lib/lemonsqueezy.ts` — subscription checks, usage counting, webhooks.
- `src/lib/error-handler.ts` — standard API error wrapper; use `ApiErrorHandler.createContext(request)` and `ApiErrorHandler.handleError(error, context)` in routes.

High-priority rules (do not remove/skip)
- All AI features require an admin `AIConfiguration` singleton — do not bypass. If missing, add a migration/seed or create the config via the admin UI.
- API routes and `src/middleware.ts` must remain Edge-runtime safe: avoid Node-only APIs (fs, child_process, native modules).
- No guest chat: Supabase auth is mandatory for user flows.
- Embeddings shape: always 768 floats stored as JSON arrays — use existing helpers in `src/lib/gemini.ts` to produce/validate embeddings.

Developer commands (local/dev)
- npm run dev (or npm run dev:turbo) — start dev server.
- npm run postinstall && npx prisma migrate dev — after schema changes (dev only).
- npm run build — runs Prisma generate and TypeScript build.
- npm run lint — run project linter.
- Useful scripts (repo root): `check-ai-config.js`, `debug-rag-system.js`, `test-ai-integration.js`, `debug-lemonsqueezy-checkout.js`.

Patterns & examples
- Vector + keyword hybrid: Merge `fetchRelevantKnowledge(...)` results with `performAndKeywordSearch(query, 10)` for precision when needed (see `src/lib/vector-search.ts`).
- Error handling: Wrap route handlers with `ApiErrorHandler.createContext(request)` then catch and return via `ApiErrorHandler.handleError()` (see `src/lib/error-handler.ts`).
- Rate/usage enforcement: Use `canUserSendMessage()` and `incrementUserMessageCount()` from `src/lib/subscription.ts` before invoking AI flows; return 429 when limits exceeded.

Debugging tips
- "AI Configuration not found": run `node check-ai-config.js` or inspect `src/app/admin/`.
- Empty knowledge responses: run `node debug-rag-system.js` and check thresholds in `fetchRelevantKnowledge()`.
- Subscription issues: inspect LemonSqueezy webhook handling in `src/lib/lemonsqueezy.ts` and `debug-lemonsqueezy-checkout.js`.

When editing
- Preserve Edge/runtime constraints in API and middleware files.
- After Prisma schema edits: run `npm run postinstall`, then `npx prisma migrate dev`, then `npm run build`.
- Add focused debug scripts (CommonJS) in repo root for any changed AI flow; include with PRs.

Quick checklist before PR
- Ensure `AIConfiguration` exists or include a seed/migration.
- Run `npm run lint` and `npm run build` locally.
- Add or update a small debug script that reproduces changed behavior.

If something here is ambiguous tell me which file or area to expand and I will add precise code examples.