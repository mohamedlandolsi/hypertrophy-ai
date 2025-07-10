'use client';

import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  highlightTerms?: string[];
}

export default function Typewriter({ 
  text, 
  delay = 50, 
  className = '', 
  onComplete,
  highlightTerms = []
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete, isClient]);

  const formatTextWithHighlights = (text: string) => {
    if (highlightTerms.length === 0) return text;
    
    let formattedText = text;
    highlightTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      formattedText = formattedText.replace(
        regex, 
        `<span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold animate-pulse">$1</span>`
      );
    });
    
    return formattedText;
  };

  // Return empty div during SSR to prevent hydration mismatch
  if (!isClient) {
    return <span className={className}></span>;
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: formatTextWithHighlights(displayText) + (currentIndex < text.length ? '<span class="animate-pulse">|</span>' : '') 
      }}
    />
  );
}
