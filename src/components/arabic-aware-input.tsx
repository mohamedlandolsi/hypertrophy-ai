import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { isArabicText, getTextDirection } from '@/lib/text-formatting';

interface ArabicAwareInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ArabicAwareInput: React.FC<ArabicAwareInputProps> = ({
  value,
  onChange,
  placeholder = "Message AI Coach...",
  className = "",
  disabled = false,
  onKeyDown
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
      lang={isArabicText(value) ? 'ar' : 'en'}
      style={{
        unicodeBidi: direction === 'auto' ? 'plaintext' : 'normal',
        textAlign: direction === 'rtl' ? 'right' : 'left'
      }}
    />
  );
};
