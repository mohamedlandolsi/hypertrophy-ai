# API Validation Fix - Pattern-Aware Workout IDs

## Issue
When saving customization with pattern-aware workout IDs (e.g., `upper-body-A`, `lower-body-B`), the API returned a 400 Bad Request error with the message:
```
Save Failed
Failed to save your customization. Please try again.

Failed to load resource: the server responded with a status of 400 (Bad Request)
```

## Root Cause
The API endpoint `/api/programs/customize/route.ts` was validating workout IDs by checking if they exist in `program.workoutTemplates`. However, pattern-aware IDs like `upper-body-A`, `upper-body-B`, `upper-body-C` don't exist in the database - only the base IDs (`upper-body`, `lower-body`) exist.

**Old Validation Logic**:
```typescript
// This only checked exact matches
const validWorkoutIds = program.workoutTemplates.map(w => w.id);
const invalidWorkoutIds = configuredWorkoutIds.filter(id => !validWorkoutIds.includes(id));

// Result: 'upper-body-A' was considered invalid because only 'upper-body' exists
```

## Solution
Updated the validation logic to handle both base workout IDs and pattern-aware IDs by extracting the base ID from pattern-aware IDs before validation.

**New Validation Logic**:
```typescript
// Extract base ID from pattern-aware IDs (e.g., "upper-body-A" -> "upper-body")
const invalidWorkoutIds = configuredWorkoutIds.filter(id => {
  // Check if it's a base ID (e.g., "upper-body")
  if (validWorkoutIds.includes(id)) return false;
  
  // Check if it's a pattern-aware ID (ends with -A, -B, or -C)
  const baseId = id.replace(/-(A|B|C)$/, '');
  return !validWorkoutIds.includes(baseId);
});
```

## Files Modified

### `/src/app/api/programs/customize/route.ts`

**Lines 98-117**: Updated workout configuration validation

**Before**:
```typescript
// Validate workout configuration
const validWorkoutIds = program.workoutTemplates.map(w => w.id);
const configuredWorkoutIds = Object.keys(customization.workoutConfiguration);
const invalidWorkoutIds = configuredWorkoutIds.filter(id => !validWorkoutIds.includes(id));

if (invalidWorkoutIds.length > 0) {
  return NextResponse.json({
    error: 'Invalid workout configuration',
    message: `Invalid workout template IDs: ${invalidWorkoutIds.join(', ')}`
  }, { status: 400 });
}
```

**After**:
```typescript
// Validate workout configuration
// Handle both base workout IDs and pattern-aware IDs (e.g., "upper-body-A")
const validWorkoutIds = program.workoutTemplates.map((w: { id: string }) => w.id);
const configuredWorkoutIds = Object.keys(customization.workoutConfiguration);

// Extract base ID from pattern-aware IDs (e.g., "upper-body-A" -> "upper-body")
const invalidWorkoutIds = configuredWorkoutIds.filter(id => {
  // Check if it's a base ID
  if (validWorkoutIds.includes(id)) return false;
  
  // Check if it's a pattern-aware ID (ends with -A, -B, or -C)
  const baseId = id.replace(/-(A|B|C)$/, '');
  return !validWorkoutIds.includes(baseId);
});

if (invalidWorkoutIds.length > 0) {
  return NextResponse.json({
    error: 'Invalid workout configuration',
    message: `Invalid workout template IDs: ${invalidWorkoutIds.join(', ')}`
  }, { status: 400 });
}
```

## Validation Examples

### Example 1: Pattern 1 (Same Workout)
```typescript
// Database has: ['upper-body', 'lower-body']
// User sends: { 'upper-body': [...], 'lower-body': [...] }
// Result: ✅ Valid (exact match)
```

### Example 2: Pattern 2 (A/B)
```typescript
// Database has: ['upper-body', 'lower-body']
// User sends: { 
//   'upper-body-A': [...], 
//   'upper-body-B': [...],
//   'lower-body-A': [...],
//   'lower-body-B': [...]
// }
// Validation:
// - 'upper-body-A' -> baseId: 'upper-body' -> ✅ Valid
// - 'upper-body-B' -> baseId: 'upper-body' -> ✅ Valid
// - 'lower-body-A' -> baseId: 'lower-body' -> ✅ Valid
// - 'lower-body-B' -> baseId: 'lower-body' -> ✅ Valid
```

### Example 3: Pattern 3 (A/B/C)
```typescript
// Database has: ['upper-body', 'lower-body']
// User sends: { 
//   'upper-body-A': [...], 
//   'upper-body-B': [...],
//   'upper-body-C': [...],
//   'lower-body-A': [...],
//   'lower-body-B': [...],
//   'lower-body-C': [...]
// }
// All validate successfully by extracting base IDs
```

### Example 4: Invalid ID
```typescript
// Database has: ['upper-body', 'lower-body']
// User sends: { 'chest-workout-A': [...] }
// Validation:
// - 'chest-workout-A' -> baseId: 'chest-workout' -> ❌ Invalid
// Result: 400 Bad Request with error message
```

## Testing

### Manual Testing Steps
1. ✅ Navigate to program guide → Customize tab
2. ✅ Select Pattern 2 (Workout A and B) or Pattern 3 (A, B, C)
3. ✅ Customize workout exercises for different patterns
4. ✅ Click "Save Customization"
5. ✅ Should see success toast: "Customization Saved"
6. ✅ No 400 error should appear in console
7. ✅ Refresh page and verify data persists

### Expected API Behavior
- **Pattern 1**: Accepts base IDs (`upper-body`, `lower-body`)
- **Pattern 2**: Accepts pattern IDs (`upper-body-A`, `upper-body-B`, etc.)
- **Pattern 3**: Accepts pattern IDs (`upper-body-A`, `upper-body-B`, `upper-body-C`, etc.)
- **Invalid IDs**: Returns 400 with clear error message

## Build Status
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All routes compiled

## Impact
- **Before Fix**: Users couldn't save customizations when using Pattern 2 or 3
- **After Fix**: All pattern types (1, 2, 3) work correctly
- **Backward Compatibility**: Pattern 1 (base IDs) still works as before
- **Data Integrity**: Only valid workout IDs (with valid base) are accepted

## Related Files
- `/src/app/api/programs/customize/route.ts` - API validation logic (FIXED)
- `/src/components/programs/program-customizer.tsx` - Frontend sends pattern-aware IDs
- `/src/components/programs/workout-templates.tsx` - Frontend displays pattern-aware workouts

## Notes
- The regex `/-(A|B|C)$/` matches IDs ending with `-A`, `-B`, or `-C`
- Base workout IDs are stored in database, pattern variants are client-side only
- Validation now supports mixed configurations (some base IDs, some pattern IDs)
- Future-proof: If patterns D, E, F are added, just update the regex
