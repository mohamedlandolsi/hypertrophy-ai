'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

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
          Training Information
        </CardTitle>
        <CardDescription>
          Tell us about your training background and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">Training Experience</Label>
              <Select value={formData.trainingExperience || ''} onValueChange={(value) => updateField('trainingExperience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weeklyDays">Training Days per Week</Label>
              <Select 
                value={formData.weeklyTrainingDays?.toString() || ''} 
                onValueChange={(value) => updateField('weeklyTrainingDays', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How many days?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="4">4 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="6">6 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainingStyle">Preferred Training Style</Label>
              <Select value={formData.preferredTrainingStyle || ''} onValueChange={(value) => updateField('preferredTrainingStyle', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="What's your preferred style?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hypertrophy">Hypertrophy/Muscle Building</SelectItem>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="powerlifting">Powerlifting</SelectItem>
                  <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                  <SelectItem value="general">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trainingSchedule">Preferred Training Time</Label>
              <Select value={formData.trainingSchedule || ''} onValueChange={(value) => updateField('trainingSchedule', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="When do you prefer to train?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="availableTime">Available Time per Session (minutes)</Label>
              <Input
                id="availableTime"
                type="number"
                min="15"
                max="180"
                value={formData.availableTime || ''}
                onChange={(e) => updateField('availableTime', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 60"
              />
            </div>
            <div>
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select value={formData.activityLevel || ''} onValueChange={(value) => updateField('activityLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Your general activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDENTARY">Sedentary (little to no exercise)</SelectItem>
                  <SelectItem value="LIGHT">Light (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="MODERATE">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="ACTIVE">Active (hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="VERY_ACTIVE">Very Active (very hard exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
