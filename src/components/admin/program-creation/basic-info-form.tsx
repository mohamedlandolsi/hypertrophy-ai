'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { ProgramCreationInput } from '@/lib/validations/program-creation';

export function BasicInfoForm() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ProgramCreationInput>();
  const [translatingName, setTranslatingName] = useState<{ar: boolean, fr: boolean}>({ ar: false, fr: false });
  const [translatingDesc, setTranslatingDesc] = useState<{ar: boolean, fr: boolean}>({ ar: false, fr: false });
  
  const englishName = watch('name.en');
  const englishDescription = watch('description.en');

  // Translation function using Gemini API
  const translateText = async (text: string, targetLang: 'ar' | 'fr'): Promise<string> => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Translation failed');
    }

    const data = await response.json();
    return data.translatedText;
  };

  const handleTranslateName = async (targetLang: 'ar' | 'fr') => {
    if (!englishName?.trim()) {
      toast.error('Please enter an English name first');
      return;
    }

    setTranslatingName(prev => ({ ...prev, [targetLang]: true }));
    
    try {
      const translated = await translateText(englishName, targetLang);
      setValue(`name.${targetLang}`, translated);
      toast.success(`Name translated to ${targetLang === 'ar' ? 'Arabic' : 'French'}`);
    } catch {
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslatingName(prev => ({ ...prev, [targetLang]: false }));
    }
  };

  const handleTranslateDescription = async (targetLang: 'ar' | 'fr') => {
    if (!englishDescription?.trim()) {
      toast.error('Please enter an English description first');
      return;
    }

    setTranslatingDesc(prev => ({ ...prev, [targetLang]: true }));
    
    try {
      const translated = await translateText(englishDescription, targetLang);
      setValue(`description.${targetLang}`, translated);
      toast.success(`Description translated to ${targetLang === 'ar' ? 'Arabic' : 'French'}`);
    } catch {
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslatingDesc(prev => ({ ...prev, [targetLang]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
          <CardDescription>
            Basic details about your training program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Program Name - All Languages */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Program Name</Label>
            
            {/* English Name */}
            <div>
              <Label htmlFor="name-en" className="flex items-center space-x-2">
                <span>English Name</span>
                <Badge variant="outline">🇺🇸</Badge>
              </Label>
              <Input 
                id="name-en"
                placeholder="e.g., Upper/Lower Split Program" 
                {...register('name.en')}
                className="mt-1"
              />
              {errors.name?.en && (
                <p className="text-sm text-red-600 mt-1">{errors.name.en.message}</p>
              )}
            </div>

            {/* Arabic Name */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="name-ar" className="flex items-center space-x-2">
                  <span>Arabic Name</span>
                  <Badge variant="outline">🇸🇦</Badge>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslateName('ar')}
                  disabled={!englishName?.trim() || translatingName.ar}
                  className="flex items-center space-x-1"
                >
                  {translatingName.ar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  <span>Translate</span>
                </Button>
              </div>
              <Input 
                id="name-ar"
                placeholder="البرنامج التدريبي العلوي/السفلي" 
                {...register('name.ar')}
                dir="rtl"
                className="mt-1 text-right"
              />
              {errors.name?.ar && (
                <p className="text-sm text-red-600 mt-1">{errors.name.ar.message}</p>
              )}
            </div>

            {/* French Name */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="name-fr" className="flex items-center space-x-2">
                  <span>French Name</span>
                  <Badge variant="outline">🇫🇷</Badge>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslateName('fr')}
                  disabled={!englishName?.trim() || translatingName.fr}
                  className="flex items-center space-x-1"
                >
                  {translatingName.fr ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  <span>Translate</span>
                </Button>
              </div>
              <Input 
                id="name-fr"
                placeholder="Programme Haut/Bas du Corps" 
                {...register('name.fr')}
                className="mt-1"
              />
              {errors.name?.fr && (
                <p className="text-sm text-red-600 mt-1">{errors.name.fr.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Program Description - All Languages */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Program Description</Label>
            
            {/* English Description */}
            <div>
              <Label htmlFor="description-en" className="flex items-center space-x-2">
                <span>English Description</span>
                <Badge variant="outline">🇺🇸</Badge>
              </Label>
              <Textarea 
                id="description-en"
                placeholder="Comprehensive description of the training program..."
                className="min-h-[100px] mt-1"
                {...register('description.en')}
              />
              {errors.description?.en && (
                <p className="text-sm text-red-600 mt-1">{errors.description.en.message}</p>
              )}
            </div>

            {/* Arabic Description */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description-ar" className="flex items-center space-x-2">
                  <span>Arabic Description</span>
                  <Badge variant="outline">🇸🇦</Badge>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslateDescription('ar')}
                  disabled={!englishDescription?.trim() || translatingDesc.ar}
                  className="flex items-center space-x-1"
                >
                  {translatingDesc.ar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  <span>Translate</span>
                </Button>
              </div>
              <Textarea 
                id="description-ar"
                placeholder="وصف شامل للبرنامج التدريبي..."
                className="min-h-[100px] mt-1 text-right"
                {...register('description.ar')}
                dir="rtl"
              />
              {errors.description?.ar && (
                <p className="text-sm text-red-600 mt-1">{errors.description.ar.message}</p>
              )}
            </div>

            {/* French Description */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description-fr" className="flex items-center space-x-2">
                  <span>French Description</span>
                  <Badge variant="outline">🇫🇷</Badge>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslateDescription('fr')}
                  disabled={!englishDescription?.trim() || translatingDesc.fr}
                  className="flex items-center space-x-1"
                >
                  {translatingDesc.fr ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Languages className="h-3 w-3" />
                  )}
                  <span>Translate</span>
                </Button>
              </div>
              <Textarea 
                id="description-fr"
                placeholder="Description complète du programme d'entraînement..."
                className="min-h-[100px] mt-1"
                {...register('description.fr')}
              />
              {errors.description?.fr && (
                <p className="text-sm text-red-600 mt-1">{errors.description.fr.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div>
            <Label htmlFor="price">Price (in cents)</Label>
            <Input 
              id="price"
              type="number"
              placeholder="2999 (for $29.99)"
              {...register('price', { valueAsNumber: true })}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the price in cents (e.g., 2999 for $29.99)
            </p>
            {errors.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}