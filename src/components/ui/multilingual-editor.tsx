'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  RotateCcw,
  Languages,
  Sparkles
} from 'lucide-react';

export interface MultilingualContent {
  en: string;
  ar: string;
  fr: string;
}

interface MultilingualEditorProps {
  label: string;
  description?: string;
  value: MultilingualContent;
  onChange: (value: MultilingualContent) => void;
  type?: 'input' | 'textarea' | 'rich';
  required?: boolean;
  placeholder?: MultilingualContent;
  maxLength?: number;
  minHeight?: string;
  showTranslationStatus?: boolean;
  onTranslate?: (fromLang: string, toLang: string, content: string) => Promise<string>;
}

const LANGUAGE_CONFIG = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    fontFamily: 'font-sans'
  },
  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    fontFamily: 'font-arabic'
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    fontFamily: 'font-sans'
  }
} as const;

export function MultilingualEditor({
  label,
  description,
  value,
  onChange,
  type = 'input',
  required = false,
  placeholder,
  maxLength,
  minHeight = '100px',
  showTranslationStatus = true,
  onTranslate
}: MultilingualEditorProps) {
  const [activeTab, setActiveTab] = useState<keyof MultilingualContent>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Record<string, string[]>>({});

  // Check completion status for each language
  const getCompletionStatus = () => {
    return {
      en: value.en.trim().length > 0,
      ar: value.ar.trim().length > 0,
      fr: value.fr.trim().length > 0
    };
  };

  const completionStatus = getCompletionStatus();
  const completedCount = Object.values(completionStatus).filter(Boolean).length;

  // Handle input change
  const handleChange = (lang: keyof MultilingualContent, content: string) => {
    onChange({
      ...value,
      [lang]: content
    });
  };

  // Copy content from one language to another
  const copyContent = (fromLang: keyof MultilingualContent, toLang: keyof MultilingualContent) => {
    if (value[fromLang].trim()) {
      onChange({
        ...value,
        [toLang]: value[fromLang]
      });
    }
  };

  // Auto-translate content
  const translateContent = async (fromLang: keyof MultilingualContent, toLang: keyof MultilingualContent) => {
    if (!onTranslate || !value[fromLang].trim()) return;

    setIsTranslating(true);
    try {
      const translated = await onTranslate(fromLang, toLang, value[fromLang]);
      onChange({
        ...value,
        [toLang]: translated
      });

      // Store in history
      setTranslationHistory(prev => ({
        ...prev,
        [toLang]: [...(prev[toLang] || []), value[toLang]].slice(-3) // Keep last 3 versions
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Restore from history
  const restoreFromHistory = (lang: keyof MultilingualContent, historyIndex: number) => {
    const history = translationHistory[lang];
    if (history && history[historyIndex]) {
      onChange({
        ...value,
        [lang]: history[historyIndex]
      });
    }
  };

  // Render input field based on type
  const renderInput = (lang: keyof MultilingualContent) => {
    const langConfig = LANGUAGE_CONFIG[lang];
    const commonProps = {
      value: value[lang],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleChange(lang, e.target.value),
      placeholder: placeholder?.[lang] || `Enter ${langConfig.name.toLowerCase()} content...`,
      dir: langConfig.dir as 'ltr' | 'rtl',
      className: `${langConfig.fontFamily} ${langConfig.dir === 'rtl' ? 'text-right' : 'text-left'}`,
      maxLength
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea 
            {...commonProps}
            style={{ minHeight }}
            className={`${commonProps.className} resize-none`}
          />
        );
      case 'rich':
        // For future rich text editor integration
        return (
          <Textarea 
            {...commonProps}
            style={{ minHeight }}
            className={`${commonProps.className} resize-none font-mono`}
          />
        );
      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle className="flex items-center gap-2">
              {label}
              {required && <span className="text-red-500">*</span>}
            </CardTitle>
          </div>
          {showTranslationStatus && (
            <div className="flex items-center gap-2">
              <Badge variant={completedCount === 3 ? 'default' : completedCount > 0 ? 'secondary' : 'outline'}>
                <Languages className="w-3 h-3 mr-1" />
                {completedCount}/3 Languages
              </Badge>
            </div>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof MultilingualContent)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
              <TabsTrigger 
                key={lang} 
                value={lang}
                className="flex items-center gap-2"
              >
                <span>{config.flag}</span>
                <span>{config.name}</span>
                {completionStatus[lang as keyof MultilingualContent] && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
            <TabsContent key={lang} value={lang} className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span>{config.flag}</span>
                  <span>{config.name} Content</span>
                  {completionStatus[lang as keyof MultilingualContent] && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </Label>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {onTranslate && Object.keys(LANGUAGE_CONFIG).filter(l => l !== lang && value[l as keyof MultilingualContent].trim()).length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const sourceLang = Object.keys(LANGUAGE_CONFIG).find(l => 
                          l !== lang && value[l as keyof MultilingualContent].trim()
                        ) as keyof MultilingualContent;
                        if (sourceLang) {
                          translateContent(sourceLang, lang as keyof MultilingualContent);
                        }
                      }}
                      disabled={isTranslating}
                      className="h-7 px-2"
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {Object.keys(LANGUAGE_CONFIG).filter(l => l !== lang && value[l as keyof MultilingualContent].trim()).length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const sourceLang = Object.keys(LANGUAGE_CONFIG).find(l => 
                          l !== lang && value[l as keyof MultilingualContent].trim()
                        ) as keyof MultilingualContent;
                        if (sourceLang) {
                          copyContent(sourceLang, lang as keyof MultilingualContent);
                        }
                      }}
                      className="h-7 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {translationHistory[lang]?.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreFromHistory(lang as keyof MultilingualContent, 0)}
                      className="h-7 px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {renderInput(lang as keyof MultilingualContent)}

              {/* Character count */}
              {maxLength && (
                <div className="text-xs text-muted-foreground text-right">
                  {value[lang as keyof MultilingualContent].length}/{maxLength}
                </div>
              )}

              {/* Translation history */}
              {translationHistory[lang]?.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Translation History:</Label>
                  <div className="space-y-1">
                    {translationHistory[lang].slice(-2).map((historyItem, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreFromHistory(lang as keyof MultilingualContent, index)}
                        className="h-auto p-2 text-left justify-start text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{historyItem}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Progress indicator */}
        {showTranslationStatus && completedCount < 3 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete all languages for better user experience. 
              {completedCount === 0 && " Start with English, then use translation tools for other languages."}
              {completedCount === 1 && " Add content for the remaining languages."}
              {completedCount === 2 && " Complete the final language to finish this section."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function to create empty multilingual content
export const createEmptyMultilingualContent = (): MultilingualContent => ({
  en: '',
  ar: '',
  fr: ''
});

// Utility function to validate multilingual content
export const validateMultilingualContent = (content: MultilingualContent, required = false): string | null => {
  if (required) {
    const hasEnglish = content.en.trim().length > 0;
    if (!hasEnglish) {
      return "English content is required";
    }
  }
  
  return null;
};

// Utility function to get the best available content for a given locale
export const getBestContent = (content: MultilingualContent, preferredLocale: keyof MultilingualContent = 'en'): string => {
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
};