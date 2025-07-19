'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  StepperInput, 
  SegmentedControl, 
  GoalCard, 
  DayPicker 
} from '@/components/ui/enhanced-profile-inputs';
import { EnhancedAvatarUpload } from '@/components/ui/enhanced-avatar-upload';

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
  const t = useTranslations('EnhancedProfileForm');
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
      label: t('options.goals.buildMuscle'),
      description: t('options.goalDescriptions.buildMuscle'),
      icon: <Dumbbell size={20} />
    },
    {
      value: 'fat_loss',
      label: t('options.goals.loseFat'),
      description: t('options.goalDescriptions.loseFat'),
      icon: <Scale size={20} />
    },
    {
      value: 'strength',
      label: t('options.goals.getStronger'),
      description: t('options.goalDescriptions.getStronger'),
      icon: <Trophy size={20} />
    },
    {
      value: 'endurance',
      label: t('options.goals.improveEndurance'),
      description: t('options.goalDescriptions.improveEndurance'),
      icon: <Zap size={20} />
    }
  ];

  const experienceOptions = [
    { value: 'beginner', label: t('options.experience.beginner'), icon: <User size={16} /> },
    { value: 'intermediate', label: t('options.experience.intermediate'), icon: <Activity size={16} /> },
    { value: 'advanced', label: t('options.experience.advanced'), icon: <Trophy size={16} /> }
  ];

  const genderOptions = [
    { value: 'MALE', label: t('options.gender.male') },
    { value: 'FEMALE', label: t('options.gender.female') }
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
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardContent className="pt-6">
            <EnhancedAvatarUpload 
              name={formData.name || user?.user_metadata?.full_name}
              imageUrl={avatarUrl}
              onImageUpdate={(url: string) => {
                setAvatarUrl(url);
                toast({
                  title: "Success",
                  description: "Profile picture updated successfully",
                });
              }}
              size="lg"
              showRemoveButton={true}
              allowEdit={true}
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('sections.personalInfo.title')}
              </CardTitle>
              <CardDescription>
                {t('sections.personalInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('sections.personalInfo.name')}</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t('placeholders.enterName')}
                />
              </div>
              
              <StepperInput
                label={t('sections.personalInfo.age')}
                value={formData.age}
                onChange={(value) => updateField('age', value)}
                min={13}
                max={120}
                placeholder={t('placeholders.enterAge')}
                unit={t('units.years')}
              />

              <SegmentedControl
                label={t('sections.personalInfo.gender')}
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
                {t('sections.physicalMetrics.title')}
              </CardTitle>
              <CardDescription>
                {t('sections.physicalMetrics.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StepperInput
                label={t('sections.personalInfo.height')}
                value={formData.height}
                onChange={(value) => updateField('height', value)}
                min={120}
                max={250}
                placeholder={t('placeholders.enterHeight')}
                unit={t('units.cm')}
              />

              <StepperInput
                label={t('sections.personalInfo.weight')}
                value={formData.weight}
                onChange={(value) => updateField('weight', value)}
                min={30}
                max={300}
                step={0.5}
                placeholder={t('placeholders.enterWeight')}
                unit={t('units.kg')}
              />

              <StepperInput
                label={t('sections.personalInfo.bodyFat')}
                value={formData.bodyFatPercentage}
                onChange={(value) => updateField('bodyFatPercentage', value)}
                min={3}
                max={50}
                step={0.5}
                placeholder={t('placeholders.enterBodyFat')}
                unit={t('units.percent')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('sections.fitnessGoals.title')}
            </CardTitle>
            <CardDescription>
              {t('sections.fitnessGoals.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>{t('sections.fitnessGoals.primaryGoal')}</Label>
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
                label={t('sections.goals.targetWeight')}
                value={formData.targetWeight}
                onChange={(value) => updateField('targetWeight', value)}
                min={30}
                max={300}
                step={0.5}
                placeholder={t('placeholders.optional')}
                unit={t('units.kg')}
              />

              <StepperInput
                label={t('sections.goals.targetBodyFat')}
                value={formData.targetBodyFat}
                onChange={(value) => updateField('targetBodyFat', value)}
                min={3}
                max={50}
                step={0.5}
                placeholder={t('placeholders.optional')}
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
              {t('sections.trainingProfile.title')}
            </CardTitle>
            <CardDescription>
              {t('sections.trainingProfile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SegmentedControl
              label={t('sections.goals.trainingExperience')}
              value={formData.trainingExperience}
              onChange={(value) => updateField('trainingExperience', value)}
              options={experienceOptions}
            />

            <div>
              <Label htmlFor="trainingStructure">{t('sections.goals.trainingStructure')}</Label>
              <Select value={formData.trainingStructureType || ''} onValueChange={(value) => updateField('trainingStructureType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectTrainingStructure')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('options.trainingStructure.weekly')}</SelectItem>
                  <SelectItem value="cycle">{t('options.trainingStructure.cycle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trainingStructureType === 'weekly' && (
              <DayPicker
                label={t('labels.trainingDaysPerWeek')}
                value={formData.weeklyTrainingDays}
                onChange={(value) => updateField('weeklyTrainingDays', value)}
              />
            )}

            {formData.trainingStructureType === 'cycle' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trainingCycle">{t('sections.goals.trainingCyclePattern')}</Label>
                  <Select value={formData.trainingCycle || ''} onValueChange={(value) => updateField('trainingCycle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectTrainingCycle')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_on_1_off">{t('options.trainingCycle.1_on_1_off')}</SelectItem>
                      <SelectItem value="2_on_1_off">{t('options.trainingCycle.2_on_1_off')}</SelectItem>
                      <SelectItem value="3_on_1_off">{t('options.trainingCycle.3_on_1_off')}</SelectItem>
                      <SelectItem value="2_on_2_off">{t('options.trainingCycle.2_on_2_off')}</SelectItem>
                      <SelectItem value="3_on_2_off">{t('options.trainingCycle.3_on_2_off')}</SelectItem>
                      <SelectItem value="custom">{t('options.trainingCycle.custom')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.trainingCycle === 'custom' && (
                  <div>
                    <Label htmlFor="customCycle">{t('sections.goals.customCycleDescription')}</Label>
                    <Input
                      id="customCycle"
                      value={formData.customCyclePattern || ''}
                      onChange={(e) => updateField('customCyclePattern', e.target.value)}
                      placeholder={t('placeholders.describeCustomCycle')}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepperInput
                label={t('sections.goals.sessionDuration')}
                value={formData.availableTime}
                onChange={(value) => updateField('availableTime', value)}
                min={15}
                max={240}
                step={15}
                placeholder={t('placeholders.typicalSessionLength')}
                unit={t('units.min')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Health & Limitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('sections.health.title')}
            </CardTitle>
            <CardDescription>
              {t('sections.health.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ArrayInput
              label={t('labels.injuries')}
              value={formData.injuries || []}
              onChange={(value) => updateField('injuries', value)}
              placeholder={t('placeholders.addInjuries')}
              suggestions={[
                t('bodyParts.knee'),
                t('bodyParts.lowerBack'),
                t('bodyParts.shoulder'),
                t('bodyParts.wrist'),
                t('bodyParts.ankle')
              ]}
            />

            <ArrayInput
              label={t('labels.physicalLimitations')}
              value={formData.limitations || []}
              onChange={(value) => updateField('limitations', value)}
              placeholder={t('placeholders.addLimitations')}
              suggestions={[
                t('limitationTypes.mobilityIssues'),
                t('limitationTypes.jointProblems'),
                t('limitationTypes.chronicPain')
              ]}
            />

            <ArrayInput
              label={t('labels.medications')}
              value={formData.medications || []}
              onChange={(value) => updateField('medications', value)}
              placeholder={t('placeholders.addMedications')}
            />

            <ArrayInput
              label={t('labels.allergies')}
              value={formData.allergies || []}
              onChange={(value) => updateField('allergies', value)}
              placeholder={t('placeholders.addAllergy')}
              suggestions={[
                t('allergyTypes.nuts'),
                t('allergyTypes.dairy'),
                t('allergyTypes.gluten'),
                t('allergyTypes.shellfish'),
                t('allergyTypes.eggs'),
                t('allergyTypes.soy'),
                t('allergyTypes.fish'),
                t('allergyTypes.sesame'),
                t('allergyTypes.peanuts'),
                t('allergyTypes.treeNuts')
              ]}
            />
          </CardContent>
        </Card>

        {/* Training Environment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {t('sections.environment.title')}
            </CardTitle>
            <CardDescription>
              {t('sections.environment.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>{t('labels.trainingLocation')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gymAccess"
                    checked={formData.gymAccess || false}
                    onCheckedChange={(checked) => updateField('gymAccess', checked)}
                  />
                  <Label htmlFor="gymAccess">{t('labels.iHaveGymAccess')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="homeGym"
                    checked={formData.homeGym || false}
                    onCheckedChange={(checked) => updateField('homeGym', checked)}
                  />
                  <Label htmlFor="homeGym">{t('labels.iHaveHomeGymSetup')}</Label>
                </div>
              </div>
            </div>

            <ArrayInput
              label={t('labels.availableEquipment')}
              value={formData.equipmentAvailable || []}
              onChange={(value) => updateField('equipmentAvailable', value)}
              placeholder={t('placeholders.addEquipment')}
              suggestions={[
                t('equipmentTypes.dumbbells'),
                t('equipmentTypes.barbell'),
                t('equipmentTypes.resistanceBands'),
                t('equipmentTypes.pullUpBar'),
                t('equipmentTypes.bench'),
                t('equipmentTypes.squatRack'),
                t('equipmentTypes.kettlebells'),
                t('equipmentTypes.cableMachine'),
                t('equipmentTypes.treadmill'),
                t('equipmentTypes.elliptical'),
                t('equipmentTypes.rowingMachine'),
                t('equipmentTypes.legPress'),
                t('equipmentTypes.latPulldown'),
                t('equipmentTypes.smithMachine')
              ]}
            />

            <StepperInput
              label={t('sections.environment.budget')}
              value={formData.gymBudget}
              onChange={(value) => updateField('gymBudget', value)}
              min={0}
              max={500}
              step={10}
              placeholder={t('placeholders.optionalBudget')}
              unit={t('units.dollar')}
            />
          </CardContent>
        </Card>

        {/* Lifestyle Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('sections.lifestyle.title')}
            </CardTitle>
            <CardDescription>
              {t('sections.lifestyle.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StepperInput
                label={t('labels.averageSleepHours')}
                value={formData.sleepHours}
                onChange={(value) => updateField('sleepHours', value)}
                min={1}
                max={15}
                step={0.5}
                placeholder={t('placeholders.sleepHoursExample')}
                unit={t('units.hours')}
              />

              <div className="space-y-2">
                <Label htmlFor="stressLevel">{t('sections.lifestyle.stressLevel')}</Label>
                <Select 
                  value={formData.stressLevel || ''} 
                  onValueChange={(value) => updateField('stressLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectStressLevel')} />
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
              label={t('labels.dietaryPreferences')}
              value={formData.dietaryPreferences || []}
              onChange={(value) => updateField('dietaryPreferences', value)}
              placeholder={t('placeholders.addDietaryPreference')}
              suggestions={[
                t('dietaryOptions.vegetarian'),
                t('dietaryOptions.vegan'),
                t('dietaryOptions.keto'),
                t('dietaryOptions.paleo'),
                t('dietaryOptions.mediterranean'),
                t('dietaryOptions.intermittentFasting'),
                t('dietaryOptions.lowCarb'),
                t('dietaryOptions.highProtein'),
                t('dietaryOptions.glutenFree'),
                t('dietaryOptions.dairyFree'),
                t('dietaryOptions.pescatarian'),
                t('dietaryOptions.carnivore')
              ]}
            />

            <ArrayInput
              label={t('labels.supplementsUsed')}
              value={formData.supplementsUsed || []}
              onChange={(value) => updateField('supplementsUsed', value)}
              placeholder={t('placeholders.addSupplement')}
              suggestions={[
                t('supplementOptions.proteinPowder'),
                t('supplementOptions.creatine'),
                t('supplementOptions.multivitamin'),
                t('supplementOptions.fishOil'),
                t('supplementOptions.vitaminD'),
                t('supplementOptions.bcaas'),
                t('supplementOptions.preWorkout'),
                t('supplementOptions.postWorkout'),
                t('supplementOptions.omega3'),
                t('supplementOptions.magnesium'),
                t('supplementOptions.zinc'),
                t('supplementOptions.vitaminB12'),
                t('supplementOptions.caffeine'),
                t('supplementOptions.betaAlanine')
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
                {t('messages.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('buttons.saveChanges')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
