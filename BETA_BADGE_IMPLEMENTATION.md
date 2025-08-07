# Beta Badge Implementation

## Overview
Added a beta badge next to the HypertroQ title in both the navbar and chat page sidebar to indicate the product is in beta status.

## Changes Made

### 1. Created Beta Badge Component
- **File**: `src/components/beta-badge.tsx`
- **Features**:
  - Configurable size (sm, md, lg)
  - Orange-to-red gradient background
  - Subtle pulse animation
  - Responsive design
  - TypeScript support

### 2. Updated Navbar
- **File**: `src/components/navbar.tsx`
- **Changes**:
  - Imported `BetaBadge` component
  - Added beta badge next to "HypertroQ" title
  - Wrapped title and badge in flex container for proper alignment

### 3. Updated Chat Page
- **File**: `src/app/[locale]/chat/page.tsx`
- **Changes**:
  - Imported `BetaBadge` component
  - Added beta badge to chat header (next to "HypertroQ" title)
  - Added beta badge to sidebar header (next to brand name)
  - Conditional display logic to avoid showing badge when viewing specific chat on mobile

### 4. Added CSS Animation
- **File**: `src/app/globals.css`
- **Changes**:
  - Added `pulse-subtle` keyframe animation
  - Added corresponding CSS class for the animation
  - 3-second duration with ease-in-out timing

## Technical Details

### Beta Badge Component API
```tsx
interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### Styling Features
- **Colors**: Orange-to-red gradient (`from-orange-500 to-red-500`)
- **Animation**: Subtle pulse effect (opacity 1 ↔ 0.8)
- **Border**: Orange border with transparency
- **Typography**: Uppercase, bold, tracking-wide
- **Shadow**: Medium shadow for depth

### Placement Strategy
1. **Navbar**: Next to main brand title, visible on all pages except chat/admin
2. **Chat Header**: Next to "HypertroQ" title when not viewing specific chat
3. **Chat Sidebar**: Next to brand name in sidebar header

### Responsive Behavior
- Small size (`sm`) used consistently for subtle but visible presence
- Badge hidden on mobile when viewing specific chat to avoid clutter
- Maintains proper alignment across different screen sizes

## Usage Locations
1. ✅ **Main Navbar** - Visible on home, pricing, profile, etc.
2. ✅ **Chat Page Header** - Visible when no specific chat is selected
3. ✅ **Chat Page Sidebar** - Always visible in sidebar header

## Testing
- ✅ Build passes without errors
- ✅ TypeScript compilation successful
- ✅ Component renders correctly in all locations
- ✅ Animation works smoothly
- ✅ Responsive design maintained

## Future Considerations
- Badge can be easily removed by:
  1. Removing `<BetaBadge />` components from navbar and chat page
  2. Optionally removing the component file and animation CSS
- Badge styling can be modified via the `BetaBadge` component
- Size can be adjusted per location if needed
