'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { completeOnboarding, saveOnboardingData } from './actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

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
  dataProcessingConsent?: boolean;

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
  const t = useTranslations('Onboarding');

  const totalSteps = 4;

  const handleSkip = async () => {
    try {
      setIsSubmitting(true);
      const result = await completeOnboarding();
      
      if (result.success) {
        // Show success message briefly before redirect
        toast({
          title: t('toasts.welcomeTitle'),
          description: t('toasts.welcomeSkipDescription'),
        });
        
        // Redirect to chat
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: t('toasts.errorTitle'),
        description: t('toasts.errorSkipDescription'),
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
          title: t('toasts.welcomeTitle'),
          description: t('toasts.welcomeCompleteDescription'),
        });
        
        // Redirect to chat
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: t('toasts.errorTitle'),
        description: t('toasts.errorSaveDescription'),
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
            {t('welcome.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  {t('progress.stepOf', { current: step, total: totalSteps })}
                </CardTitle>
                <CardDescription>
                  {step === 1 && t('stepTitles.personalInfo')}
                  {step === 2 && t('stepTitles.trainingBackground')}
                  {step === 3 && t('stepTitles.goalsMotivation')}
                  {step === 4 && t('stepTitles.trainingEnvironment')}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                {t('progress.skipForNow')}
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
          {t('footer.updateLater')}
        </div>
      </div>
    </div>
  );
}
