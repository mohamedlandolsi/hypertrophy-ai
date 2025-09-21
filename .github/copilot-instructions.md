# HypertroQ — concise Copilot instructions

This file gives AI coding agents focused, high-value guidance to be productive quickly. Keep it short and actionable.

Key facts
- Next.js 15 App Router + TypeScript. Server & edge-safe API routes live under `src/app/api/**/route.ts`.
- Prisma + PostgreSQL (pgvector) for embeddings stored as JSON arrays (768 dims).
- Supabase SSR for auth/storage. No guest chat flows — users must be authenticated.
- All AI features require an admin `AIConfiguration` singleton (see `prisma/schema.prisma` and `src/lib/gemini.ts`).

Priority checklist before edits
- Check `src/lib/gemini.ts` for `getAIConfiguration()` usage. Preserve admin-only checks.
- When changing Prisma schema: run `npm run postinstall` then `npx prisma migrate dev` (dev only).
- After edits run `npm run lint` and `npm run build` (build runs Prisma generate).

High-impact files to open first
- `src/lib/gemini.ts` — central AI & embeddings helpers.
- `src/lib/vector-search.ts` — pgvector queries + `fetchRelevantKnowledge()`.
- `src/lib/client-memory.ts` — user memory extraction + JSON repair.
- `src/lib/subscription.ts` & `src/lib/lemonsqueezy.ts` — plan limits and webhook handling.
- `src/lib/supabase/*` — server/client Supabase helpers used by API routes.

Important project patterns (do not change lightly)
- AI flows throw when `AIConfiguration` is missing — this is intentional. Add migrations/seed rather than removing the guard.
- Embeddings are stored as JSON arrays; use existing helpers to generate/update them.
- API routes and middleware are written to be Edge-runtime friendly — avoid Node-only APIs in `src/middleware.ts` and `src/app/api/*/route.ts`.
- Subscription & usage limits enforced server-side (`src/lib/subscription.ts`). Return 429 when limits exceeded.

Examples & quick references
- Vector search: use `fetchRelevantKnowledge(queryEmbedding.embedding, topK, threshold)` in `src/lib/vector-search.ts`.
- Keyword AND search: `performAndKeywordSearch(query, 10)` — merge with vector hits for best precision.
- Error handling in API routes: wrap with `ApiErrorHandler.createContext(request)` and `ApiErrorHandler.handleError(error, context)` (`src/lib/error-handler.ts`).

Dev/runtime tips
- Dev server: `npm run dev` (or `npm run dev:turbo`).
- Rebuild after package/schema changes: `npm run postinstall` then `npm run build`.
- Useful debug scripts at repo root: `check-ai-config.js`, `debug-rag-system.js`, `test-ai-integration.js`.

Where to look for common issues
- "AI Configuration not found": open `/src/app/admin/` or run `node check-ai-config.js`.
- Empty knowledge responses: verify embeddings via debug scripts and `fetchRelevantKnowledge()` thresholds.
- Middleware conflicts: ensure Supabase auth and next-intl are correctly chained in `src/middleware.ts`.

If you change public behavior
- Add/update a small debug script under repo root that reproduces the flow, run it, and include it with your PR.

Feedback
- If any project area is unclear (AI config, embedding format, or subscription logic), tell me which file and I will expand this doc with precise examples.
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
