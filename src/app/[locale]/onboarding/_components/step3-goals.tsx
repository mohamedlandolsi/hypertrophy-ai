'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Step3Data {
  primaryGoal?: string;
  secondaryGoals?: string[];
  targetWeight?: number;
  targetBodyFat?: number;
  goalDeadline?: string;
  motivation?: string;
}

interface Step3Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  initialData?: Step3Data;
}

const SECONDARY_GOAL_OPTIONS = [
  'increaseStrength',
  'improveEndurance',
  'betterSleep',
  'reduceStress',
  'betterPosture',
  'increaseEnergy',
  'sportPerformance',
  'injuryPrevention'
];

export function Step3GoalsMotivation({ onNext, onBack, initialData = {} }: Step3Props) {
  const t = useTranslations('Onboarding.step3');
  const [formData, setFormData] = useState<Step3Data>({
    secondaryGoals: [],
    ...initialData
  });

  const updateField = (field: keyof Step3Data, value: string | number | string[] | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSecondaryGoal = (goal: string) => {
    const currentGoals = formData.secondaryGoals || [];
    if (currentGoals.includes(goal)) {
      updateField('secondaryGoals', currentGoals.filter(g => g !== goal));
    } else {
      updateField('secondaryGoals', [...currentGoals, goal]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="primaryGoal">{t('fields.primaryGoal')}</Label>
            <Select value={formData.primaryGoal || ''} onValueChange={(value) => updateField('primaryGoal', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('fields.primaryGoalPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="muscle_gain">{t('primaryGoalOptions.muscleGain')}</SelectItem>
                <SelectItem value="fat_loss">{t('primaryGoalOptions.fatLoss')}</SelectItem>
                <SelectItem value="strength">{t('primaryGoalOptions.strength')}</SelectItem>
                <SelectItem value="general_fitness">{t('primaryGoalOptions.generalFitness')}</SelectItem>
                <SelectItem value="athletic_performance">{t('primaryGoalOptions.athleticPerformance')}</SelectItem>
                <SelectItem value="body_recomposition">{t('primaryGoalOptions.bodyRecomposition')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('fields.secondaryGoals')}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SECONDARY_GOAL_OPTIONS.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={(formData.secondaryGoals || []).includes(goal)}
                    onCheckedChange={() => toggleSecondaryGoal(goal)}
                  />
                  <Label htmlFor={goal} className="text-sm">{t(`secondaryGoalOptions.${goal}`)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="targetWeight">{t('fields.targetWeight')}</Label>
              <Input
                id="targetWeight"
                type="number"
                min="30"
                max="200"
                step="0.1"
                value={formData.targetWeight || ''}
                onChange={(e) => updateField('targetWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.targetWeightPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="targetBodyFat">{t('fields.targetBodyFat')}</Label>
              <Input
                id="targetBodyFat"
                type="number"
                min="3"
                max="35"
                step="0.1"
                value={formData.targetBodyFat || ''}
                onChange={(e) => updateField('targetBodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.targetBodyFatPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="goalDeadline">{t('fields.goalDeadline')}</Label>
              <Input
                id="goalDeadline"
                type="date"
                value={formData.goalDeadline || ''}
                onChange={(e) => updateField('goalDeadline', e.target.value || undefined)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="motivation">{t('fields.motivation')}</Label>
            <Textarea
              id="motivation"
              value={formData.motivation || ''}
              onChange={(e) => updateField('motivation', e.target.value)}
              placeholder={t('fields.motivationPlaceholder')}
              rows={3}
            />
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
