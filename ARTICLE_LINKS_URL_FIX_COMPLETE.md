# Article Links URL Fix - Complete

## Root Cause Identified and Fixed

### The Problem
Article links were generating URLs like:
- **Wrong:** `http://localhost:3000/knowledge/a-guide-to-foundational-training-principles`
- **Correct:** `http://localhost:3000/knowledge/cmctdh7kp0001l104txze2div`

### Root Cause Analysis
The AI was receiving context headers **without article IDs** in some paths, causing it to generate links using article titles instead of database IDs.

#### Two Context Paths in Gemini.ts:
1. **Vector Search Path** (Primary) - Was missing article IDs
2. **Fallback Path** (Secondary) - Was missing article IDs

## Fixes Applied

### 1. Fixed Vector Search Context Format
**File:** `src/lib/gemini.ts` (line ~336)

**Before:**
```typescript
`=== ${result.knowledgeItemTitle} (${similarity}%) ===\n${result.content}`
```

**After:**
```typescript
`=== ${result.knowledgeItemTitle} id:${result.knowledgeItemId} (${similarity}%) ===\n${result.content}`
```

### 2. Fixed Fallback Context Format
**File:** `src/lib/gemini.ts` (line ~365)

**Before:**
```typescript
`=== ${item.title} ===\n${item.content}`
```

**After:**
```typescript
`=== ${item.title} id:${item.id} ===\n${item.content}`
```

### 3. Updated Database Query
**File:** `src/lib/gemini.ts` (line ~352)

**Added `id` field to select:**
```typescript
select: {
  id: true,        // ← Added this
  title: true,
  content: true,
  type: true
}
```

### 4. Fixed React Key Duplication
**File:** `src/lib/article-links.ts`

**Added deduplication logic:**
```typescript
// Use Map to automatically deduplicate by article ID
const articleLinksMap = new Map<string, ArticleLink>();
```

## Expected Behavior Now

### Context Headers Provided to AI:
```
=== A Guide to Foundational Training Principles id:cmctdh7kp0001l104txze2div (85.2%) ===
Content here...

=== A Guide to Effective Chest Training id:cmctdk7df0005l104tg2f3gli (78.9%) ===
Content here...
```

### AI Response Format:
```
For optimal muscle growth, [A Guide to Foundational Training Principles](article:cmctdh7kp0001l104txze2div) recommends...
```

### Generated URLs:
```
/knowledge/cmctdh7kp0001l104txze2div  ✅
/knowledge/cmctdk7df0005l104tg2f3gli  ✅
```

## Testing Instructions

1. **Clear browser cache** to ensure fresh context
2. **Start new chat conversation** 
3. **Ask about training principles** (e.g., "What are the foundational training principles?")
4. **Check browser console** for debug logs showing which context path is used
5. **Verify article links** show proper database IDs in URLs
6. **Click links** to confirm they navigate to correct article pages

## Debug Information

The system now logs which context path is being used:
- `📚 Direct vector search success` = Vector search path (preferred)
- `🔍 RAG DEBUG: Using FALLBACK path` = Fallback path

Both paths now provide correct article IDs in the format: `id:article-database-id`

## Files Modified

1. **`src/lib/gemini.ts`**
   - Fixed vector search context format
   - Fixed fallback context format  
   - Added ID field to database query

2. **`src/lib/article-links.ts`**
   - Added deduplication logic
   - Removed debug logging

3. **`src/components/article-links.tsx`**
   - Fixed React key uniqueness

## Implementation Status: ✅ COMPLETE

Article links should now correctly use database IDs in URLs instead of article title slugs. The AI will receive proper context headers with article IDs in both the vector search and fallback paths.
