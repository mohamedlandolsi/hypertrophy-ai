'use client';

import { useState, useCallback } from 'react';
import { MultilingualContent, createEmptyMultilingualContent } from '@/components/ui/multilingual-editor';

interface UseMultilingualContentOptions {
  initialContent?: Partial<MultilingualContent>;
  autoTranslate?: boolean;
  translationApiEndpoint?: string;
}

interface TranslationRequest {
  fromLang: string;
  toLang: string;
  content: string;
}

export function useMultilingualContent(options: UseMultilingualContentOptions = {}) {
  const [content, setContent] = useState<MultilingualContent>({
    ...createEmptyMultilingualContent(),
    ...options.initialContent
  });
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Record<string, string[]>>({});

  // Update content for a specific language
  const updateContent = useCallback((lang: keyof MultilingualContent, value: string) => {
    setContent(prev => ({
      ...prev,
      [lang]: value
    }));
  }, []);

  // Copy content from one language to another
  const copyContent = useCallback((fromLang: keyof MultilingualContent, toLang: keyof MultilingualContent) => {
    setContent(prev => ({
      ...prev,
      [toLang]: prev[fromLang]
    }));
  }, []);

  // Auto-translate content using API
  const translateContent = useCallback(async (fromLang: string, toLang: string, text: string): Promise<string> => {
    if (options.translationApiEndpoint) {
      try {
        setIsTranslating(true);
        
        const response = await fetch(options.translationApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromLang,
            toLang,
            content: text
          } as TranslationRequest)
        });

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.translatedText || result.content || text;
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback to mock translation for development
        return `[Auto-translated from ${fromLang} to ${toLang}] ${text}`;
      } finally {
        setIsTranslating(false);
      }
    } else {
      // Mock translation for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `[Mock translation from ${fromLang} to ${toLang}] ${text}`;
    }
  }, [options.translationApiEndpoint]);

  // Translate and update content
  const translateAndUpdate = useCallback(async (fromLang: keyof MultilingualContent, toLang: keyof MultilingualContent) => {
    if (!content[fromLang].trim()) return;

    try {
      // Store current content in history before translation
      setTranslationHistory(prev => ({
        ...prev,
        [toLang]: [...(prev[toLang] || []), content[toLang]].slice(-3)
      }));

      const translated = await translateContent(fromLang, toLang, content[fromLang]);
      setContent(prev => ({
        ...prev,
        [toLang]: translated
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }, [content, translateContent]);

  // Restore content from translation history
  const restoreFromHistory = useCallback((lang: keyof MultilingualContent, historyIndex: number) => {
    const history = translationHistory[lang];
    if (history && history[historyIndex]) {
      setContent(prev => ({
        ...prev,
        [lang]: history[historyIndex]
      }));
    }
  }, [translationHistory]);

  // Get completion status
  const getCompletionStatus = useCallback(() => {
    return {
      en: content.en.trim().length > 0,
      ar: content.ar.trim().length > 0,
      fr: content.fr.trim().length > 0,
      completedCount: Object.values(content).filter(text => text.trim().length > 0).length,
      isComplete: Object.values(content).every(text => text.trim().length > 0)
    };
  }, [content]);

  // Validate content
  const validate = useCallback((required = false) => {
    const errors: Partial<Record<keyof MultilingualContent, string>> = {};
    
    if (required && !content.en.trim()) {
      errors.en = 'English content is required';
    }
    
    // Add other validation rules as needed
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [content]);

  // Get best available content for a locale
  const getBestContent = useCallback((preferredLocale: keyof MultilingualContent = 'en') => {
    if (content[preferredLocale]?.trim()) {
      return content[preferredLocale];
    }
    
    // Fallback order: en > fr > ar
    const fallbackOrder: (keyof MultilingualContent)[] = ['en', 'fr', 'ar'];
    
    for (const locale of fallbackOrder) {
      if (content[locale]?.trim()) {
        return content[locale];
      }
    }
    
    return '';
  }, [content]);

  return {
    content,
    setContent,
    updateContent,
    copyContent,
    translateAndUpdate,
    restoreFromHistory,
    getCompletionStatus,
    validate,
    getBestContent,
    isTranslating,
    translationHistory
  };
}

// Hook for managing multiple multilingual fields
export function useMultilingualForm<T extends Record<string, MultilingualContent>>(
  initialData?: Partial<T>
) {
  const [formData, setFormData] = useState<T>(initialData as T || {} as T);

  const updateField = useCallback(<K extends keyof T>(
    fieldName: K,
    content: MultilingualContent
  ) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: content
    }));
  }, []);

  const validateForm = useCallback((requiredFields: (keyof T)[] = []) => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    for (const field of requiredFields) {
      const fieldContent = formData[field];
      if (!fieldContent?.en?.trim()) {
        errors[field] = `${String(field)} English content is required`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formData]);

  const getFormCompletionStatus = useCallback(() => {
    const fields = Object.keys(formData) as (keyof T)[];
    const completionStats = fields.map(field => {
      const content = formData[field];
      const completed = content ? Object.values(content).filter(text => text?.trim()).length : 0;
      return {
        field,
        completed,
        total: 3, // en, ar, fr
        percentage: Math.round((completed / 3) * 100)
      };
    });

    const totalFields = fields.length * 3; // 3 languages per field
    const completedFields = completionStats.reduce((sum, stat) => sum + stat.completed, 0);
    
    return {
      fieldStats: completionStats,
      overallPercentage: totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100,
      completedFields,
      totalFields
    };
  }, [formData]);

  return {
    formData,
    setFormData,
    updateField,
    validateForm,
    getFormCompletionStatus
  };
}

export type { TranslationRequest };