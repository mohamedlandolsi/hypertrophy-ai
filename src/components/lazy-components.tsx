'use client';

import { lazy, Suspense } from 'react';
import { InlineLoading } from '@/components/ui/loading';

// Lazy load heavy components to reduce initial bundle size
export const LazyAvatar = lazy(() => 
  import('@/components/ui/avatar').then(module => ({ 
    default: module.Avatar 
  }))
);

export const LazyDropdownMenu = lazy(() => 
  import('@/components/ui/dropdown-menu').then(module => ({ 
    default: module.DropdownMenu 
  }))
);

export const LazyDialog = lazy(() => 
  import('@/components/ui/dialog').then(module => ({ 
    default: module.Dialog 
  }))
);

export const LazyMessageContent = lazy(() => 
  import('@/components/message-content').then(module => ({ 
    default: module.MessageContent 
  }))
);

export const LazyArticleLinks = lazy(() => 
  import('@/components/article-links').then(module => ({ 
    default: module.ArticleLinks 
  }))
);

export const LazyArabicAwareTextarea = lazy(() => 
  import('@/components/arabic-aware-textarea').then(module => ({ 
    default: module.ArabicAwareTextarea 
  }))
);

export const LazyLanguageSwitcher = lazy(() => 
  import('@/components/language-switcher').then(module => ({ 
    default: module.default 
  }))
);

export const LazyThemeToggle = lazy(() => 
  import('@/components/theme-toggle').then(module => ({ 
    default: module.ThemeToggle 
  }))
);

export const LazyLoginPromptDialog = lazy(() => 
  import('@/components/login-prompt-dialog').then(module => ({ 
    default: module.LoginPromptDialog 
  }))
);

export const LazyUpgradeButton = lazy(() => 
  import('@/components/upgrade-button').then(module => ({ 
    default: module.UpgradeButton 
  }))
);

// HOC for wrapping lazy components with loading states
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function SuspendedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <InlineLoading variant="pulse" />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pre-configured suspended components
export const SuspendedAvatar = withSuspense(LazyAvatar);
export const SuspendedDropdownMenu = withSuspense(LazyDropdownMenu);
export const SuspendedDialog = withSuspense(LazyDialog);
export const SuspendedMessageContent = withSuspense(LazyMessageContent);
export const SuspendedArticleLinks = withSuspense(LazyArticleLinks);
export const SuspendedArabicAwareTextarea = withSuspense(LazyArabicAwareTextarea);
export const SuspendedLanguageSwitcher = withSuspense(LazyLanguageSwitcher);
export const SuspendedThemeToggle = withSuspense(LazyThemeToggle);
export const SuspendedLoginPromptDialog = withSuspense(LazyLoginPromptDialog);
export const SuspendedUpgradeButton = withSuspense(LazyUpgradeButton);
