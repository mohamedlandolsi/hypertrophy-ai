import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { Textarea } from './ui/textarea';
import { isArabicText, getTextDirection } from '@/lib/text-formatting';

interface ArabicAwareTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
}

export const ArabicAwareTextarea: React.FC<ArabicAwareTextareaProps> = ({
  value,
  onChange,
  placeholder = "Message HypertroQ...",
  className = "",
  disabled = false,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  rows = 1,
  maxLength
}) => {
  // Ref to store textarea element for auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Memoize expensive text direction calculation to avoid recalculation on every render
  const direction = useMemo(() => getTextDirection(value), [value]);
  
  // Memoize Arabic text detection to avoid repeated regex operations
  const hasArabic = useMemo(() => isArabicText(value), [value]);
  
  // Memoize placeholder to avoid recalculation
  const placeholderText = useMemo(() => {
    // If user is typing Arabic, show Arabic placeholder
    if (direction === 'rtl' || hasArabic) {
      return "اكتب رسالة للمدرب الذكي...";
    }
    return placeholder;
  }, [direction, hasArabic, placeholder]);
  
  // Auto-resize textarea based on content with better mobile handling - optimized with useCallback
  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? 150 : 200; // Taller on desktop, shorter on mobile for better UX
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Effect to handle value changes from outside the component (e.g., clearing input after send)
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [value, autoResize]);
  
  // Optimized change handler - immediate response
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Always auto-resize to handle both growth and shrinkage
    const target = e.target;
    autoResize(target);
    onChange(e);
  }, [onChange, autoResize]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Enter key to send message (instead of Ctrl+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Trigger form submission by dispatching a submit event
      const form = e.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
      return;
    }
    
    // Shift + Enter creates a new line (default behavior)
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow default behavior for new line
      setTimeout(() => autoResize(e.target as HTMLTextAreaElement), 0);
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };
  
  return (
    <Textarea
      ref={textareaRef}
      placeholder={placeholderText}
      className={`${className} ${direction === 'rtl' ? 'text-right' : ''} resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent chat-textarea`}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      onFocus={onFocus}
      onBlur={onBlur}
      dir={direction}
      lang={hasArabic ? 'ar' : 'en'}
      rows={rows}
      maxLength={maxLength}
      style={{
        unicodeBidi: direction === 'auto' ? 'plaintext' : 'normal',
        textAlign: direction === 'rtl' ? 'right' : 'left',
        minHeight: '48px', // Match the h-12 class (3rem = 48px)
        maxHeight: typeof window !== 'undefined' && window?.innerWidth < 768 ? '150px' : '200px', // Responsive max height
        lineHeight: '1.5',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
      onInput={useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
        // Always auto-resize to handle both text growth and shrinkage
        const target = e.target as HTMLTextAreaElement;
        autoResize(target);
      }, [autoResize])}
    />
  );
};
