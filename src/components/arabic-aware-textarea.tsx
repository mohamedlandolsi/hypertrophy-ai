import React, { useState, useEffect } from 'react';
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
  rows = 1,
  maxLength
}) => {
  const [direction, setDirection] = useState<'ltr' | 'rtl' | 'auto'>('ltr');
  
  useEffect(() => {
    const textDirection = getTextDirection(value);
    setDirection(textDirection);
  }, [value]);
  
  const getPlaceholder = () => {
    // If user is typing Arabic, show Arabic placeholder
    if (direction === 'rtl' || isArabicText(value)) {
      return "اكتب رسالة للمدرب الذكي...";
    }
    return placeholder;
  };
  
  // Auto-resize textarea based on content with better mobile handling
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? 150 : 200; // Taller on desktop, shorter on mobile for better UX
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResize(e.target);
    onChange(e);
  };
  
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
      placeholder={getPlaceholder()}
      className={`${className} ${direction === 'rtl' ? 'text-right' : ''} resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent chat-textarea`}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      dir={direction}
      lang={isArabicText(value) ? 'ar' : 'en'}
      rows={rows}
      maxLength={maxLength}
      style={{
        unicodeBidi: direction === 'auto' ? 'plaintext' : 'normal',
        textAlign: direction === 'rtl' ? 'right' : 'left',
        minHeight: '48px', // Match the h-12 class (3rem = 48px)
        maxHeight: window?.innerWidth < 768 ? '150px' : '200px', // Responsive max height
        lineHeight: '1.5',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => autoResize(e.target as HTMLTextAreaElement)}
    />
  );
};
