'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, Check, Loader2,
  FileText, Layout, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SplitSelector, { type SplitSelectorData } from '@/components/SplitSelector';

interface ProgramInfo {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | '';
}

export default function CreateProgramPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [programInfo, setProgramInfo] = useState<ProgramInfo>({
    name: '',
    description: '',
    difficulty: ''
  });

  const [splitData, setSplitData] = useState<SplitSelectorData | null>(null);

  // Loading state
  const [creating, setCreating] = useState(false);

  // Validation
  const canProceedFromStep1 = () => {
    return programInfo.name.trim().length > 0 && programInfo.difficulty !== '';
  };

  const canProceedFromStep2 = () => {
    return splitData !== null;
  };

  const handleNext = () => {
    if (currentStep === 1 && !canProceedFromStep1()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (currentStep === 2 && !canProceedFromStep2()) {
      toast.error('Please select a training split and structure');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSplitComplete = (data: SplitSelectorData) => {
    setSplitData(data);
    // Auto-advance to review step
    setCurrentStep(3);
  };

  const handleCreateProgram = async () => {
    if (!splitData) {
      toast.error('Missing required selections');
      return;
    }

    try {
      setCreating(true);

      // Create program with all details
      const response = await fetch('/api/user/programs/create-guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programInfo.name.trim(),
          description: programInfo.description.trim(),
          difficulty: programInfo.difficulty,
          splitId: splitData.splitId,
          structureId: splitData.structureId,
          workoutStructureType: 'REPEATING', // Default value
          customDayAssignments: splitData.customDayAssignments
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create program');
      }

      toast.success('Program created successfully!');
      
      // Redirect to workouts page for exercise configuration
      router.push(`/${locale}/programs/${data.program.id}/workouts`);
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create program');
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <FileText className="h-5 w-5" />;
      case 2:
        return <Dumbbell className="h-5 w-5" />;
      case 3:
        return <Layout className="h-5 w-5" />;
      case 4:
        return <Target className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Training Program</h1>
        <p className="text-muted-foreground">
          Follow the steps to build your personalized training program
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "flex items-center",
                step < 4 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  step < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : step === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  getStepIcon(step)
                )}
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          <CardTitle>
            {currentStep === 1 && 'Program Information'}
            {currentStep === 2 && 'Select Training Split'}
            {currentStep === 3 && 'Choose Workout Structure'}
            {currentStep === 4 && 'Review & Create'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Enter the basic details of your training program'}
            {currentStep === 2 && 'Choose the type of training split that matches your goals'}
            {currentStep === 3 && 'Select how often you want to train per week'}
            {currentStep === 4 && 'Review your selections and create your program'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Program Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Program Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Strength Program"
                  value={programInfo.name}
                  onChange={(e) => setProgramInfo({ ...programInfo, name: e.target.value })}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {programInfo.name.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your program goals, approach, and what you want to achieve..."
                  rows={4}
                  value={programInfo.description}
                  onChange={(e) => setProgramInfo({ ...programInfo, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">
                  Difficulty Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={programInfo.difficulty}
                  onValueChange={(value: any) => setProgramInfo({ ...programInfo, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor('beginner')}>Beginner</Badge>
                        <span className="text-xs text-muted-foreground">New to training</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor('intermediate')}>Intermediate</Badge>
                        <span className="text-xs text-muted-foreground">6+ months experience</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor('advanced')}>Advanced</Badge>
                        <span className="text-xs text-muted-foreground">2+ years experience</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Split Selection */}
          {currentStep === 2 && (
            <div>
              <SplitSelector
                onSelect={handleSplitSelect}
                selectedSplitId={splitSelection?.splitId}
              />
            </div>
          )}

          {/* Step 3: Structure Selection */}
          {currentStep === 3 && splitSelection && (
            <div>
              <WorkoutStructureSelector
                splitId={splitSelection.splitId}
                onSelect={handleStructureSelect}
                selectedStructureId={structureSelection?.structureId}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Ready to create your program!</p>
              </div>

              {/* Program Info Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    PROGRAM DETAILS
                  </h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="text-lg font-semibold">{programInfo.name}</p>
                        </div>
                        {programInfo.description && (
                          <div>
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="text-sm">{programInfo.description}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                          <Badge className={getDifficultyColor(programInfo.difficulty)}>
                            {programInfo.difficulty.charAt(0).toUpperCase() + programInfo.difficulty.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Split Summary */}
                {splitSelection && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      TRAINING SPLIT
                    </h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Split Type</p>
                            <p className="text-lg font-semibold">{splitSelection.splitName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                            <Badge className={getDifficultyColor(splitSelection.difficulty)}>
                              {splitSelection.difficulty}
                            </Badge>
                          </div>
                          {splitSelection.focusAreas.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Focus Areas</p>
                              <div className="flex flex-wrap gap-1">
                                {splitSelection.focusAreas.map((area, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Structure Summary */}
                {structureSelection && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      WORKOUT STRUCTURE
                    </h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Training Frequency</p>
                            <p className="text-lg font-semibold">
                              {structureSelection.daysPerWeek} days per week
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pattern</p>
                            <p className="text-sm">{structureSelection.pattern}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Structure Type</p>
                            <Badge variant="outline">
                              {structureSelection.workoutStructureType}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  After creating your program, you&apos;ll be taken to the customization page where you can
                  fine-tune your workouts, add exercises, and configure advanced settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || creating}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateProgram}
            disabled={creating}
            size="lg"
            className="min-w-[200px]"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Program...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Program
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
