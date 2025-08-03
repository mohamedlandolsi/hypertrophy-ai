# View Pricing Button Light Mode Fix ✅

## Issue
The "View Pricing" button at the bottom of the home page had poor visibility in light mode due to white text on a light background.

## Solution
Updated the button styling to use proper light/dark mode colors:

### Before
```tsx
className="text-white border-white hover:bg-white/10 text-lg px-8 py-3 rounded-xl"
```

### After
```tsx
className="text-primary border-primary hover:bg-primary/10 dark:text-white dark:border-white dark:hover:bg-white/10 text-lg px-8 py-3 rounded-xl"
```

## Changes Made

**File**: `src/app/[locale]/page.tsx` (lines ~820-830)

**Light Mode Styling**:
- `text-primary` - Uses the blue accent color (#7289da) for text
- `border-primary` - Blue border to match
- `hover:bg-primary/10` - Light blue hover background

**Dark Mode Styling** (preserved):
- `dark:text-white` - White text
- `dark:border-white` - White border  
- `dark:hover:bg-white/10` - Semi-transparent white hover

## Result
- ✅ **Light Mode**: Blue text with blue border (good contrast)
- ✅ **Dark Mode**: White text with white border (unchanged)
- ✅ **Accessibility**: Proper contrast ratios in both themes
- ✅ **Build Success**: No compilation errors

The button now maintains excellent visibility and follows the design system in both light and dark modes.
