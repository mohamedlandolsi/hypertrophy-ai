'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Home, X, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Step4Data {
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  gymBudget?: number;
}

interface Step4Props {
  onNext: (data: Step4Data) => void;
  onBack: () => void;
  initialData?: Step4Data;
}

const EQUIPMENT_SUGGESTIONS = [
  'dumbbells',
  'barbell',
  'resistanceBands',
  'pullUpBar',
  'bench',
  'squatRack',
  'kettlebells',
  'cableMachine',
  'smithMachine',
  'legPress',
  'latPulldown',
  'cardioMachines'
];

export function Step4TrainingEnvironment({ onNext, onBack, initialData = {} }: Step4Props) {
  const t = useTranslations('Onboarding.step4');
  const [formData, setFormData] = useState<Step4Data>({
    equipmentAvailable: [],
    ...initialData
  });
  const [newEquipment, setNewEquipment] = useState('');

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

  const updateField = (field: keyof Step4Data, value: boolean | string[] | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addEquipment = (equipment: string) => {
    const currentEquipment = formData.equipmentAvailable || [];
    if (equipment.trim() && !currentEquipment.includes(equipment.trim())) {
      updateField('equipmentAvailable', [...currentEquipment, equipment.trim()]);
      setNewEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    const currentEquipment = formData.equipmentAvailable || [];
    updateField('equipmentAvailable', currentEquipment.filter(e => e !== equipment));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Home className="mr-2 h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>{t('fields.trainingLocation')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gymAccess"
                  checked={formData.gymAccess || false}
                  onCheckedChange={(checked: boolean) => updateField('gymAccess', checked)}
                />
                <Label htmlFor="gymAccess">{t('fields.gymAccess')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeGym"
                  checked={formData.homeGym || false}
                  onCheckedChange={(checked: boolean) => updateField('homeGym', checked)}
                />
                <Label htmlFor="homeGym">{t('fields.homeGym')}</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>{t('fields.availableEquipment')}</Label>
            <div className="space-y-3">
              {/* Current equipment */}
              <div className="flex flex-wrap gap-2">
                {(formData.equipmentAvailable || []).map((equipment) => (
                  <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                    {equipment}
                    <X 
                      size={12} 
                      className="cursor-pointer hover:text-red-500" 
                      onClick={() => removeEquipment(equipment)}
                    />
                  </Badge>
                ))}
              </div>

              {/* Add equipment input */}
              <div className="flex gap-2">
                <Input
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder={t('fields.addEquipment')}
                  onFocus={handleInputFocus}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEquipment(newEquipment);
                    }
                  }}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => addEquipment(newEquipment)}
                  disabled={!newEquipment.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Equipment suggestions */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t('fields.quickAdd')}</Label>
                <div className="flex flex-wrap gap-1">
                  {EQUIPMENT_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => addEquipment(t(`equipmentOptions.${suggestion}`))}
                      disabled={(formData.equipmentAvailable || []).includes(t(`equipmentOptions.${suggestion}`))}
                    >
                      {t(`equipmentOptions.${suggestion}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {formData.gymAccess && (
            <div>
              <Label htmlFor="gymBudget">{t('fields.gymBudget')}</Label>
              <Input
                id="gymBudget"
                type="number"
                min="0"
                step="1"
                value={formData.gymBudget || ''}
                onChange={(e) => updateField('gymBudget', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={t('fields.gymBudgetPlaceholder')}
                onFocus={handleInputFocus}
              />
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              {t('back')}
            </Button>
            <Button type="submit">
              {t('completeSetup')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
