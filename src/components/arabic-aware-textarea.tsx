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
  rows?: number;
  maxLength?: number;
}

export const ArabicAwareTextarea: React.FC<ArabicAwareTextareaProps> = ({
  value,
  onChange,
  placeholder = "Message AI Coach...",
  className = "",
  disabled = false,
  onKeyDown,
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
  
  // Auto-resize textarea based on content
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of ~5 lines
    textarea.style.height = `${newHeight}px`;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResize(e.target);
    onChange(e);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto-resize on Enter
    if (e.key === 'Enter') {
      setTimeout(() => autoResize(e.target as HTMLTextAreaElement), 0);
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };
  
  return (
    <Textarea
      placeholder={getPlaceholder()}
      className={`${className} ${direction === 'rtl' ? 'text-right' : ''} resize-none overflow-hidden`}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      dir={direction}
      lang={isArabicText(value) ? 'ar' : 'en'}
      rows={rows}
      maxLength={maxLength}
      style={{
        unicodeBidi: direction === 'auto' ? 'plaintext' : 'normal',
        textAlign: direction === 'rtl' ? 'right' : 'left',
        minHeight: '48px', // Match the h-12 class (3rem = 48px)
        lineHeight: '1.5'
      }}
      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => autoResize(e.target as HTMLTextAreaElement)}
    />
  );
};
