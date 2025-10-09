/**
 * Chat Page Loading Screen Documentation
 * =====================================
 * 
 * This loading screen is automatically shown when navigating to /chat.
 * Next.js will display this component while the main chat page is loading.
 * 
 * Features:
 * - Skeleton UI that mimics the actual chat interface
 * - Animated loading indicator with AI coaching theme
 * - Progressive loading steps with animations
 * - Responsive design for mobile and desktop
 * - Fitness-themed elements (brain icon, progress dots)
 * 
 * The loading screen includes:
 * 1. Header skeleton with navigation and user avatar placeholders
 * 2. Sidebar skeleton with conversation history placeholders (desktop only)
 * 3. Chat area skeleton with sample message bubbles
 * 4. Input area skeleton with text input and send button placeholders
 * 5. Overlay loading dialog with:
 *    - Brain icon animation (AI coaching theme)
 *    - Progress steps with animated dots
 *    - Bouncing dots animation
 * 
 * Automatic Behavior:
 * - Shows immediately when navigating to /chat
 * - Disappears when the actual chat page finishes loading
 * - No manual triggering required
 * 
 * Customization:
 * - Colors automatically adapt to light/dark theme
 * - Animation speeds can be adjusted via Tailwind classes
 * - Loading message and steps can be modified in the component
 * 
 * Performance:
 * - Lightweight skeleton UI reduces perceived loading time
 * - Smooth animations provide engaging user experience
 * - Responsive design works on all screen sizes
 */

// The actual loading component is in src/app/chat/loading.tsx
