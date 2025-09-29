'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, AlertTriangle, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { BasicInfoForm } from '@/components/admin/program-creation/basic-info-form';
import { ProgramStructureForm } from '@/components/admin/program-creation/program-structure-form';

import { WorkoutTemplatesForm } from '@/components/admin/program-creation/workout-templates-form';
import { GuideForm } from '@/components/admin/program-creation/guide-form';
import { AboutProgramForm } from '@/components/admin/program-creation/about-program-form';
import { createTrainingProgram } from '@/app/api/admin/programs/actions';
import { sanitizeGuideSectionsForSubmit } from '@/lib/program-guide';

export default function CreateProgramPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const router = useRouter();

  const methods = useForm({
    defaultValues: {
      name: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' },
      price: 0,
      programStructures: [
        {
          name: { en: 'Weekly Structure', ar: 'هيكل أسبوعي', fr: 'Structure Hebdomadaire' },
          structureType: 'weekly' as 'weekly' | 'cyclic',
          sessionCount: 4,
          trainingDays: 3,
          restDays: 1,
          weeklySchedule: {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: '',
          },
          order: 0,
          isDefault: true,
        },
      ],
      hasInteractiveBuilder: true,
      allowsCustomization: true,
      categories: [],
      workoutTemplates: [],
      guideSections: [],
      aboutContent: '',
      thumbnailUrl: '',
      isActive: true,
    },
    mode: 'onChange',
  });

  const { handleSubmit, formState: { errors, isValid }, getValues, watch } = methods;

  // Watch form values to track completion
  const formValues = watch();

  // Calculate tab completion status
  const getTabCompletionStatus = (tabId: string) => {
    switch (tabId) {
      case 'basic-info':
        return formValues.name?.en && formValues.description?.en && formValues.price > 0;
      case 'structure':
        return formValues.programStructures?.length > 0 && formValues.programStructures.some((structure: { name?: { en?: string }; structureType?: string; sessionCount?: number; trainingDays?: number; restDays?: number }) => 
          structure.name?.en && structure.structureType && (
            (structure.structureType === 'weekly' && (structure.sessionCount || 0) > 0) ||
            (structure.structureType === 'cyclic' && (structure.trainingDays || 0) > 0 && (structure.restDays || 0) > 0)
          )
        );
      case 'categories':
        // Check if at least one category has a description filled out
        return formValues.categories?.length > 0 && formValues.categories.some((cat: { description?: { en?: string; ar?: string; fr?: string } }) => 
          cat.description?.en || cat.description?.ar || cat.description?.fr
        );
      case 'workouts':
        // Check if at least one workout template exists with a name
        return formValues.workoutTemplates?.length > 0 && formValues.workoutTemplates.some((workout: { name?: string }) => 
          workout.name && workout.name.trim().length > 0
        );
      default:
        return false;
    }
  };

  // Calculate overall progress
  const completionProgress = () => {
    const completed = tabs.filter(tab => getTabCompletionStatus(tab.id)).length;
    return Math.round((completed / tabs.length) * 100);
  };

  // Navigation helpers
  const navigateToNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const navigateToPrevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const canNavigateNext = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    return currentIndex < tabs.length - 1;
  };

  const canNavigatePrev = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    return currentIndex > 0;
  };

  // Handle intentional form submission (only from Create Program button)
  const handleCreateProgram = async () => {
    setIsSubmitting(true);
    try {
      const data = getValues();
      const sanitizedGuideSections = sanitizeGuideSectionsForSubmit(data.guideSections);
      const payload = {
        ...data,
        guideSections: sanitizedGuideSections,
      };
  console.log('Creating program with data:', payload);
      
      // Provide helpful validation guidance
      if (!data.categories || data.categories.length === 0) {
        toast.error('Please configure at least one category (Minimalist, Essentialist, or Maximalist) in the Category Config tab.');
        setActiveTab('categories');
        setIsSubmitting(false);
        return;
      }
      
      if (!data.workoutTemplates || data.workoutTemplates.length === 0) {
        toast.error('Please add at least one workout template in the Workout Templates tab.');
        setActiveTab('workouts');
        setIsSubmitting(false);
        return;
      }
      
  const result = await createTrainingProgram(payload);
      
      if (result.success) {
        toast.success('Program created successfully!');
        router.push(`/admin/programs`);
      } else {
        toast.error(result.error || 'Failed to create program');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      
      // Parse validation errors if they exist
      if (error instanceof Error && error.message.includes('validation')) {
        try {
          const validationErrors = JSON.parse(error.message.replace('Validation failed: ', ''));
          const errorMessages = validationErrors.map((err: { path: string[], message: string }) => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          toast.error(`Validation failed: ${errorMessages}`);
        } catch {
          toast.error('Please complete all required fields before creating the program.');
        }
      } else {
        toast.error('Failed to create program. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty onSubmit to prevent accidental form submissions
  const onSubmit = async () => {
    // Prevent any accidental form submissions from inputs, Enter keys, etc.
    console.log('Form submission blocked to prevent accidental validation');
    return false;
  };

  // Save individual tab progress
  const saveTabProgress = async (tabId: string) => {
    setSavingTab(tabId);
    try {
      const currentData = getValues();
      
      // Create a subset of data relevant to the current tab
      let tabData: Record<string, unknown> = {};
      switch (tabId) {
        case 'basic-info':
          tabData = {
            name: currentData.name,
            description: currentData.description,
            price: currentData.price,
          };
          break;
        case 'structure':
          tabData = {
            programStructures: currentData.programStructures,
          };
          break;
        case 'categories':
          tabData = {
            categories: currentData.categories,
          };
          break;
        case 'workouts':
          tabData = {
            workoutTemplates: currentData.workoutTemplates,
          };
          break;
      }

      console.log(`Saving ${tabId} tab data:`, tabData);
      
      // TODO: Implement actual API call to save draft
      // await saveProgramDraft(tabData, tabId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${tabs.find(t => t.id === tabId)?.label} saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${tabId} tab:`, error);
      toast.error(`Failed to save ${tabs.find(t => t.id === tabId)?.label}. Please try again.`);
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

  if (isPreviewMode) {
    const data = getValues();
    return (
      <div className="container mx-auto py-6">
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
              onClick={handleCreateProgram}
              disabled={!isValid || isSubmitting}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Program'}</span>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Program Preview</CardTitle>
            <CardDescription>Preview how your training program will appear to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{data.name?.en || 'Untitled Program'}</h3>
                <p className="text-muted-foreground">{data.description?.en || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Structures:</span> {data.programStructures?.length || 0} structure(s) defined</div>
                <div><span className="font-medium">Categories:</span> {data.categories?.join(', ') || 'None selected'}</div>
                <div><span className="font-medium">Price:</span> ${(data.price / 100 * 0.32).toFixed(2)} USD (≈ {(data.price / 100).toFixed(2)} TND)</div>
                <div><span className="font-medium">Status:</span> {data.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/admin/programs" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Programs</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Training Program</h1>
                <p className="text-muted-foreground">
                  Create a comprehensive, interactive training program with multilingual support
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Progress value={completionProgress()} className="w-32" />
                    <span className="text-sm text-muted-foreground">
                      {completionProgress()}% complete
                    </span>
                  </div>
                  <Badge variant={completionProgress() === 100 ? "default" : "secondary"}>
                    {tabs.filter(tab => getTabCompletionStatus(tab.id)).length}/{tabs.length} sections
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
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
              <Button
                type="button"
                onClick={handleCreateProgram}
                disabled={!isValid || isSubmitting || completionProgress() < 80}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Creating...' : 'Create Program'}</span>
              </Button>
            </div>
          </div>

          {/* Validation Errors Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Form Validation Errors</AlertTitle>
              <AlertDescription>
                Please fix the following errors before submitting:
                <ul className="mt-2 list-disc list-inside">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="text-sm">
                      {field}: {error?.message || 'Invalid value'}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Program Configuration</CardTitle>
              <CardDescription>
                Configure all aspects of your training program including structure, categories, and content
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                          <span className={isCompleted ? 'text-green-700 dark:text-green-300 font-medium' : 'font-medium'}>{tab.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground text-center leading-tight">
                          {tab.description}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{tab.label}</h3>
                        <p className="text-sm text-muted-foreground">{tab.description}</p>
                      </div>
                      <Badge variant={getTabCompletionStatus(tab.id) ? "default" : "outline"}>
                        {getTabCompletionStatus(tab.id) ? "Complete" : "In Progress"}
                      </Badge>
                    </div>
                    
                    <tab.component />
                    
                    {/* Tab Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={navigateToPrevTab}
                        disabled={!canNavigatePrev()}
                        className="flex items-center space-x-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => saveTabProgress(activeTab)}
                          disabled={savingTab === activeTab}
                          className="flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>
                            {savingTab === activeTab ? 'Saving...' : 'Save Progress'}
                          </span>
                        </Button>
                        
                        <div className="text-sm text-muted-foreground">
                          Step {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={navigateToNextTab}
                        disabled={!canNavigateNext()}
                        className="flex items-center space-x-2"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}