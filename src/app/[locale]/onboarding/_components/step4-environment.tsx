'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Home, X, Plus } from 'lucide-react';

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
  'Dumbbells',
  'Barbell',
  'Resistance bands',
  'Pull-up bar',
  'Bench',
  'Squat rack',
  'Kettlebells',
  'Cable machine',
  'Smith machine',
  'Leg press',
  'Lat pulldown',
  'Cardio machines'
];

export function Step4TrainingEnvironment({ onNext, onBack, initialData = {} }: Step4Props) {
  const [formData, setFormData] = useState<Step4Data>({
    equipmentAvailable: [],
    ...initialData
  });
  const [newEquipment, setNewEquipment] = useState('');

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
          Training Environment
        </CardTitle>
        <CardDescription>
          Tell us about your training setup so we can create workouts that fit your environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Training Location</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gymAccess"
                  checked={formData.gymAccess || false}
                  onCheckedChange={(checked: boolean) => updateField('gymAccess', checked)}
                />
                <Label htmlFor="gymAccess">I have gym access</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeGym"
                  checked={formData.homeGym || false}
                  onCheckedChange={(checked: boolean) => updateField('homeGym', checked)}
                />
                <Label htmlFor="homeGym">I have a home gym setup</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Available Equipment (optional)</Label>
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
                  placeholder="Add equipment"
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
                <Label className="text-sm text-muted-foreground">Quick add:</Label>
                <div className="flex flex-wrap gap-1">
                  {EQUIPMENT_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => addEquipment(suggestion)}
                      disabled={(formData.equipmentAvailable || []).includes(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {formData.gymAccess && (
            <div>
              <Label htmlFor="gymBudget">Monthly Gym/Equipment Budget (optional)</Label>
              <Input
                id="gymBudget"
                type="number"
                min="0"
                step="1"
                value={formData.gymBudget || ''}
                onChange={(e) => updateField('gymBudget', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 50"
              />
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">
              Complete Setup
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
