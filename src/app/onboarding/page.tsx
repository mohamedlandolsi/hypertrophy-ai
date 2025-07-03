'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { completeOnboarding, saveOnboardingData } from './actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Import step components
import { Step1PersonalInfo } from './_components/step1-personal';
import { Step2TrainingInfo } from './_components/step2-training';
import { Step3GoalsMotivation } from './_components/step3-goals';
import { Step4TrainingEnvironment } from './_components/step4-environment';

interface OnboardingData {
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

  // Training Environment
  gymAccess?: boolean;
  homeGym?: boolean;
  equipmentAvailable?: string[];
  gymBudget?: number;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  const handleSkip = async () => {
    try {
      setIsSubmitting(true);
      const result = await completeOnboarding();
      
      if (result.success) {
        // Show success message briefly before redirect
        toast({
          title: 'Welcome to Hypertrophy AI!',
          description: 'You can complete your profile anytime from the Profile page.',
        });
        
        // Redirect to chat
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip onboarding. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleNext = (data: Partial<OnboardingData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
    
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Handle final submission
      handleFinalSubmit(updatedData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinalSubmit = async (finalData: OnboardingData) => {
    try {
      setIsSubmitting(true);
      
      // Convert date string to Date object if provided
      const dataToSave = {
        ...finalData,
        goalDeadline: finalData.goalDeadline ? new Date(finalData.goalDeadline) : undefined,
      };
      
      const result = await saveOnboardingData(dataToSave);
      
      if (result.success) {
        toast({
          title: 'Welcome to Hypertrophy AI!',
          description: 'Your profile has been set up successfully.',
        });
        
        // Redirect to chat
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Hypertrophy AI
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your profile to personalize your fitness journey
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  Step {step} of {totalSteps}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Personal Information'}
                  {step === 2 && 'Training Background'}
                  {step === 3 && 'Goals & Motivation'}
                  {step === 4 && 'Training Environment'}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip for now
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="w-full" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <Step1PersonalInfo 
              onNext={handleNext} 
              initialData={formData}
            />
          )}
          
          {step === 2 && (
            <Step2TrainingInfo 
              onNext={handleNext} 
              onBack={handleBack}
              initialData={formData}
            />
          )}
          
          {step === 3 && (
            <Step3GoalsMotivation 
              onNext={handleNext} 
              onBack={handleBack}
              initialData={formData}
            />
          )}
          
          {step === 4 && (
            <Step4TrainingEnvironment 
              onNext={handleNext} 
              onBack={handleBack}
              initialData={formData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          You can always update this information later in your profile settings
        </div>
      </div>
    </div>
  );
}
