'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Eye, AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { BasicInfoForm } from '@/components/admin/program-creation/basic-info-form';
import { ProgramStructureForm } from '@/components/admin/program-creation/program-structure-form';

import { WorkoutTemplatesForm } from '@/components/admin/program-creation/workout-templates-form';
import { GuideForm } from '@/components/admin/program-creation/guide-form';
import { AboutProgramForm } from '@/components/admin/program-creation/about-program-form';
import { GuideSectionData, normalizeGuideSections, sanitizeGuideSectionsForSubmit } from '@/lib/program-guide';

// Create a more flexible type for editing existing programs
type EditProgramFormData = {
  name: { en: string; ar: string; fr: string };
  description: { en: string; ar: string; fr: string };
  price: number;
  lemonSqueezyId?: string;
  lemonSqueezyVariantId?: string;
  programStructures: Array<{
    id?: string;
    name: { en: string; ar: string; fr: string };
    structureType: 'weekly' | 'cyclic';
    sessionCount?: number;
    trainingDays?: number;
    restDays?: number;
    weeklySchedule?: {
      day1?: string;
      day2?: string;
      day3?: string;
      day4?: string;
      day5?: string;
      day6?: string;
      day7?: string;
    };
    order: number;
    isDefault: boolean;
  }>;
  hasInteractiveBuilder: boolean;
  allowsCustomization: boolean;
  isActive: boolean;
  workoutNames: string[];
  categories: Array<unknown>;
  workoutTemplates: Array<{
    id: string;
    name: string;
    muscleGroups: string[];
    exercisesPerMuscle?: Record<string, number>;
    volumeRange?: Record<string, { min: number; max: number }>;
    exercises: unknown[];
  }>;
  guideSections?: GuideSectionData[];
  aboutContent?: string;
  thumbnailUrl?: string;
};

// Type definitions
interface ExerciseData {
  id: string;
  targetedMuscle?: 'CHEST' | 'BACK' | 'SIDE_DELTS' | 'FRONT_DELTS' | 'REAR_DELTS' | 'ELBOW_FLEXORS' | 'TRICEPS' | 'FOREARMS' | 'ABS' | 'GLUTES' | 'QUADRICEPS' | 'HAMSTRINGS' | 'ADDUCTORS' | 'CALVES' | 'ERECTORS' | 'OBLIQUES' | 'HIP_FLEXORS';
  selectedExercise?: string;
}

interface CategoryData {
  id: string;
  category: string;
}

import { updateTrainingProgram } from '@/app/api/admin/programs/actions';
import { showToast } from '@/lib/toast';
import AdminLayout from '@/components/admin-layout';

// Types for the program data
interface TrainingProgramData {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  lemonSqueezyId?: string;
  lemonSqueezyVariantId?: string;
  hasInteractiveBuilder: boolean;
  allowsCustomization: boolean;
  aboutContent?: string;
  thumbnailUrl?: string;
  workoutNames?: string[];
  programGuide?: {
    content: unknown;
  };
  programStructures?: Array<{
    id: string;
    name: Record<string, string>;
    structureType: 'weekly' | 'cyclic';
    sessionCount?: number;
    trainingDays?: number;
    restDays?: number;
    weeklySchedule?: Record<string, string>;
    order: number;
    isDefault: boolean;
  }>;
  workoutTemplates: Array<{
    id: string;
    name: Record<string, string>;
    order: number;
    requiredMuscleGroups: string[];
    exercisesPerMuscle?: Record<string, number>;
    volumeRange?: Record<string, { min: number; max: number }>;
  }>;
  isActive: boolean;
}

// Function to fetch program data
async function fetchProgramData(programId: string): Promise<TrainingProgramData> {
  const response = await fetch(`/api/admin/programs/${programId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch program data');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch program data');
  }

  return result.data;
}

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<EditProgramFormData>({
    mode: 'onChange',
    defaultValues: {
      name: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' },
      price: 0,
      lemonSqueezyId: '',
      lemonSqueezyVariantId: '',
      programStructures: [{
        name: { en: '', ar: '', fr: '' },
        structureType: 'weekly' as const,
        sessionCount: 4,
        trainingDays: 3,
        restDays: 1,
        weeklySchedule: {
          day1: '',
          day2: '',
          day3: '',
          day4: '',
          day5: '',
          day6: '',
          day7: '',
        },
        order: 0,
        isDefault: true,
      }],
      hasInteractiveBuilder: true,
      allowsCustomization: true,
      isActive: true,
      workoutNames: [],
      categories: [],
      workoutTemplates: [],
      guideSections: [],
      aboutContent: '',
      thumbnailUrl: '',
    }
  });

  const { getValues, formState: { isValid }, reset } = methods;

  // Load program data on mount
  useEffect(() => {
    async function loadProgramData() {
      try {
        setIsLoading(true);
        setError(null);
        const programData = await fetchProgramData(programId);
        
        // Transform workout templates to match form structure
        const transformedWorkoutTemplates = programData.workoutTemplates.map((template, idx) => ({
          id: template.id,
          name: template.name.en || `Workout ${idx + 1}`,
          muscleGroups: template.requiredMuscleGroups,
          exercisesPerMuscle: template.exercisesPerMuscle || {},
          volumeRange: template.volumeRange || {},
          // Extract exercise data from the name field if it exists (temporary workaround)
          exercises: (template.name as Record<string, unknown>)?._exerciseData as unknown[] || [], // Exercises would need to be loaded separately if needed
        }));

        // Transform program structures from API response
        const transformedProgramStructures = programData.programStructures && programData.programStructures.length > 0 
          ? programData.programStructures.map((structure) => ({
              id: structure.id,
              name: structure.name,
              structureType: structure.structureType,
              sessionCount: structure.sessionCount,
              trainingDays: structure.trainingDays,
              restDays: structure.restDays,
              weeklySchedule: structure.weeklySchedule || {
                day1: '',
                day2: '',
                day3: '',
                day4: '',
                day5: '',
                day6: '',
                day7: '',
              },
              order: structure.order,
              isDefault: structure.isDefault,
            }))
          : [{
              name: { en: 'Default Structure', ar: '', fr: '' },
              structureType: 'weekly' as const,
              sessionCount: 4,
              trainingDays: 3,
              restDays: 1,
              weeklySchedule: {
                day1: '',
                day2: '',
                day3: '',
                day4: '',
                day5: '',
                day6: '',
                day7: '',
              },
              order: 0,
              isDefault: true,
            }];

        const transformedGuideSections = normalizeGuideSections(programData.programGuide?.content);

        if (process.env.NODE_ENV === 'development') {
      console.log('Loaded program data:', {
      workoutNames: programData.workoutNames,
      workoutNamesType: typeof programData.workoutNames,
      workoutNamesIsArray: Array.isArray(programData.workoutNames)
      });
    }

        // Reset form with fetched data
        reset({
          name: programData.name,
          description: programData.description,
          price: programData.price,
          lemonSqueezyId: programData.lemonSqueezyId || '',
          lemonSqueezyVariantId: programData.lemonSqueezyVariantId || '',
          programStructures: transformedProgramStructures,
          hasInteractiveBuilder: programData.hasInteractiveBuilder,
          allowsCustomization: programData.allowsCustomization,
          isActive: programData.isActive,
          workoutNames: Array.isArray(programData.workoutNames) ? programData.workoutNames : [],
          categories: [], // Start with empty - will be populated if/when categories tab is implemented
          workoutTemplates: transformedWorkoutTemplates,
          guideSections: transformedGuideSections,
          aboutContent: programData.aboutContent || '',
          thumbnailUrl: programData.thumbnailUrl || '',
        });
      } catch (err) {
        console.error('Error loading program data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load program data');
        showToast.error('Error', 'Failed to load program data');
      } finally {
        setIsLoading(false);
      }
    }

    if (programId) {
      loadProgramData();
    }
  }, [programId, reset]);

  // Handle program update
  const handleUpdateProgram = async () => {
    try {
      setIsSubmitting(true);
      
      const data = getValues();
  const sanitizedGuideSections = sanitizeGuideSectionsForSubmit(data.guideSections);
      
      // Basic validation
      if (!data.name?.en || !data.description?.en || data.price < 0) {
        showToast.error('Validation Error', 'Please complete all required fields: name, description, and price.');
        return;
      }
      
      // Transform data for API - convert from form data to API schema
      const transformedData = {
        id: programId,
        name: data.name,
        description: data.description,
        price: data.price,
        lemonSqueezyId: data.lemonSqueezyId,
        lemonSqueezyVariantId: data.lemonSqueezyVariantId,
        // Use the first program structure for now (backward compatibility)
        programStructures: data.programStructures,
        hasInteractiveBuilder: data.hasInteractiveBuilder,
        allowsCustomization: data.allowsCustomization,
        isActive: data.isActive,
        workoutNames: data.workoutNames,
        guideSections: sanitizedGuideSections,
        aboutContent: data.aboutContent || '',
        thumbnailUrl: data.thumbnailUrl || '',
        workoutTemplates: data.workoutTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          muscleGroups: template.muscleGroups,
          exercisesPerMuscle: template.exercisesPerMuscle,
          volumeRange: template.volumeRange,
          exercises: (template.exercises || []).map((exercise: unknown) => {
            const ex = exercise as ExerciseData;
            return {
              id: ex.id,
              targetedMuscle: ex.targetedMuscle,
              selectedExercise: ex.selectedExercise
            };
          })
        })),
        categories: (data.categories || []).map((category: unknown) => {
          const cat = category as CategoryData;
          return {
            id: cat.id,
            category: cat.category
          };
        })
      };

      if (process.env.NODE_ENV === 'development') { console.log('Updating program with data:', transformedData); }

      const result = await updateTrainingProgram(transformedData);
      
      if (result.success) {
        showToast.success('Success', 'Training program updated successfully!');
        router.push(`/admin/programs/${programId}`);
      } else {
        showToast.error('Error', result.error || 'Failed to update program');
      }
    } catch (error) {
      console.error('Error updating program:', error);
      showToast.error('Error', 'An unexpected error occurred while updating the program');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty onSubmit to prevent accidental form submissions
  const onSubmit = async () => {
    // Prevent any accidental form submissions from inputs, Enter keys, etc.
    if (process.env.NODE_ENV === 'development') { console.log('Form submission blocked to prevent accidental validation'); }
    return false;
  };

  // Save individual tab progress
  const saveTabProgress = async (tabId: string) => {
    setSavingTab(tabId);
    try {
      const formData = getValues();
      
      // Basic validation checks based on the tab
      let isValid = true;
      let errorMessage = '';
      
      switch (tabId) {
        case 'basic-info':
          if (!formData.name?.en || !formData.description?.en || formData.price < 0) {
            isValid = false;
            errorMessage = 'Please fill in all required basic information fields.';
          }
          break;
        case 'structure':
          if (!formData.programStructures || formData.programStructures.length === 0) {
            isValid = false;
            errorMessage = 'Please configure at least one program structure.';
          }
          break;
        case 'workouts':
          // Allow empty workout templates for now
          break;
        default:
          break;
      }
      
      if (isValid) {
        toast.success(`${tabs.find(t => t.id === tabId)?.label} validated successfully!`);
      } else {
        toast.error(`Validation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error(`Error validating ${tabId} tab:`, error);
      toast.error(`Failed to validate ${tabs.find(t => t.id === tabId)?.label}. Please try again.`);
    } finally {
      setSavingTab(null);
    }
  };

  const tabs = [
    { 
      id: 'basic-info', 
      label: 'Basic Info', 
      component: BasicInfoForm,
      description: 'Program details'
    },
    { 
      id: 'structure', 
      label: 'Program Structure', 
      component: ProgramStructureForm,
      description: 'Workout flow'
    },
    {
      id: 'workouts', 
      label: 'Workout Templates', 
      component: WorkoutTemplatesForm,
      description: 'Session design'
    },
    {
      id: 'guide', 
      label: 'Training Guide', 
      component: GuideForm,
      description: 'User instructions'
    },
    {
      id: 'about', 
      label: 'About Program', 
      component: AboutProgramForm,
      description: 'Program details'
    },
  ];

  // Calculate completion progress
  const completionProgress = () => {
    const data = getValues();
    let completed = 0;
    const total = 4;
    
    // Basic info check
    if (data.name?.en && data.description?.en && data.price >= 0) completed++;
    
    // Structure check
    if (data.programStructures && data.programStructures.length > 0 && data.programStructures[0].structureType) completed++;
    
    // Categories check (always consider complete for now)
    completed++;
    
    // Workouts check
    if (data.workoutTemplates && data.workoutTemplates.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Get tab completion status
  const getTabCompletionStatus = (tabId: string) => {
    const data = getValues();
    switch (tabId) {
      case 'basic-info':
        return !!(data.name?.en && data.description?.en && data.price >= 0);
      case 'structure':
        return !!(data.programStructures && data.programStructures.length > 0 && data.programStructures[0].structureType);
      case 'categories':
        return true; // Always true for now
      case 'workouts':
        return !!(data.workoutTemplates && data.workoutTemplates.length > 0);
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Skeleton className="h-10 w-20 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
          
          {/* Form Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex items-start gap-4 mb-8">
            <Button variant="ghost" asChild className="shrink-0">
              <Link href={`/admin/programs/${programId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-3">Error Loading Program</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {error}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/admin/programs">Return to Programs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (isPreviewMode) {
    const data = getValues();
    return (
      <AdminLayout>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Editor</span>
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleUpdateProgram}
                disabled={!isValid || isSubmitting}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Program'}</span>
              </Button>
            </div>
          </div>
          
          {/* Preview content would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" asChild className="shrink-0 mt-1">
                <Link href={`/admin/programs/${programId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
                  Edit Training Program
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Modify program details, structure, and workout templates
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-2">
                <Progress value={completionProgress()} className="w-24 h-2" />
                <Badge variant={completionProgress() === 100 ? "default" : "secondary"} className="shrink-0">
                  {tabs.filter(tab => getTabCompletionStatus(tab.id)).length}/{tabs.length} sections
                </Badge>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-muted">
                  {tabs.map((tab) => {
                    const isCompleted = getTabCompletionStatus(tab.id);
                    const isActive = activeTab === tab.id;
                    return (
                      <TabsTrigger 
                        key={tab.id} 
                        value={tab.id} 
                        className={`text-xs flex flex-col items-center space-y-1 p-3 h-auto relative transition-all duration-200 ${
                          isCompleted 
                            ? 'data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-300 dark:data-[state=active]:border-green-700/50 bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/30' 
                            : 'data-[state=active]:bg-background data-[state=active]:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          {isCompleted ? (
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : isActive ? (
                            <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{tab.description}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{tab.label}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{tab.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => saveTabProgress(tab.id)}
                            disabled={savingTab === tab.id}
                            className="shrink-0"
                          >
                            {savingTab === tab.id ? 'Saving...' : 'Save Draft'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <tab.component />
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(true)}
                className="flex items-center space-x-2"
                disabled={completionProgress() < 50}
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleUpdateProgram}
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Program'}</span>
              </Button>
            </div>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Update Program</AlertTitle>
            <AlertDescription>
              Fill in the required fields (name and description) to enable the Update Program button.
            </AlertDescription>
          </Alert>
        </form>
      </FormProvider>
    </AdminLayout>
  );
}