# Currency Selector Mobile Responsiveness Fix

## Issue Fixed
The currency selector popover was not responsive on mobile screens and would get cut off, making it difficult or impossible to select currencies on mobile devices.

## Changes Made

### 1. Mobile Detection
- Added `useState` for `isMobile` state tracking
- Added `useEffect` to detect screen width changes (< 640px = mobile)
- Dynamic responsive behavior based on screen size

### 2. Responsive Popover Positioning
**Before:**
```tsx
<PopoverContent className="w-80 p-0" align="end">
```

**After:**
```tsx
<PopoverContent 
  className="w-80 max-w-[calc(100vw-2rem)] p-0" 
  align={isMobile ? "center" : "end"}
  side="bottom"
  sideOffset={8}
  avoidCollisions={true}
  collisionPadding={16}
>
```

### 3. Mobile-Optimized Styles
- **Width constraint**: `max-w-[calc(100vw-2rem)]` prevents popover from exceeding viewport width
- **Collision detection**: `avoidCollisions={true}` with `collisionPadding={16}` ensures popover stays in viewport
- **Dynamic alignment**: `center` on mobile, `end` on desktop for better UX
- **Touch targets**: Increased button padding from `p-2` to `p-3` for better mobile touch experience
- **Touch optimization**: Added `touch-manipulation` class for improved touch responsiveness
- **Scrollable content**: Added `max-h-64 overflow-y-auto` to handle many currencies on small screens

### 4. Key Features
- **Responsive positioning**: Automatically adjusts alignment based on screen size
- **Viewport awareness**: Never extends beyond screen boundaries
- **Better touch targets**: Larger tap areas for mobile users
- **Collision avoidance**: Smart positioning to avoid being cut off
- **Proper spacing**: Maintains adequate padding from viewport edges

## Technical Implementation
- Uses `window.innerWidth < 640` (Tailwind's `sm` breakpoint) to detect mobile
- Implements proper cleanup of event listeners to prevent memory leaks
- Maintains backward compatibility with existing usage patterns
- Leverages Radix UI's built-in collision detection and positioning system

## Impact
- ✅ Currency selector now works properly on all mobile devices
- ✅ No more cut-off popover content
- ✅ Better touch experience with larger tap targets
- ✅ Smooth responsive behavior across different screen sizes
- ✅ Improved accessibility for mobile users

## Files Modified
- `src/components/currency-selector.tsx` - Added mobile responsiveness and improved touch targets

## Testing
- Build successfully completed
- No TypeScript errors
- Maintains full functionality across all screen sizes
