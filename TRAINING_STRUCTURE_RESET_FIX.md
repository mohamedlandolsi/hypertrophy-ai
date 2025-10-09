# Training Structure Reset Fix

## Date: October 6, 2025

## Problem Reported
User reported: "Every time I make changes in the app code, the training structure under, structure tab, under customize tab, in program guide page gets reset and none of the structures is selected anymore. I selected and saved one before."

## Root Cause Analysis

The issue occurred because the component state was not syncing with the saved user customization data when the component re-rendered (especially during hot module reloading in development).

### The Problem:

1. **Initial State**: The `ProgramCustomizer` component initializes state using `useState(() => ({...}))` with data from `userCustomization` prop
2. **State Initialization Only Runs Once**: The initialization function in `useState` only runs on the first mount
3. **No Sync Mechanism**: When props change (e.g., during hot reload or data refresh), there was no `useEffect` to update the state
4. **Result**: The component state becomes stale and doesn't reflect the saved customization

### Code Flow (Before Fix):

```
First Render:
  ↓
useState initialization reads userCustomization
  ↓
State: { structureId: "abc-123", ... } ✅
  ↓
User sees selected structure ✅

Hot Reload / Code Change:
  ↓
Component re-mounts or props update
  ↓
useState initialization does NOT re-run
  ↓
State: { structureId: "", ... } ❌ (falls back to default)
  ↓
User sees no structure selected ❌
```

### Why This Happened:

React's `useState` initialization function is only called once during the initial mount. When the component re-renders due to:
- Hot module reloading (during development)
- Props changing
- Parent component re-renders

The state is not automatically updated to match the new prop values.

## The Fix

### Location: `src/components/programs/program-customizer.tsx` (after line 169)

Added a `useEffect` hook to sync the customization state whenever the `userCustomization` prop changes:

**Added:**
```tsx
// Sync customization state when userCustomization prop changes (e.g., after hot reload or data refresh)
useEffect(() => {
  if (userCustomization) {
    setCustomization({
      structureId: userCustomization.configuration?.structureId || program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '',
      categoryType: userCustomization.categoryType || 'ESSENTIALIST',
      workoutConfiguration: userCustomization.configuration?.workoutConfiguration || {},
      weeklyScheduleMapping: userCustomization.configuration?.weeklyScheduleMapping || {},
      workoutPattern: userCustomization.configuration?.workoutPattern || 1
    });
    setSavedWorkoutPattern(userCustomization.configuration?.workoutPattern || 1);
  }
}, [userCustomization, program.programStructures]);
```

### How This Fix Works:

1. **Monitors Props**: The `useEffect` watches the `userCustomization` and `program.programStructures` props
2. **Syncs on Change**: When these props change, it updates the local state
3. **Preserves Saved Data**: The state now always reflects the saved customization from the database
4. **Handles Hot Reload**: During development hot reloads, the state is restored from props

### Code Flow (After Fix):

```
First Render:
  ↓
useState initialization reads userCustomization
  ↓
State: { structureId: "abc-123", ... } ✅
  ↓
useEffect syncs state with userCustomization ✅
  ↓
User sees selected structure ✅

Hot Reload / Code Change:
  ↓
Component re-mounts or props update
  ↓
useEffect detects userCustomization changed
  ↓
State updated: { structureId: "abc-123", ... } ✅
  ↓
User STILL sees selected structure ✅
```

## Impact

This fix ensures that:
- ✅ **Selected structure persists** through hot reloads during development
- ✅ **State stays in sync** with saved database values
- ✅ **No unexpected resets** when code changes
- ✅ **All customization preserved**: structure, category, workout config, patterns, etc.

## What Gets Synced

The `useEffect` syncs all customization fields:
- `structureId` - The selected training structure
- `categoryType` - MINIMALIST, ESSENTIALIST, or MAXIMALIST
- `workoutConfiguration` - Exercise selections per workout
- `weeklyScheduleMapping` - Schedule assignments
- `workoutPattern` - 1x, 2x, or 3x pattern
- `savedWorkoutPattern` - Saved pattern state

## Testing

### Before Fix:
1. Select a training structure and save ✅
2. Make any code change (triggers hot reload)
3. **BUG**: Structure selection is lost ❌
4. Have to re-select structure every time

### After Fix:
1. Select a training structure and save ✅
2. Make any code change (triggers hot reload)
3. **FIXED**: Structure selection preserved ✅
4. Continue working without re-selecting

## Build Results

```
✓ Linting and checking validity of types
✓ Build successful
✓ 0 errors, 0 warnings
```

## React Best Practices

This fix follows React best practices for syncing props to state:

### When to Use This Pattern:

✅ **Use `useEffect` to sync props to state when:**
- You need local state for UI interactions
- Props can change and you want to reflect those changes
- You're dealing with controlled/uncontrolled component patterns

❌ **Don't use this pattern when:**
- You can use props directly (no local state needed)
- State should not be overridden by prop changes
- You're creating infinite loops (be careful with dependencies)

### Alternative Approaches Considered:

1. **Using props directly** - Not suitable because we need local state for unsaved changes
2. **Key-based remounting** - Too aggressive, loses all component state
3. **Controlled component** - Would require lifting state to parent, complex refactor
4. **This approach (useEffect sync)** - ✅ Best balance of local state + prop sync

## Developer Notes

### Why This Matters in Development:

During development with hot module reloading (HMR):
- React tries to preserve component state
- But prop values might change
- Without sync, state becomes stale
- User sees inconsistent UI

### Production Impact:

While less common in production, this also helps with:
- Navigation back to the page
- Data refreshes from the server
- Props changing due to parent updates

## Status

✅ **COMPLETE** - Training structure selection now persists through code changes and hot reloads.

User experience:
- Select and save training structure once
- Continue developing/making code changes
- Structure selection remains intact
- No need to constantly re-select
