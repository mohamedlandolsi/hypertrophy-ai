'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Step2Data {
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  preferredTrainingStyle?: string;
  trainingSchedule?: string;
  availableTime?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
}

interface Step2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  initialData?: Step2Data;
}

export function Step2TrainingInfo({ onNext, onBack, initialData = {} }: Step2Props) {
  const [formData, setFormData] = useState<Step2Data>(initialData);
  const t = useTranslations('Onboarding.step2');

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

  const updateField = (field: keyof Step2Data, value: string | number | undefined) => {
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
          <Activity className="mr-2 h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">{t('fields.experience')}</Label>
              <Select value={formData.trainingExperience || ''} onValueChange={(value) => updateField('trainingExperience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.experiencePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('experienceOptions.beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('experienceOptions.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('experienceOptions.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weeklyDays">{t('fields.weeklyDays')}</Label>
              <Select 
                value={formData.weeklyTrainingDays?.toString() || ''} 
                onValueChange={(value) => updateField('weeklyTrainingDays', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.weeklyDaysPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">{t('daysOptions.2days')}</SelectItem>
                  <SelectItem value="3">{t('daysOptions.3days')}</SelectItem>
                  <SelectItem value="4">{t('daysOptions.4days')}</SelectItem>
                  <SelectItem value="5">{t('daysOptions.5days')}</SelectItem>
                  <SelectItem value="6">{t('daysOptions.6days')}</SelectItem>
                  <SelectItem value="7">{t('daysOptions.7days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainingStyle">{t('fields.trainingStyle')}</Label>
              <Select value={formData.preferredTrainingStyle || ''} onValueChange={(value) => updateField('preferredTrainingStyle', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.trainingStylePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hypertrophy">{t('trainingStyleOptions.hypertrophy')}</SelectItem>
                  <SelectItem value="strength">{t('trainingStyleOptions.strength')}</SelectItem>
                  <SelectItem value="powerlifting">{t('trainingStyleOptions.powerlifting')}</SelectItem>
                  <SelectItem value="bodybuilding">{t('trainingStyleOptions.bodybuilding')}</SelectItem>
                  <SelectItem value="general">{t('trainingStyleOptions.general')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trainingSchedule">{t('fields.trainingSchedule')}</Label>
              <Select value={formData.trainingSchedule || ''} onValueChange={(value) => updateField('trainingSchedule', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.trainingSchedulePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t('scheduleOptions.morning')}</SelectItem>
                  <SelectItem value="afternoon">{t('scheduleOptions.afternoon')}</SelectItem>
                  <SelectItem value="evening">{t('scheduleOptions.evening')}</SelectItem>
                  <SelectItem value="flexible">{t('scheduleOptions.flexible')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="availableTime">{t('fields.availableTime')}</Label>
              <Input
                id="availableTime"
                type="number"
                min="15"
                max="180"
                value={formData.availableTime || ''}
                onChange={(e) => updateField('availableTime', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={t('fields.availableTimePlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
            <div>
              <Label htmlFor="activityLevel">{t('fields.activityLevel')}</Label>
              <Select value={formData.activityLevel || ''} onValueChange={(value) => updateField('activityLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fields.activityLevelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDENTARY">{t('activityLevelOptions.sedentary')}</SelectItem>
                  <SelectItem value="LIGHT">{t('activityLevelOptions.light')}</SelectItem>
                  <SelectItem value="MODERATE">{t('activityLevelOptions.moderate')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('activityLevelOptions.active')}</SelectItem>
                  <SelectItem value="VERY_ACTIVE">{t('activityLevelOptions.veryActive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              {t('back')}
            </Button>
            <Button type="submit">
              {t('continue')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
