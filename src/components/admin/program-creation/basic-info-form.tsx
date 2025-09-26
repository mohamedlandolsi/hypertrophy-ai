'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Languages, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

import type { ProgramCreationInput } from '@/lib/validations/program-creation';

export function BasicInfoForm() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ProgramCreationInput>();
  const [translatingName, setTranslatingName] = useState<{ar: boolean, fr: boolean}>({ ar: false, fr: false });
  const [translatingDesc, setTranslatingDesc] = useState<{ar: boolean, fr: boolean}>({ ar: false, fr: false });
  const [usdPrice, setUsdPrice] = useState<string>('');
  const [tndPrice, setTndPrice] = useState<string>('');
  const [convertingPrice, setConvertingPrice] = useState(false);
  
  const englishName = watch('name.en');
  const englishDescription = watch('description.en');
  const price = watch('price');

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

  // Currency conversion function
  const convertUsdToTnd = async (usdAmount: number): Promise<number> => {
    try {
      const response = await fetch('/api/exchange-rates?base=TND');
      if (response.ok) {
        const data = await response.json();
        const usdRate = data.rates?.USD; // 1 TND = X USD
        if (usdRate) {
          return usdAmount / usdRate; // Convert USD to TND
        }
      }
      
      // Fallback rate: 1 USD ≈ 3.15 TND (approximate)
      return usdAmount * 3.15;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Fallback rate
      return usdAmount * 3.15;
    }
  };

  // Handle USD price input and convert to TND
  const handleUsdPriceChange = async (usdValue: string) => {
    setUsdPrice(usdValue);
    
    const numericUsd = parseFloat(usdValue);
    if (!isNaN(numericUsd) && numericUsd > 0) {
      setConvertingPrice(true);
      try {
        const tndAmount = await convertUsdToTnd(numericUsd);
        const centsAmount = Math.round(tndAmount * 100); // Store as cents
        setTndPrice(tndAmount.toFixed(2));
        setValue('price', centsAmount);
      } catch (error) {
        console.error('Price conversion error:', error);
        toast.error('Failed to convert price to TND');
      } finally {
        setConvertingPrice(false);
      }
    } else {
      setTndPrice('');
      setValue('price', 0);
    }
  };

  // Initialize USD price from existing cents value
  useEffect(() => {
    if (price && price > 0 && !usdPrice) {
      const convertCentsToUsd = async () => {
        try {
          const tndAmount = price / 100; // Convert cents to TND
          const response = await fetch('/api/exchange-rates?base=TND');
          if (response.ok) {
            const data = await response.json();
            const usdRate = data.rates?.USD;
            if (usdRate) {
              const usdAmount = tndAmount * usdRate; // Convert TND to USD
              setUsdPrice(usdAmount.toFixed(2));
              setTndPrice(tndAmount.toFixed(2));
              return;
            }
          }
          
          // Fallback conversion
          const usdAmount = tndAmount / 3.15;
          setUsdPrice(usdAmount.toFixed(2));
          setTndPrice(tndAmount.toFixed(2));
        } catch (error) {
          console.error('Initial price conversion failed:', error);
        }
      };
      
      convertCentsToUsd();
    }
  }, [price, usdPrice]);

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
            <Label htmlFor="priceUsd">Price (USD)</Label>
            <div className="space-y-2">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  id="priceUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  value={usdPrice}
                  onChange={(e) => handleUsdPriceChange(e.target.value)}
                  className="pl-10"
                />
                {convertingPrice && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>
              {tndPrice && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                  ≈ {tndPrice} TND (Tunisian Dinar)
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the price in US Dollars. It will be automatically converted to TND for storage.
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