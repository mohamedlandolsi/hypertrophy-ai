'use client';

import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

interface ChatHistoryItemProps {
  chat: {
    id: string;
    title: string;
    createdAt: string;
    lastMessage?: string;
    messageCount?: number;
  };
  isActive: boolean;
  onChatClick: (chatId: string) => void;
  onDeleteClick: (chatId: string, e: React.MouseEvent) => void;
  locale: string;
}

/**
 * Optimized chat history item with memoization
 * Only re-renders when necessary
 */
export const OptimizedChatHistoryItem = memo<ChatHistoryItemProps>(({
  chat,
  isActive,
  onChatClick,
  onDeleteClick,
  locale
}) => {
  const handleChatClick = useCallback(() => {
    onChatClick(chat.id);
  }, [chat.id, onChatClick]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    onDeleteClick(chat.id, e);
  }, [chat.id, onDeleteClick]);

  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(chat.createdAt));

  return (
    <div
      className={`group flex items-center w-full rounded-xl transition-all duration-300 hover-lift ${
        isActive 
          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
          : 'hover:bg-muted/60 border border-transparent hover:border-border/40'
      }`}
    >
      <button
        onClick={handleChatClick}
        className="flex-1 text-left p-3 rounded-xl transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            isActive ? 'bg-primary' : 'bg-muted-foreground/40 group-hover:bg-primary/60'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm truncate transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}>
              {chat.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {formattedDate}
            </p>
          </div>
        </div>
      </button>
      <button
        onClick={handleDeleteClick}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 mr-1 rounded hover:bg-destructive/10"
        aria-label="Delete chat"
      >
        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.title === nextProps.chat.title &&
    prevProps.chat.createdAt === nextProps.chat.createdAt &&
    prevProps.isActive === nextProps.isActive
  );
});

OptimizedChatHistoryItem.displayName = 'OptimizedChatHistoryItem';

interface OptimizedLoadMoreButtonProps {
  hasMoreChats: boolean;
  isLoadingMoreChats: boolean;
  onLoadMore: () => void;
  t: (key: string) => string;
}

/**
 * Optimized load more button with memoization
 */
export const OptimizedLoadMoreButton = memo<OptimizedLoadMoreButtonProps>(({
  hasMoreChats,
  isLoadingMoreChats,
  onLoadMore,
  t
}) => {
  if (!hasMoreChats) return null;

  return (
    <div className="pt-3 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-center h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        onClick={onLoadMore}
        disabled={isLoadingMoreChats}
      >
        {isLoadingMoreChats ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sidebar.loadingMore')}
          </>
        ) : (
          t('sidebar.loadMore')
        )}
      </Button>
    </div>
  );
});

OptimizedLoadMoreButton.displayName = 'OptimizedLoadMoreButton';
