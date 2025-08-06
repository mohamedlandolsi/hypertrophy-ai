'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Step1Data {
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;
}

interface Step1Props {
  onNext: (data: Step1Data) => void;
  initialData?: Step1Data;
}

export function Step1PersonalInfo({ onNext, initialData = {} }: Step1Props) {
  const [formData, setFormData] = useState<Step1Data>(initialData);
  const t = useTranslations('Onboarding.step1');

  // Mobile keyboard handling - scroll input into view on focus
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // A short delay ensures the keyboard is fully visible before scrolling
    setTimeout(() => {
      event.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
  };

  const updateField = (field: keyof Step1Data, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('fields.name')}</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={t('fields.namePlaceholder')}
              onFocus={handleInputFocus}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">{t('fields.age')}</Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="100"
                value={formData.age || ''}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t('fields.agePlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
            <div>
              <Label htmlFor="gender">{t('fields.gender')}</Label>
              <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.genderPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t('genderOptions.male')}</SelectItem>
                  <SelectItem value="FEMALE">{t('genderOptions.female')}</SelectItem>
                  <SelectItem value="OTHER">{t('genderOptions.other')}</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">{t('genderOptions.preferNotToSay')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="height">{t('fields.height')}</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="250"
                step="0.1"
                value={formData.height || ''}
                onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.heightPlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
            <div>
              <Label htmlFor="weight">{t('fields.weight')}</Label>
              <Input
                id="weight"
                type="number"
                min="30"
                max="200"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.weightPlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
            <div>
              <Label htmlFor="bodyFat">{t('fields.bodyFat')}</Label>
              <Input
                id="bodyFat"
                type="number"
                min="3"
                max="50"
                step="0.1"
                value={formData.bodyFatPercentage || ''}
                onChange={(e) => updateField('bodyFatPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.bodyFatPlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full md:w-auto">
              {t('continue')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
