'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, User, Target, Activity, Heart, Home, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormData {
  // Personal Information
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  height?: number;
  weight?: number;
  bodyFatPercentage?: number;

  // Training Information
  trainingExperience?: string;
  weeklyTrainingDays?: number;
  preferredTrainingStyle?: string;
  trainingSchedule?: string;
  availableTime?: number;
  activityLevel?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

  // Goals and Motivation
  primaryGoal?: string;
  secondaryGoals?: string[];
  targetWeight?: number;
  targetBodyFat?: number;
  goalDeadline?: string;
  motivation?: string;

  // Health and Limitations
  injuries?: string[];
  limitations?: string[];
  medications?: string[];
  allergies?: string[];

  // Preferences and Lifestyle
  dietaryPreferences?: string[];
  foodDislikes?: string[];
  supplementsUsed?: string[];
  sleepHours?: number;
  stressLevel?: string;
  workSchedule?: string;

  // Training Environment
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  gymBudget?: number;

  // Progress Tracking
  currentBench?: number;
  currentSquat?: number;
  currentDeadlift?: number;
  currentOHP?: number;

  // Communication Preferences
  preferredLanguage?: string;
  communicationStyle?: string;
}

const ArrayInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  suggestions = []
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) => {
  const [inputValue, setInputValue] = useState('');

  const addItem = (item: string) => {
    if (item.trim() && !value.includes(item.trim())) {
      onChange([...value, item.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <X 
              size={12} 
              className="cursor-pointer hover:text-red-500" 
              onClick={() => removeItem(index)}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(inputValue);
            }
          }}
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={() => addItem(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus size={16} />
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => addItem(suggestion)}
              disabled={value.includes(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProfileForm() {
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setFormData({
              ...data.profile,
              goalDeadline: data.profile.goalDeadline ? 
                new Date(data.profile.goalDeadline).toISOString().split('T')[0] : undefined
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const updateField = (field: keyof ProfileFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Basic information about yourself for personalized coaching
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your name"
            />
          </div>
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
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              min="100"
              max="250"
              value={formData.height || ''}
              onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Height in centimeters"
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Weight in kilograms"
            />
          </div>
          <div>
            <Label htmlFor="bodyFat">Body Fat Percentage (%)</Label>
            <Input
              id="bodyFat"
              type="number"
              min="5"
              max="50"
              step="0.1"
              value={formData.bodyFatPercentage || ''}
              onChange={(e) => updateField('bodyFatPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
        </CardContent>
      </Card>

      {/* Training Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Training Information
          </CardTitle>
          <CardDescription>
            Your current training background and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="experience">Training Experience</Label>
            <Select value={formData.trainingExperience || ''} onValueChange={(value) => updateField('trainingExperience', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
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
            <Input
              id="weeklyDays"
              type="number"
              min="1"
              max="7"
              value={formData.weeklyTrainingDays || ''}
              onChange={(e) => updateField('weeklyTrainingDays', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="How many days per week?"
            />
          </div>
          <div>
            <Label htmlFor="activityLevel">Activity Level</Label>
            <Select value={formData.activityLevel || ''} onValueChange={(value) => updateField('activityLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEDENTARY">Sedentary (Little to no exercise)</SelectItem>
                <SelectItem value="LIGHT">Light (1-3 days/week)</SelectItem>
                <SelectItem value="MODERATE">Moderate (3-5 days/week)</SelectItem>
                <SelectItem value="ACTIVE">Active (6-7 days/week)</SelectItem>
                <SelectItem value="VERY_ACTIVE">Very Active (2x/day or physical job)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="trainingStyle">Preferred Training Style</Label>
            <Select value={formData.preferredTrainingStyle || ''} onValueChange={(value) => updateField('preferredTrainingStyle', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select training style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength Training</SelectItem>
                <SelectItem value="hypertrophy">Hypertrophy/Bodybuilding</SelectItem>
                <SelectItem value="powerlifting">Powerlifting</SelectItem>
                <SelectItem value="general_fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="schedule">Preferred Training Time</Label>
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
          <div>
            <Label htmlFor="availableTime">Available Time per Session (minutes)</Label>
            <Input
              id="availableTime"
              type="number"
              min="15"
              max="300"
              value={formData.availableTime || ''}
              onChange={(e) => updateField('availableTime', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 60"
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals and Motivation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Goals and Motivation
          </CardTitle>
          <CardDescription>
            What you want to achieve and what drives you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryGoal">Primary Goal</Label>
              <Select value={formData.primaryGoal || ''} onValueChange={(value) => updateField('primaryGoal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="What's your main goal?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muscle_gain">Build Muscle</SelectItem>
                  <SelectItem value="fat_loss">Lose Fat</SelectItem>
                  <SelectItem value="strength">Increase Strength</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                  <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="goalDeadline">Goal Deadline</Label>
              <Input
                id="goalDeadline"
                type="date"
                value={formData.goalDeadline || ''}
                onChange={(e) => updateField('goalDeadline', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="targetWeight">Target Weight (kg)</Label>
              <Input
                id="targetWeight"
                type="number"
                min="30"
                max="300"
                step="0.1"
                value={formData.targetWeight || ''}
                onChange={(e) => updateField('targetWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="targetBodyFat">Target Body Fat (%)</Label>
              <Input
                id="targetBodyFat"
                type="number"
                min="5"
                max="50"
                step="0.1"
                value={formData.targetBodyFat || ''}
                onChange={(e) => updateField('targetBodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>
          <ArrayInput
            label="Secondary Goals"
            value={formData.secondaryGoals || []}
            onChange={(value) => updateField('secondaryGoals', value)}
            placeholder="Add a secondary goal"
            suggestions={["Improve endurance", "Better sleep", "Stress relief", "Confidence", "Athletic performance"]}
          />
          <div>
            <Label htmlFor="motivation">What motivates you?</Label>
            <Textarea
              id="motivation"
              value={formData.motivation || ''}
              onChange={(e) => updateField('motivation', e.target.value)}
              placeholder="Tell me what drives you to pursue fitness..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Health and Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5" />
            Health and Limitations
          </CardTitle>
          <CardDescription>
            Important health information for safe training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArrayInput
            label="Injuries or Past Injuries"
            value={formData.injuries || []}
            onChange={(value) => updateField('injuries', value)}
            placeholder="Add an injury"
            suggestions={["Lower back", "Knee", "Shoulder", "Wrist", "Ankle", "Hip"]}
          />
          <ArrayInput
            label="Physical Limitations"
            value={formData.limitations || []}
            onChange={(value) => updateField('limitations', value)}
            placeholder="Add a limitation"
            suggestions={["Limited mobility", "Chronic pain", "Joint issues", "Balance problems"]}
          />
          <ArrayInput
            label="Medications"
            value={formData.medications || []}
            onChange={(value) => updateField('medications', value)}
            placeholder="Add a medication"
          />
          <ArrayInput
            label="Allergies"
            value={formData.allergies || []}
            onChange={(value) => updateField('allergies', value)}
            placeholder="Add an allergy"
            suggestions={["Nuts", "Dairy", "Gluten", "Shellfish", "Eggs"]}
          />
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Lifestyle
          </CardTitle>
          <CardDescription>
            Your daily habits and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sleepHours">Average Sleep Hours</Label>
              <Input
                id="sleepHours"
                type="number"
                min="4"
                max="12"
                step="0.5"
                value={formData.sleepHours || ''}
                onChange={(e) => updateField('sleepHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 7.5"
              />
            </div>
            <div>
              <Label htmlFor="stressLevel">Stress Level</Label>
              <Select value={formData.stressLevel || ''} onValueChange={(value) => updateField('stressLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stress level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ArrayInput
            label="Dietary Preferences"
            value={formData.dietaryPreferences || []}
            onChange={(value) => updateField('dietaryPreferences', value)}
            placeholder="Add a dietary preference"
            suggestions={["Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean", "Intermittent fasting"]}
          />
          <ArrayInput
            label="Supplements Used"
            value={formData.supplementsUsed || []}
            onChange={(value) => updateField('supplementsUsed', value)}
            placeholder="Add a supplement"
            suggestions={["Protein powder", "Creatine", "Multivitamin", "Fish oil", "Vitamin D"]}
          />
        </CardContent>
      </Card>

      {/* Training Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Training Environment
          </CardTitle>
          <CardDescription>
            Where and how you train
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <ArrayInput
            label="Available Equipment"
            value={formData.equipmentAvailable || []}
            onChange={(value) => updateField('equipmentAvailable', value)}
            placeholder="Add equipment"
            suggestions={["Dumbbells", "Barbell", "Resistance bands", "Pull-up bar", "Bench", "Squat rack", "Kettlebells"]}
          />
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Current Strength Levels</CardTitle>
          <CardDescription>
            Your current 1RM or max lifts (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentBench">Bench Press (kg)</Label>
            <Input
              id="currentBench"
              type="number"
              min="0"
              step="0.5"
              value={formData.currentBench || ''}
              onChange={(e) => updateField('currentBench', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="currentSquat">Squat (kg)</Label>
            <Input
              id="currentSquat"
              type="number"
              min="0"
              step="0.5"
              value={formData.currentSquat || ''}
              onChange={(e) => updateField('currentSquat', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="currentDeadlift">Deadlift (kg)</Label>
            <Input
              id="currentDeadlift"
              type="number"
              min="0"
              step="0.5"
              value={formData.currentDeadlift || ''}
              onChange={(e) => updateField('currentDeadlift', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="currentOHP">Overhead Press (kg)</Label>
            <Input
              id="currentOHP"
              type="number"
              min="0"
              step="0.5"
              value={formData.currentOHP || ''}
              onChange={(e) => updateField('currentOHP', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
