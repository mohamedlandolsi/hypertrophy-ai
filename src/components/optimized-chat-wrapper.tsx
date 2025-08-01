'use client';

import React, { useMemo, useCallback } from 'react';
import { OptimizedMessage } from '@/components/optimized-message';
import { OptimizedChatHistoryItem, OptimizedLoadMoreButton } from '@/components/optimized-chat-history';
import { OptimizedChatInput } from '@/components/optimized-chat-input';
import { useOptimizedScroll } from '@/hooks/use-performance-optimizations';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface OptimizedChatComponentsProps {
  // Messages
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    imageData?: string | string[];
    imageMimeType?: string | string[];
    images?: Array<{
      data: string;
      mimeType: string;
      name?: string;
    }>;
  }>;
  
  // Chat history
  chatHistory: Array<{
    id: string;
    title: string;
    createdAt: string;
    lastMessage?: string;
    messageCount?: number;
  }>;
  
  // Chat input
  input: string;
  selectedImages: File[];
  imagePreviews: string[];
  
  // State
  isLoading: boolean;
  activeChatId: string | null;
  hasMoreChats: boolean;
  isLoadingMoreChats: boolean;
  isOnline: boolean;
  
  // User
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      picture?: string;
    };
  } | null;
  userRole: string;
  
  // Callbacks
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (message: string, images?: File[]) => void;
  onImageSelect: (files: FileList) => void;
  onImageRemove: (index: number) => void;
  onImageClear: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onChatClick: (chatId: string) => void;
  onDeleteClick: (chatId: string, e: React.MouseEvent) => void;
  onLoadMoreChats: () => void;
  
  // Utils
  getLogoSrc: () => string;
  t: (key: string) => string;
  locale: string;
}

/**
 * Hook for generating optimized chat components
 */
export function useOptimizedChatComponents({
  messages,
  chatHistory,
  input,
  selectedImages,
  imagePreviews,
  isLoading,
  activeChatId,
  hasMoreChats,
  isLoadingMoreChats,
  isOnline,
  user,
  userRole,
  onInputChange,
  onSendMessage,
  onImageSelect,
  onImageRemove,
  onImageClear,
  onPaste,
  onChatClick,
  onDeleteClick,
  onLoadMoreChats,
  getLogoSrc,
  t,
  locale
}: OptimizedChatComponentsProps) {
  // Debounce input for better performance during typing
  const debouncedInput = useDebouncedValue(input, 100);

  // Memoize message list
  const messageList = useMemo(() => (
    <div className="space-y-4 md:space-y-8">
      {messages.map((message, index) => (
        <OptimizedMessage
          key={message.id}
          message={message}
          index={index}
          isLast={index === messages.length - 1}
          user={user}
          userRole={userRole}
          getLogoSrc={getLogoSrc}
        />
      ))}
    </div>
  ), [messages, user, userRole, getLogoSrc]);

  // Memoize chat history list
  const chatHistoryList = useMemo(() => (
    <div className="space-y-1">
      {chatHistory.map(chat => (
        <OptimizedChatHistoryItem
          key={chat.id}
          chat={chat}
          isActive={activeChatId === chat.id}
          onChatClick={onChatClick}
          onDeleteClick={onDeleteClick}
          locale={locale}
        />
      ))}
      <OptimizedLoadMoreButton
        hasMoreChats={hasMoreChats}
        isLoadingMoreChats={isLoadingMoreChats}
        onLoadMore={onLoadMoreChats}
        t={t}
      />
    </div>
  ), [chatHistory, activeChatId, hasMoreChats, isLoadingMoreChats, onChatClick, onDeleteClick, onLoadMoreChats, t, locale]);

  // Memoize chat input
  const chatInput = useMemo(() => (
    <OptimizedChatInput
      input={debouncedInput}
      isLoading={isLoading}
      selectedImages={selectedImages}
      imagePreviews={imagePreviews}
      onInputChange={onInputChange}
      onSendMessage={onSendMessage}
      onImageSelect={onImageSelect}
      onImageRemove={onImageRemove}
      onImageClear={onImageClear}
      onPaste={onPaste}
      placeholder={t('main.inputPlaceholder')}
      isOnline={isOnline}
      t={t}
    />
  ), [
    debouncedInput,
    isLoading,
    selectedImages,
    imagePreviews,
    onInputChange,
    onSendMessage,
    onImageSelect,
    onImageRemove,
    onImageClear,
    onPaste,
    isOnline,
    t
  ]);

  return {
    messageList,
    chatHistoryList,
    chatInput
  };
}

/**
 * Hook for optimized scroll handling in chat
 */
export function useOptimizedChatScroll(messagesEndRef: React.RefObject<HTMLDivElement>) {
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messagesEndRef]);

  const handleScroll = useOptimizedScroll(() => {
    // Implement auto-scroll logic here if needed
    // This is throttled and optimized
  });

  return {
    scrollToBottom,
    handleScroll
  };
}
