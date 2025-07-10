# HypertroQ - AI Fitness Coach Codebase Guide

## 🏗️ Architecture Overview

**HypertroQ** is a RAG-powered AI fitness coaching platform built with Next.js 15, featuring personalized client memory, multilingual support (Arabic/English), and scientific knowledge base integration.

### Core Components
- **RAG System**: Vector embeddings via Gemini + Prisma ORM with chunked knowledge storage
- **Client Memory**: Comprehensive user profiling with automatic information extraction
- **AI Configuration**: Admin-controlled system prompts and model parameters
- **Authentication**: Supabase Auth with role-based access (user/admin)
- **File Processing**: Multi-format support (PDF, DOC, TXT, MD) with chunking

## 🚀 Development Workflows

### Essential Build Commands
```bash
npm run dev              # Development with turbopack
npm run build           # Prisma generate + Next.js build
npx prisma migrate dev  # Apply schema changes
npx prisma studio       # Visual database browser
```

### Debug Scripts (Root Directory)
- `debug-rag-system.js` - Test vector search and context retrieval
- `debug-users.js` - Inspect user data and permissions
- `check-ai-config.js` - Validate AI configuration setup
- `examine-knowledge.js` - Analyze knowledge base content

### Critical Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public key
SUPABASE_SERVICE_ROLE_KEY=       # Admin operations
GEMINI_API_KEY=                  # Google Gemini API
DATABASE_URL=                    # PostgreSQL connection
```

## 📋 Project-Specific Patterns

### 1. AI Configuration Enforcement
- **All AI operations require admin setup** via `getAIConfiguration()` in `/src/lib/gemini.ts`
- System will throw errors if `AIConfiguration` table is empty or incomplete
- Admin must configure prompts, model parameters, and feature flags

### 2. RAG System Architecture (`/src/lib/vector-search.ts`)
```typescript
// Vector embeddings stored as JSON strings (pgvector migration pending)
// Hybrid search: semantic similarity + keyword matching
await getRelevantContext(query, { userId, limit: 10, threshold: 0.7 })
```

### 3. Client Memory Auto-Extraction (`/src/lib/client-memory.ts`)
- AI automatically extracts user information from chat messages
- Call `updateClientMemory()` function for any personal data mentioned
- Structured storage in `ClientMemory` table with 50+ profile fields

### 4. Arabic Language Support (`/src/lib/text-formatting.ts`)
- Automatic language detection via `isArabicText()` function
- RTL/LTR text direction handling in components
- Arabic-aware input components: `arabic-aware-input.tsx`, `arabic-aware-textarea.tsx`

### 5. File Processing Pipeline (`/src/lib/enhanced-file-processor.ts`)
```typescript
// Process → Chunk → Embed → Store
await processFileWithEmbeddings(buffer, mimeType, fileName, knowledgeItemId)
// Creates KnowledgeChunk records with embeddings
```

## 🔧 Key Integration Points

### Supabase Auth Middleware (`/src/middleware.ts`)
- Automatic session refresh for all protected routes
- Cookie-based authentication state management

### Error Handling (`/src/lib/error-handler.ts`)
- Centralized `ApiErrorHandler` with request context tracking
- Structured logging with correlation IDs

### Database Schema Highlights (`/prisma/schema.prisma`)
- `KnowledgeChunk` - Chunked content with embeddings
- `ClientMemory` - Comprehensive user profiling (50+ fields)
- `AIConfiguration` - Single-row config table for system behavior

## 🎯 Testing & Debugging

### Manual Testing Scripts
- Run debug scripts from project root (not src/)
- Use `find-users.js` to get actual user IDs for testing
- Test knowledge base with `knowledge-test.js`

### Common Issues
- **"AI Configuration not found"** → Run `/admin` setup first
- **Empty knowledge responses** → Check vector embeddings with debug scripts
- **Hydration mismatches** → Use `ClientOnly` wrapper for dynamic content

## 📝 File Naming Conventions

- `/src/app/api/*/route.ts` - API endpoints
- `/src/components/ui/` - shadcn/ui components
- `/debug-*.js` - Root-level debugging utilities
- `*-test.js` - Manual testing scripts

## 🔍 Navigation Tips

- Admin features: `/src/app/admin/`
- Core AI logic: `/src/lib/gemini.ts`
- Vector operations: `/src/lib/vector-search.ts`
- UI patterns: `/src/components/` (Arabic-aware variants available)
- Auth flows: `/src/app/auth/`, `/src/app/onboarding/`
