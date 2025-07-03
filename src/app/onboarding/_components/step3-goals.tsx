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
  'Increase strength',
  'Improve endurance',
  'Better sleep quality',
  'Reduce stress',
  'Better posture',
  'Increase energy',
  'Sport performance',
  'Injury prevention'
];

export function Step3GoalsMotivation({ onNext, onBack, initialData = {} }: Step3Props) {
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
          Goals and Motivation
        </CardTitle>
        <CardDescription>
          What do you want to achieve? This helps us personalize your journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="primaryGoal">Primary Goal</Label>
            <Select value={formData.primaryGoal || ''} onValueChange={(value) => updateField('primaryGoal', value)}>
              <SelectTrigger>
                <SelectValue placeholder="What's your main goal?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="muscle_gain">Build Muscle</SelectItem>
                <SelectItem value="fat_loss">Lose Fat</SelectItem>
                <SelectItem value="strength">Get Stronger</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
                <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Secondary Goals (optional)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SECONDARY_GOAL_OPTIONS.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={(formData.secondaryGoals || []).includes(goal)}
                    onCheckedChange={() => toggleSecondaryGoal(goal)}
                  />
                  <Label htmlFor={goal} className="text-sm">{goal}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="targetWeight">Target Weight (kg) - optional</Label>
              <Input
                id="targetWeight"
                type="number"
                min="30"
                max="200"
                step="0.1"
                value={formData.targetWeight || ''}
                onChange={(e) => updateField('targetWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Goal weight"
              />
            </div>
            <div>
              <Label htmlFor="targetBodyFat">Target Body Fat % - optional</Label>
              <Input
                id="targetBodyFat"
                type="number"
                min="3"
                max="35"
                step="0.1"
                value={formData.targetBodyFat || ''}
                onChange={(e) => updateField('targetBodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Goal body fat %"
              />
            </div>
            <div>
              <Label htmlFor="goalDeadline">Goal Deadline - optional</Label>
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
            <Label htmlFor="motivation">What motivates you? (optional)</Label>
            <Textarea
              id="motivation"
              value={formData.motivation || ''}
              onChange={(e) => updateField('motivation', e.target.value)}
              placeholder="Tell us what drives you to reach your fitness goals..."
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
