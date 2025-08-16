import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { isArabicText, getTextDirection } from '@/lib/text-formatting';
import { useTranslations, useLocale } from 'next-intl';

interface InternationalInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  messageKey?: string; // For translation key
}

export const InternationalInput: React.FC<InternationalInputProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  onKeyDown,
  messageKey = "Chat.placeholder"
}) => {
  const [direction, setDirection] = useState<'ltr' | 'rtl' | 'auto'>('ltr');
  const t = useTranslations();
  const locale = useLocale();
  
  useEffect(() => {
    const safeValue = value || '';
    const textDirection = getTextDirection(safeValue);
    setDirection(textDirection);
  }, [value]);
  
  const getPlaceholder = () => {
    const safeValue = value || '';
    // Use provided placeholder or fall back to translation
    if (placeholder) return placeholder;
    
    // If user is typing Arabic content, prioritize Arabic regardless of UI locale
    if (direction === 'rtl' || isArabicText(safeValue)) {
      return "اكتب رسالة للمدرب الذكي...";
    }
    
    // Use the translated placeholder based on current locale
    return t(messageKey);
  };
  
  return (
    <Input
      type="text"
      placeholder={getPlaceholder()}
      className={`${className} ${direction === 'rtl' ? 'text-right' : ''}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      onKeyDown={onKeyDown}
      dir={direction}
      lang={isArabicText(value || '') ? 'ar' : locale}
      style={{
        unicodeBidi: direction === 'auto' ? 'plaintext' : 'normal',
        textAlign: direction === 'rtl' ? 'right' : 
                   direction === 'auto' ? 'start' : 'left'
      }}
    />
  );
};
