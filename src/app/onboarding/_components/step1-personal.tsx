'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

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
          Personal Information
        </CardTitle>
        <CardDescription>
          Help us understand your basic profile to personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="100"
                value={formData.age || ''}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Your age"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="250"
                step="0.1"
                value={formData.height || ''}
                onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Height in cm"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="30"
                max="200"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Weight in kg"
              />
            </div>
            <div>
              <Label htmlFor="bodyFat">Body Fat % (optional)</Label>
              <Input
                id="bodyFat"
                type="number"
                min="3"
                max="50"
                step="0.1"
                value={formData.bodyFatPercentage || ''}
                onChange={(e) => updateField('bodyFatPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Body fat %"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full md:w-auto">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
