// Utility functions for Arabic text handling and formatting

// Cache for expensive regex operations
const arabicCache = new Map<string, boolean>();
const directionCache = new Map<string, 'ltr' | 'rtl' | 'auto'>();

/**
 * Detects if text contains Arabic characters (optimized with caching)
 */
export function isArabicText(text: string): boolean {
  // Use cache for repeated calls with same text
  if (arabicCache.has(text)) {
    return arabicCache.get(text)!;
  }
  
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const arabicMatches = text.match(arabicRegex);
  const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
  const totalChars = text.replace(/\s/g, '').length;
  const arabicRatio = totalChars > 0 ? arabicCharCount / totalChars : 0;
  const result = arabicRatio > 0.3;
  
  // Cache the result to avoid repeated calculations
  if (arabicCache.size > 100) arabicCache.clear(); // Prevent memory leaks
  arabicCache.set(text, result);
  
  return result;
}

/**
 * Determines the primary text direction for a message (optimized with caching)
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' | 'auto' {
  // Use cache for repeated calls with same text
  if (directionCache.has(text)) {
    return directionCache.get(text)!;
  }
  
  let result: 'ltr' | 'rtl' | 'auto';
  
  // If it's predominantly Arabic, use RTL
  if (isArabicText(text)) {
    result = 'rtl';
  } else {
    // Check if it has significant Arabic content mixed with English
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const arabicMatches = text.match(arabicRegex);
    const arabicCharCount = arabicMatches ? arabicMatches.length : 0;
    
    // If there's some Arabic content but not dominant, use auto
    if (arabicCharCount > 0) {
      result = 'auto';
    } else {
      result = 'ltr';
    }
  }
  
  // Cache the result to avoid repeated calculations
  if (directionCache.size > 100) directionCache.clear(); // Prevent memory leaks
  directionCache.set(text, result);
  
  return result;
}

/**
 * Applies proper formatting and direction attributes for mixed Arabic/English text
 */
export function getTextFormatting(text: string) {
  const direction = getTextDirection(text);
  const hasArabic = isArabicText(text) || text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    return {
    dir: direction,
    className: `${hasArabic ? 'arabic-text' : ''} ${direction === 'rtl' ? 'text-right' : direction === 'auto' ? 'text-auto' : 'text-left'}`,
    lang: hasArabic ? 'ar' : 'en',
    style: {
      unicodeBidi: direction === 'auto' ? 'plaintext' as const : 'normal' as const,
      textAlign: direction === 'rtl' ? 'right' as const : 
                 direction === 'auto' ? 'start' as const : 
                 'left' as const
    }
  };
}

/**
 * Formats mixed Arabic/English text with proper bidirectional support
 */
export function formatBidirectionalText(text: string): string {
  const hasArabic = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
  
  if (!hasArabic) {
    return text;
  }
  
  // Split text by lines and apply appropriate formatting
  return text
    .split('\n')
    .map(line => {
      // Check if this line has mixed content
      const hasEnglish = line.match(/[a-zA-Z]/);
      const hasArabicInLine = line.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
      
      if (hasEnglish && hasArabicInLine) {
        // For mixed content, improve formatting by:
        // 1. Adding proper spacing around English text in Arabic context
        // 2. Using Unicode bidirectional formatting characters
        return line
          // Add thin space around parentheses with English content
          .replace(/\(([a-zA-Z0-9\s\-_.,]+)\)/g, ' ($1) ')
          // Add space around standalone English words/phrases
          .replace(/\s([a-zA-Z][a-zA-Z0-9\s\-_.,%]*[a-zA-Z0-9])\s/g, ' $1 ')
          // Clean up multiple spaces
          .replace(/\s+/g, ' ')
          .trim();
      }
      return line;
    })
    .join('\n');
}
