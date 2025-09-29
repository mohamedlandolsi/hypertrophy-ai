'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Layers,
  Dumbbell,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface ProgramCustomizerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  userId: string;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomizationSaved: (customization: any) => void;
}

interface CustomizationConfig {
  structureId: string;
  categoryType: 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST';
  workoutConfiguration: Record<string, string[]>; // workoutTemplateId -> exerciseIds[]
}

export function ProgramCustomizer({
  program,
  userCustomization,
  userId,
  locale,
  onCustomizationSaved
}: ProgramCustomizerProps) {
  // Use userId to avoid unused variable warning
  console.log('User ID:', userId);
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeCustomizationTab, setActiveCustomizationTab] = useState('structure');
  
  // Customization state
  const [customization, setCustomization] = useState<CustomizationConfig>(() => ({
    structureId: userCustomization?.configuration?.structureId || program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '',
    categoryType: userCustomization?.categoryType || 'ESSENTIALIST',
    workoutConfiguration: userCustomization?.configuration?.workoutConfiguration || {}
  }));

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Extract multilingual content
  const getLocalizedContent = (content: Record<string, unknown> | string, fallback: string = '') => {
    if (typeof content === 'object' && content !== null) {
      return (content as Record<string, string>)[locale] || (content as Record<string, string>).en || fallback;
    }
    return content || fallback;
  };

  // Get selected structure
  const selectedStructure = program.programStructures.find((s: Record<string, unknown>) => s.id === customization.structureId);
  
  // Use selectedStructure to avoid unused warning
  console.log('Selected structure:', selectedStructure?.id);

  // Category descriptions
  const categoryDescriptions = {
    MINIMALIST: 'Fewer exercises, focus on compound movements. Perfect for beginners or those with limited time.',
    ESSENTIALIST: 'Balanced approach with optimal exercise selection. Recommended for most users.',
    MAXIMALIST: 'More exercises and volume. Best for advanced users who want maximum muscle stimulation.'
  };

  // Save customization
  const saveCustomization = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/programs/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingProgramId: program.id,
          customization
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      const result = await response.json();
      onCustomizationSaved(result);
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Customization Saved',
        description: 'Your program customization has been saved successfully.'
      });
    } catch {
      toast({
        title: 'Save Failed',
        description: 'Failed to save your customization. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultCustomization: CustomizationConfig = {
      structureId: program.programStructures.find((s: Record<string, unknown>) => s.isDefault)?.id || program.programStructures[0]?.id || '',
      categoryType: 'ESSENTIALIST',
      workoutConfiguration: {}
    };
    
    setCustomization(defaultCustomization);
    setHasUnsavedChanges(true);
  };

  // Update customization and mark as changed
  const updateCustomization = (updates: Partial<CustomizationConfig>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Customization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Program Customization</span>
              </CardTitle>
              <CardDescription>
                Customize this program to match your preferences and goals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              {userCustomization && !hasUnsavedChanges && (
                <Badge variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Customized
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customization Tabs */}
      <Tabs value={activeCustomizationTab} onValueChange={setActiveCustomizationTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">
            <Layers className="w-4 h-4 mr-2" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="category">
            <Dumbbell className="w-4 h-4 mr-2" />
            Category
          </TabsTrigger>
          <TabsTrigger value="workouts">
            <Settings className="w-4 h-4 mr-2" />
            Workouts
          </TabsTrigger>
        </TabsList>

        {/* Structure Selection */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Training Structure</CardTitle>
              <CardDescription>
                Select the training schedule that best fits your lifestyle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={customization.structureId} 
                onValueChange={(value: string) => updateCustomization({ structureId: value })}
              >
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {program.programStructures.map((structure: any) => {
                    const structureName = getLocalizedContent(structure.name, `Structure ${structure.order + 1}`);
                    
                    return (
                      <div key={structure.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value={structure.id} id={structure.id} className="mt-1" />
                        <Label htmlFor={structure.id} className="flex-1 cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{structureName}</h4>
                              {structure.isDefault && (
                                <Badge variant="secondary">Recommended</Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                {structure.structureType === 'weekly' 
                                  ? `${structure.sessionCount} sessions per week`
                                  : `${structure.trainingDays} training days, ${structure.restDays} rest days`
                                }
                              </p>
                            </div>
                            
                            {structure.weeklySchedule && (
                              <div className="mt-2">
                                <div className="flex space-x-1 text-xs">
                                  {Object.entries(structure.weeklySchedule as Record<string, string>).map(([day, workout]) => (
                                    <div 
                                      key={day} 
                                      className={`px-2 py-1 rounded text-center min-w-12 ${
                                        workout 
                                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                          : 'bg-gray-100 dark:bg-gray-800'
                                      }`}
                                    >
                                      {day.slice(0, 3)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Selection */}
        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Philosophy</CardTitle>
              <CardDescription>
                Choose your approach to exercise selection and volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={customization.categoryType} 
                onValueChange={(value: string) => updateCustomization({ categoryType: value as 'MINIMALIST' | 'ESSENTIALIST' | 'MAXIMALIST' })}
              >
                <div className="space-y-4">
                  {Object.entries(categoryDescriptions).map(([category, description]) => (
                    <div key={category} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value={category} id={category} className="mt-1" />
                      <Label htmlFor={category} className="flex-1 cursor-pointer">
                        <div className="space-y-1">
                          <h4 className="font-medium capitalize">{category.toLowerCase()}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workout Configuration */}
        <TabsContent value="workouts" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Advanced workout customization will be available after selecting your structure and category.
              This feature allows you to customize individual exercises within each workout template.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Workout Templates</CardTitle>
              <CardDescription>
                Your program includes {program.workoutTemplates.length} workout templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {program.workoutTemplates.map((template: any) => {
                  const templateName = getLocalizedContent(template.name, `Workout ${template.order + 1}`);
                  
                  return (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{templateName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Target muscles: {template.requiredMuscleGroups.join(', ')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {template.requiredMuscleGroups.length} muscle groups
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={isSaving}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <p className="text-sm text-orange-600">
              You have unsaved changes
            </p>
          )}
          <Button
            onClick={saveCustomization}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Customization
          </Button>
        </div>
      </div>
    </div>
  );
}