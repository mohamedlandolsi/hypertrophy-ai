'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageContent } from '@/components/message-content';
import { ArticleLinks } from '@/components/article-links';
import { processMessageContent } from '@/lib/article-links';
import { showToast } from '@/lib/toast';
import Image from 'next/image';
import { User as UserIcon, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OptimizedMessageProps {
  message: {
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
  };
  index: number;
  isLast: boolean;
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
  getLogoSrc: () => string;
}

/**
 * Optimized message component with memoization
 * Only re-renders when essential props change
 */
export const OptimizedMessage = memo<OptimizedMessageProps>(({
  message: msg,
  index,
  user,
  userRole,
  getLogoSrc
}) => {
  const t = useTranslations('main');
  
  // Copy message function
  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      showToast.success(t('copySuccessTitle'), t('copySuccessText'));
    } catch (error) {
      console.error('Failed to copy message:', error);
      showToast.error(t('copyErrorTitle'), t('copyErrorText'));
    }
  }, [msg.content, t]);

  // Memoize processed content to avoid re-computation
  const processedContent = useMemo(() => {
    return processMessageContent(msg.content);
  }, [msg.content]);

  // Memoize image processing
  const processedImages = useMemo(() => {
    // Handle multiple images (new format)
    if (msg.images && msg.images.length > 0) {
      return msg.images;
    }
    
    // Handle legacy multiple images (arrays)
    if (Array.isArray(msg.imageData) && Array.isArray(msg.imageMimeType)) {
      return msg.imageData.map((data, idx) => ({
        data,
        mimeType: msg.imageMimeType![idx] || 'image/jpeg',
        name: `Image ${idx + 1}`
      }));
    }
    
    // Handle single image (legacy)
    if (msg.imageData && typeof msg.imageData === 'string') {
      return [{
        data: msg.imageData,
        mimeType: typeof msg.imageMimeType === 'string' ? msg.imageMimeType : 'image/jpeg',
        name: 'Image'
      }];
    }
    
    return [];
  }, [msg.imageData, msg.imageMimeType, msg.images]);

  return (
    <div
      className={`group flex items-start animate-fade-in ${
        msg.role === 'user' 
          ? 'flex-row-reverse' 
          : ''
      }`}
      data-role={msg.role}
    >
      {/* Optimized Avatar */}
      <div className={`flex-shrink-0 ${
        msg.role === 'user' ? 'ml-3 md:ml-6' : 'mr-3 md:mr-6'
      }`}>
        {msg.role === 'user' ? (
          <Avatar className="h-8 w-8 md:h-10 md:w-10 shadow-md hover-lift">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url} 
              alt={user?.user_metadata?.full_name || 'User'} 
            />
            <AvatarFallback className="bg-primary/10 text-primary border-2 border-primary/20">
              <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="relative">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 shadow-md hover-lift">
              <AvatarImage 
                src={getLogoSrc()} 
                alt="HypertroQ AI" 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 text-primary">
                AI
              </AvatarFallback>
            </Avatar>
            {userRole === 'admin' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">A</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 space-y-2 max-w-full ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
        {/* Images */}
        {processedImages.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {processedImages.map((image, imageIndex) => (
              <div
                key={imageIndex}
                className="relative max-w-xs md:max-w-sm overflow-hidden rounded-lg border border-border shadow-sm hover-lift group/image"
              >
                <Image
                  src={image.data}
                  alt={image.name || `Uploaded image ${imageIndex + 1}`}
                  className="w-full h-auto object-cover"
                  width={400}
                  height={300}
                  loading={index < 3 ? 'eager' : 'lazy'} // Eager load first 3 messages
                  quality={85}
                />
              </div>
            ))}
          </div>
        )}

        {/* Text content */}
        <div
          className={`${
            msg.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 md:py-3 shadow-sm max-w-xs md:max-w-md lg:max-w-lg'
              : 'chat-bubble-ai px-4 md:px-5 py-3 md:py-4 max-w-xs md:max-w-3xl lg:max-w-4xl'
          }`}
        >
          <MessageContent 
            content={processedContent.content}
            role={msg.role}
          />
        </div>

        {/* Copy button for AI messages */}
        {msg.role === 'assistant' && (
          <div className="mt-2 flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyMessage}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 rounded-lg opacity-0 group-hover:opacity-100"
              aria-label={t('copy')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Article links for AI messages */}
        {msg.role === 'assistant' && processedContent.articleLinks && processedContent.articleLinks.length > 0 && (
          <div className="mt-3">
            <ArticleLinks 
              links={processedContent.articleLinks}
              messageRole={msg.role}
            />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.userRole === nextProps.userRole &&
    JSON.stringify(prevProps.message.imageData) === JSON.stringify(nextProps.message.imageData)
  );
});

OptimizedMessage.displayName = 'OptimizedMessage';
