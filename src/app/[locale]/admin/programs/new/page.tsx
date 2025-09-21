'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Save, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { BasicInfoForm } from '@/components/admin/program-creation/basic-info-form';

// Placeholder component for now
const PlaceholderForm = ({ title, description }: { title: string; description: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">This form section is coming soon...</p>
    </CardContent>
  </Card>
);

export default function CreateProgramPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const methods = useForm({
    defaultValues: {
      name: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' },
      price: 0,
      programType: 'Upper/Lower',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 12,
      sessionCount: 4,
      hasInteractiveBuilder: true,
      allowsCustomization: true,
      categories: [],
      workoutTemplates: [],
      exerciseTemplates: [],
      programGuide: {
        introduction: { en: '', ar: '', fr: '' },
        structure: { en: '', ar: '', fr: '' },
        exerciseSelection: { en: '', ar: '', fr: '' },
        volumeAdjustment: { en: '', ar: '', fr: '' },
        beginnerGuidelines: { en: '', ar: '', fr: '' },
        progressionPlan: { en: '', ar: '', fr: '' },
        faq: [],
      },
      isActive: true,
    },
    mode: 'onChange',
  });

  const { handleSubmit, formState: { errors, isValid }, getValues } = methods;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      console.log('Creating program with data:', data);
      toast.success('Training program creation started!');
      // TODO: Implement actual API call
      // router.push(`/admin/programs/${result.id}`);
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Failed to create program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic-info', label: 'Basic Info', component: BasicInfoForm },
    { id: 'structure', label: 'Program Structure', component: () => <PlaceholderForm title="Program Structure" description="Configure the workout structure and program flow" /> },
    { id: 'categories', label: 'Category Config', component: () => <PlaceholderForm title="Category Configuration" description="Set up minimalist, essentialist, and maximalist program variants" /> },
    { id: 'workouts', label: 'Workout Templates', component: () => <PlaceholderForm title="Workout Templates" description="Define workout sessions and muscle group assignments" /> },
    { id: 'exercises', label: 'Exercise Templates', component: () => <PlaceholderForm title="Exercise Templates" description="Configure exercise selection rules and volume guidelines" /> },
    { id: 'guide', label: 'Program Guide', component: () => <PlaceholderForm title="Program Guide Content" description="Create comprehensive program guides with multilingual support" /> },
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
              onClick={() => onSubmit(data)}
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
                <div><span className="font-medium">Type:</span> {data.programType}</div>
                <div><span className="font-medium">Difficulty:</span> {data.difficulty}</div>
                <div><span className="font-medium">Duration:</span> {data.estimatedDuration} weeks</div>
                <div><span className="font-medium">Sessions/week:</span> {data.sessionCount}</div>
                <div><span className="font-medium">Price:</span> ${(data.price / 100).toFixed(2)}</div>
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
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(true)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
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
                <TabsList className="grid w-full grid-cols-6">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                    <tab.component />
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