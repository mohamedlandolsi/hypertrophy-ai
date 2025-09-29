'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dumbbell,
  Target,
  Clock,
  Users,
  PlayCircle,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';

interface WorkoutTemplatesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  locale: string;
}

export function WorkoutTemplates({
  program,
  userCustomization,
  locale
}: WorkoutTemplatesProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  // Extract multilingual content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getLocalizedContent = (content: any, fallback: string = '') => {
    if (typeof content === 'object' && content !== null) {
      return content[locale] || content.en || fallback;
    }
    return content || fallback;
  };

  // Get selected structure for context
  const selectedStructure = userCustomization?.configuration?.structureId 
    ? program.programStructures.find((s: Record<string, unknown>) => s.id === userCustomization.configuration.structureId)
    : program.programStructures.find((s: Record<string, unknown>) => s.isDefault) || program.programStructures[0];

  const structureName = selectedStructure 
    ? getLocalizedContent(selectedStructure.name, 'Training Structure')
    : 'Default Structure';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5" />
            <span>Workout Templates</span>
          </CardTitle>
          <CardDescription>
            Explore the workout templates in your program and see how they fit your selected structure
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Structure Context */}
      {selectedStructure && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Structure:</strong> {structureName} - 
            {selectedStructure.structureType === 'weekly' 
              ? ` ${selectedStructure.sessionCount} sessions per week`
              : ` ${selectedStructure.trainingDays} training days, ${selectedStructure.restDays} rest days`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Workout Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {program.workoutTemplates.map((template: any) => {
          const templateName = getLocalizedContent(template.name, `Workout ${template.order + 1}`);
          const isSelected = selectedWorkout === template.id;
          
          return (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedWorkout(isSelected ? null : template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{templateName}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>Workout {template.order + 1}</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {template.requiredMuscleGroups.length} muscle groups
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Muscle Groups */}
                <div>
                  <p className="text-sm font-medium mb-2">Target Muscle Groups:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.requiredMuscleGroups.map((muscle: string) => (
                      <Badge key={muscle} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Workout Details (expandable) */}
                {isSelected && (
                  <div className="space-y-4 pt-3 border-t">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Workout Information</h4>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>Duration: 45-60 min</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>All levels</span>
                        </div>
                      </div>

                      {/* Customization Status */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {userCustomization?.configuration?.workoutConfiguration?.[template.id] 
                                ? 'Customized' 
                                : 'Default exercises'
                              }
                            </span>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                        
                        {userCustomization?.configuration?.workoutConfiguration?.[template.id] && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {userCustomization.configuration.workoutConfiguration[template.id].length} exercises selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkout(isSelected ? null : template.id);
                  }}
                >
                  {isSelected ? 'Show Less' : 'Show More'}
                  <ChevronRight 
                    className={`w-4 h-4 ml-1 transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`} 
                  />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Schedule Preview (if structure has weekly schedule) */}
      {selectedStructure?.weeklySchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule Preview</CardTitle>
            <CardDescription>
              See how your workouts fit into your weekly structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries((selectedStructure?.weeklySchedule as Record<string, string>) || {}).map(([day, workoutName]) => {
                // Find matching workout template
                const matchingWorkout = program.workoutTemplates.find((template: Record<string, unknown>) => {
                  const templateName = getLocalizedContent(template.name as Record<string, string> | string, '');
                  return templateName.toLowerCase().includes(workoutName.toLowerCase()) || 
                         workoutName.toLowerCase().includes(templateName.toLowerCase());
                });
                
                return (
                  <div key={day} className="text-center">
                    <div className="font-medium text-sm capitalize mb-2">
                      {day}
                    </div>
                    <div 
                      className={`p-3 rounded-lg text-xs ${
                        workoutName && matchingWorkout
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800'
                          : workoutName
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-500'
                      }`}
                      onClick={() => matchingWorkout && setSelectedWorkout(matchingWorkout.id)}
                    >
                      {workoutName || 'Rest'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to start training?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your program is configured and ready to go. You can always come back to customize it further.
              </p>
            </div>
            <Button>
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}