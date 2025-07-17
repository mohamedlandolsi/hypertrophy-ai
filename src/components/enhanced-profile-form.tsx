'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Save, 
  User, 
  Target, 
  Activity, 
  Heart, 
  Home, 
  Dumbbell,
  Scale,
  Zap,
  Trophy,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  ProfileAvatar, 
  StepperInput, 
  SegmentedControl, 
  GoalCard, 
  DayPicker 
} from '@/components/ui/enhanced-profile-inputs';

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
  trainingStructureType?: string;
  weeklyTrainingDays?: number;
  trainingCycle?: string;
  customCyclePattern?: string;
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
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
            {item}
            <X 
              size={12} 
              className="cursor-pointer hover:text-red-500 transition-colors" 
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
          className="flex-1"
        />
        <Button 
          type="button" 
          size="sm" 
          onClick={() => addItem(inputValue)}
          disabled={!inputValue.trim()}
          className="px-3"
        >
          <Plus size={16} />
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
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

export default function EnhancedProfileForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Load existing profile data and user info
  useEffect(() => {
    const loadProfileAndUser = async () => {
      setIsLoading(true);
      try {
        // Load user info first
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        setAvatarUrl(currentUser?.user_metadata?.avatar_url || '');

        // Load profile data
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setFormData(data.profile || {});
        }
      } catch (error) {
        console.error('Error loading profile and user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileAndUser();
  }, []);

  const updateField = (field: keyof ProfileFormData, value: ProfileFormData[keyof ProfileFormData]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

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
          title: "Profile Saved!",
          description: "Your profile has been updated successfully.",
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const goalOptions = [
    {
      value: 'muscle_gain',
      label: 'Build Muscle',
      description: 'Gain lean muscle mass',
      icon: <Dumbbell size={20} />
    },
    {
      value: 'fat_loss',
      label: 'Lose Fat',
      description: 'Reduce body fat percentage',
      icon: <Scale size={20} />
    },
    {
      value: 'strength',
      label: 'Get Stronger',
      description: 'Increase overall strength',
      icon: <Trophy size={20} />
    },
    {
      value: 'endurance',
      label: 'Improve Endurance',
      description: 'Enhance cardiovascular fitness',
      icon: <Zap size={20} />
    }
  ];

  const experienceOptions = [
    { value: 'beginner', label: 'Beginner', icon: <User size={16} /> },
    { value: 'intermediate', label: 'Intermediate', icon: <Activity size={16} /> },
    { value: 'advanced', label: 'Advanced', icon: <Trophy size={16} /> }
  ];

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Customize your profile to get personalized training recommendations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardContent className="pt-6">
            <ProfileAvatar 
              name={formData.name || user?.user_metadata?.full_name}
              imageUrl={avatarUrl}
              onImageUpdate={(url) => {
                setAvatarUrl(url);
                toast({
                  title: "Success",
                  description: "Profile picture updated successfully",
                });
              }}
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Details
              </CardTitle>
              <CardDescription>
                Basic information about you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <StepperInput
                label="Age"
                value={formData.age}
                onChange={(value) => updateField('age', value)}
                min={13}
                max={120}
                placeholder="Enter your age"
                unit="years"
              />

              <SegmentedControl
                label="Gender"
                value={formData.gender}
                onChange={(value) => updateField('gender', value)}
                options={genderOptions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Physical Metrics
              </CardTitle>
              <CardDescription>
                Your current physical measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepperInput
                label="Height"
                value={formData.height}
                onChange={(value) => updateField('height', value)}
                min={120}
                max={250}
                placeholder="Enter your height"
                unit="cm"
              />

              <StepperInput
                label="Weight"
                value={formData.weight}
                onChange={(value) => updateField('weight', value)}
                min={30}
                max={300}
                step={0.5}
                placeholder="Enter your weight"
                unit="kg"
              />

              <StepperInput
                label="Body Fat %"
                value={formData.bodyFatPercentage}
                onChange={(value) => updateField('bodyFatPercentage', value)}
                min={3}
                max={50}
                step={0.5}
                placeholder="Optional"
                unit="%"
              />
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Fitness Goals
            </CardTitle>
            <CardDescription>
              What do you want to achieve?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Primary Goal</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalOptions.map((goal) => (
                  <GoalCard
                    key={goal.value}
                    label={goal.label}
                    description={goal.description}
                    icon={goal.icon}
                    selected={formData.primaryGoal === goal.value}
                    onSelect={() => updateField('primaryGoal', goal.value)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepperInput
                label="Target Weight"
                value={formData.targetWeight}
                onChange={(value) => updateField('targetWeight', value)}
                min={30}
                max={300}
                step={0.5}
                placeholder="Optional"
                unit="kg"
              />

              <StepperInput
                label="Target Body Fat %"
                value={formData.targetBodyFat}
                onChange={(value) => updateField('targetBodyFat', value)}
                min={3}
                max={50}
                step={0.5}
                placeholder="Optional"
                unit="%"
              />
            </div>
          </CardContent>
        </Card>

        {/* Training Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Training Profile
            </CardTitle>
            <CardDescription>
              Tell us about your training experience and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SegmentedControl
              label="Training Experience"
              value={formData.trainingExperience}
              onChange={(value) => updateField('trainingExperience', value)}
              options={experienceOptions}
            />

            <div>
              <Label htmlFor="trainingStructure">Training Structure</Label>
              <Select value={formData.trainingStructureType || ''} onValueChange={(value) => updateField('trainingStructureType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How do you structure your training?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (fixed days per week)</SelectItem>
                  <SelectItem value="cycle">Cycle-based (days on/off pattern)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trainingStructureType === 'weekly' && (
              <DayPicker
                label="Training Days per Week"
                value={formData.weeklyTrainingDays}
                onChange={(value) => updateField('weeklyTrainingDays', value)}
              />
            )}

            {formData.trainingStructureType === 'cycle' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trainingCycle">Training Cycle Pattern</Label>
                  <Select value={formData.trainingCycle || ''} onValueChange={(value) => updateField('trainingCycle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your training cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_on_1_off">1 day on, 1 day off</SelectItem>
                      <SelectItem value="2_on_1_off">2 days on, 1 day off</SelectItem>
                      <SelectItem value="3_on_1_off">3 days on, 1 day off</SelectItem>
                      <SelectItem value="2_on_2_off">2 days on, 2 days off</SelectItem>
                      <SelectItem value="3_on_2_off">3 days on, 2 days off</SelectItem>
                      <SelectItem value="custom">Custom pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.trainingCycle === 'custom' && (
                  <div>
                    <Label htmlFor="customCycle">Custom Cycle Description</Label>
                    <Input
                      id="customCycle"
                      value={formData.customCyclePattern || ''}
                      onChange={(e) => updateField('customCyclePattern', e.target.value)}
                      placeholder="Describe your custom training cycle (e.g., '4 days on, 3 days off')"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepperInput
                label="Session Duration"
                value={formData.availableTime}
                onChange={(value) => updateField('availableTime', value)}
                min={15}
                max={240}
                step={15}
                placeholder="Typical session length"
                unit="min"
              />
            </div>
          </CardContent>
        </Card>

        {/* Health & Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Health & Limitations
            </CardTitle>
            <CardDescription>
              Help us keep you safe and healthy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ArrayInput
              label="Injuries"
              value={formData.injuries || []}
              onChange={(value) => updateField('injuries', value)}
              placeholder="Add any current or past injuries..."
              suggestions={['Knee', 'Lower back', 'Shoulder', 'Wrist', 'Ankle']}
            />

            <ArrayInput
              label="Physical Limitations"
              value={formData.limitations || []}
              onChange={(value) => updateField('limitations', value)}
              placeholder="Add any physical limitations..."
              suggestions={['Mobility issues', 'Joint problems', 'Chronic pain']}
            />

            <ArrayInput
              label="Medications"
              value={formData.medications || []}
              onChange={(value) => updateField('medications', value)}
              placeholder="Add any medications that might affect training..."
            />

            <ArrayInput
              label="Allergies"
              value={formData.allergies || []}
              onChange={(value) => updateField('allergies', value)}
              placeholder="Add an allergy"
              suggestions={[
                'Nuts',
                'Dairy',
                'Gluten',
                'Shellfish',
                'Eggs',
                'Soy',
                'Fish',
                'Sesame',
                'Peanuts',
                'Tree nuts',
                'Wheat',
                'Lactose'
              ]}
            />
          </CardContent>
        </Card>

        {/* Training Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Training Environment
            </CardTitle>
            <CardDescription>
              Where and how you train
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Training Location</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gymAccess"
                    checked={formData.gymAccess || false}
                    onCheckedChange={(checked) => updateField('gymAccess', checked)}
                  />
                  <Label htmlFor="gymAccess">I have gym access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="homeGym"
                    checked={formData.homeGym || false}
                    onCheckedChange={(checked) => updateField('homeGym', checked)}
                  />
                  <Label htmlFor="homeGym">I have a home gym setup</Label>
                </div>
              </div>
            </div>

            <ArrayInput
              label="Available Equipment"
              value={formData.equipmentAvailable || []}
              onChange={(value) => updateField('equipmentAvailable', value)}
              placeholder="Add equipment you have access to..."
              suggestions={[
                'Dumbbells',
                'Barbell',
                'Resistance bands',
                'Pull-up bar',
                'Bench',
                'Squat rack',
                'Kettlebells',
                'Cable machine',
                'Treadmill',
                'Elliptical',
                'Rowing machine',
                'Leg press',
                'Lat pulldown',
                'Smith machine'
              ]}
            />

            <StepperInput
              label="Monthly Gym Budget"
              value={formData.gymBudget}
              onChange={(value) => updateField('gymBudget', value)}
              min={0}
              max={500}
              step={10}
              placeholder="Optional budget"
              unit="$"
            />
          </CardContent>
        </Card>

        {/* Lifestyle Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Lifestyle
            </CardTitle>
            <CardDescription>
              Your daily habits and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StepperInput
                label="Average Sleep Hours"
                value={formData.sleepHours}
                onChange={(value) => updateField('sleepHours', value)}
                min={1}
                max={15}
                step={0.5}
                placeholder="e.g., 7.5"
                unit="hours"
              />

              <div className="space-y-2">
                <Label htmlFor="stressLevel">Stress Level</Label>
                <Select 
                  value={formData.stressLevel || ''} 
                  onValueChange={(value) => updateField('stressLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stress level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MODERATE">Moderate</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="VERY_HIGH">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ArrayInput
              label="Dietary Preferences"
              value={formData.dietaryPreferences || []}
              onChange={(value) => updateField('dietaryPreferences', value)}
              placeholder="Add a dietary preference"
              suggestions={[
                'Vegetarian',
                'Vegan',
                'Keto',
                'Paleo',
                'Mediterranean',
                'Intermittent fasting',
                'Low carb',
                'High protein',
                'Gluten-free',
                'Dairy-free',
                'Pescatarian',
                'Carnivore'
              ]}
            />

            <ArrayInput
              label="Supplements Used"
              value={formData.supplementsUsed || []}
              onChange={(value) => updateField('supplementsUsed', value)}
              placeholder="Add a supplement"
              suggestions={[
                'Protein powder',
                'Creatine',
                'Multivitamin',
                'Fish oil',
                'Vitamin D',
                'BCAAs',
                'Pre-workout',
                'Post-workout',
                'Omega-3',
                'Magnesium',
                'Zinc',
                'Vitamin B12',
                'Caffeine',
                'Beta-alanine'
              ]}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="px-8 py-3 text-lg font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
