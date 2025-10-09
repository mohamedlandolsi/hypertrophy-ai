'use client';

import { useFormContext } from 'react-hook-form';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Dumbbell } from 'lucide-react';

const muscleGroups = [
  { id: 'chest', name: 'Chest', color: 'bg-red-100 text-red-800' },
  // Back muscles (separated for specificity)
  { id: 'lats', name: 'Lats', color: 'bg-blue-100 text-blue-800' },
  { id: 'trapezius_rhomboids', name: 'Trapezius & Rhomboids', color: 'bg-sky-100 text-sky-800' },
  // Shoulder muscles (separated by head)
  { id: 'front_delts', name: 'Front Delts', color: 'bg-amber-100 text-amber-800' },
  { id: 'side_delts', name: 'Side Delts', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'rear_delts', name: 'Rear Delts', color: 'bg-orange-100 text-orange-800' },
  // Arm muscles
  { id: 'elbow_flexors', name: 'Elbow Flexors (Biceps, Brachialis, Brachioradialis)', color: 'bg-green-100 text-green-800' },
  { id: 'triceps', name: 'Triceps', color: 'bg-emerald-100 text-emerald-800' },
  // Forearm muscles (separated by function)
  { id: 'wrist_flexors', name: 'Wrist Flexors', color: 'bg-teal-100 text-teal-800' },
  { id: 'wrist_extensors', name: 'Wrist Extensors', color: 'bg-slate-100 text-slate-800' },
  // Lower body
  { id: 'glutes', name: 'Glutes', color: 'bg-pink-100 text-pink-800' },
  { id: 'quadriceps', name: 'Quadriceps', color: 'bg-purple-100 text-purple-800' },
  { id: 'hamstrings', name: 'Hamstrings', color: 'bg-violet-100 text-violet-800' },
  { id: 'adductors', name: 'Adductors', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'calves', name: 'Calves', color: 'bg-blue-200 text-blue-900' },
  // Core
  { id: 'abs', name: 'Abs', color: 'bg-lime-100 text-lime-800' },
  { id: 'obliques', name: 'Obliques', color: 'bg-yellow-200 text-yellow-900' },
  // Additional
  { id: 'erectors', name: 'Erectors', color: 'bg-cyan-200 text-cyan-900' },
  { id: 'hip_flexors', name: 'Hip Flexors', color: 'bg-rose-100 text-rose-800' }
];

// ExerciseSelector component
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string | null;
  instructions?: string | null;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  imageUrl?: string | null;
  imageType?: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

interface ExerciseSelectorProps {
  muscleGroup: string;
  value: string;
  onValueChange: (value: string) => void;
}

function ExerciseSelector({ muscleGroup, value, onValueChange }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!muscleGroup) {
      setExercises([]);
      return;
    }

    setLoading(true);
    fetch(`/api/exercises/by-muscle-group?muscleGroup=${encodeURIComponent(muscleGroup)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        return response.json();
      })
      .then((data) => setExercises(data.exercises || []))
      .catch((error) => {
        console.error('Failed to fetch exercises:', error);
        setExercises([]);
      })
      .finally(() => setLoading(false));
  }, [muscleGroup]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={
          loading ? "Loading exercises..." : 
          exercises.length === 0 ? "No exercises available" :
          "Choose an exercise from our database"
        } />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="_loading" disabled>Loading exercises...</SelectItem>
        ) : exercises.length === 0 ? (
          <SelectItem value="_empty" disabled>
            {muscleGroup ? "No exercises found for this muscle group" : "Select a muscle group first"}
          </SelectItem>
        ) : (
          exercises.map((exercise) => (
            <SelectItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function WorkoutTemplatesForm() {
  const { watch, setValue } = useFormContext();
  const workoutNamesRaw = watch('workoutNames');
  const workoutTemplatesRaw = watch('workoutTemplates');
  
  // Memoize to prevent triggering useEffect on every render
  const workoutNames = useMemo(() => workoutNamesRaw || [], [workoutNamesRaw]);
  const workoutTemplates = useMemo(() => workoutTemplatesRaw || [], [workoutTemplatesRaw]);

  // Auto-sync workout templates with workout names
  useEffect(() => {
    const existingTemplateNames = workoutTemplates.map((t: Record<string, unknown>) => t.name);
    const needsSync = JSON.stringify(workoutNames) !== JSON.stringify(existingTemplateNames);
    
    if (needsSync) {
      const synced = workoutNames.map((name: string, index: number) => {
        // Find existing template with this name
        const existing = workoutTemplates.find((t: Record<string, unknown>) => t.name === name);
        if (existing) {
          return existing; // Preserve existing template data
        }
        // Create new template
        return {
          id: `workout-${Date.now()}-${index}`,
          name,
          muscleGroups: [],
          exercises: []
        };
      });
      setValue('workoutTemplates', synced);
    }
  }, [workoutNames, workoutTemplates, setValue]);

  const updateWorkoutTemplate = (templateId: string, field: string, value: unknown) => {
    const updatedTemplates = workoutTemplates.map((template: Record<string, unknown>) =>
      template.id === templateId ? { ...template, [field]: value } : template
    );
    setValue('workoutTemplates', updatedTemplates);
  };

  const toggleMuscleGroup = (templateId: string, muscleGroupId: string) => {
    const template = workoutTemplates.find((t: Record<string, unknown>) => t.id === templateId);
    if (!template) return;

    const currentGroups = (template.muscleGroups as string[]) || [];
    const updatedGroups = currentGroups.includes(muscleGroupId)
      ? currentGroups.filter(id => id !== muscleGroupId)
      : [...currentGroups, muscleGroupId];
    
    updateWorkoutTemplate(templateId, 'muscleGroups', updatedGroups);
  };

  const addExerciseToTemplate = (templateId: string) => {
    const template = workoutTemplates.find((t: Record<string, unknown>) => t.id === templateId);
    if (!template) return;

    const newExercise = {
      id: Date.now().toString(),
      targetedMuscle: '',
      selectedExercise: ''
    };
    
    const currentExercises = (template.exercises as Array<Record<string, unknown>>) || [];
    updateWorkoutTemplate(templateId, 'exercises', [...currentExercises, newExercise]);
  };

  const removeExerciseFromTemplate = (templateId: string, exerciseIndex: number) => {
    const template = workoutTemplates.find((t: Record<string, unknown>) => t.id === templateId);
    if (!template) return;

    const currentExercises = (template.exercises as Array<Record<string, unknown>>) || [];
    const updatedExercises = currentExercises.filter((_, index) => index !== exerciseIndex);
    updateWorkoutTemplate(templateId, 'exercises', updatedExercises);
  };

  const updateExerciseInTemplate = (templateId: string, exerciseIndex: number, field: string, value: unknown) => {
    const template = workoutTemplates.find((t: Record<string, unknown>) => t.id === templateId);
    if (!template) return;

    const currentExercises = (template.exercises as Array<Record<string, unknown>>) || [];
    const updatedExercises = currentExercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, [field]: value } : exercise
    );
    updateWorkoutTemplate(templateId, 'exercises', updatedExercises);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Workouts Auto-Generated</h4>
        <p className="text-sm text-blue-700">
          Workout templates are automatically created based on the workout names you defined in the Program Structure tab. 
          Edit them below to configure exercises and muscle groups.
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workout Templates</h3>
          <p className="text-sm text-muted-foreground">
            Configure exercises and muscle groups for each workout session
          </p>
        </div>
      </div>

      {workoutTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workout names defined yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Go to the Program Structure tab and add workout names. They will automatically appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {workoutTemplates.map((template: Record<string, unknown>, index: number) => (
        <Card key={template.id as string}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{template.name as string || `Workout ${index + 1}`}</CardTitle>
                <CardDescription>
                  Configure workout details and target muscle groups
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">\n            {/* Muscle Groups */}
            <div className="space-y-3">
              <Label>Target Muscle Groups</Label>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((muscle) => {
                  const isSelected = (template.muscleGroups as string[] || []).includes(muscle.id);
                  return (
                    <Badge
                      key={muscle.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${isSelected ? muscle.color : 'hover:bg-muted'}`}
                      onClick={() => toggleMuscleGroup(template.id as string, muscle.id)}
                    >
                      {muscle.name}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on muscle groups to toggle selection
              </p>
            </div>

            <Separator />

            {/* Exercise Limits Per Muscle Group */}
            {(template.muscleGroups as string[] || []).length > 0 && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Exercise Limits Per Muscle Group</Label>
                  <p className="text-xs text-muted-foreground">
                    Set how many exercises users can select for each muscle group
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(template.muscleGroups as string[] || []).map((muscleGroupId: string) => {
                      const muscle = muscleGroups.find(m => m.id === muscleGroupId);
                      if (!muscle) return null;
                      
                      const exercisesPerMuscle = (template.exercisesPerMuscle as Record<string, number>) || {};
                      const currentLimit = exercisesPerMuscle[muscleGroupId] || 2;
                      
                      return (
                        <div key={muscleGroupId} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Badge variant="secondary" className={muscle.color}>
                            {muscle.name}
                          </Badge>
                          <div className="flex items-center space-x-2 ml-auto">
                            <Label htmlFor={`limit-${template.id}-${muscleGroupId}`} className="text-sm whitespace-nowrap">
                              Max:
                            </Label>
                            <Select
                              value={currentLimit.toString()}
                              onValueChange={(value) => {
                                const updatedLimits = {
                                  ...(template.exercisesPerMuscle as Record<string, number> || {}),
                                  [muscleGroupId]: parseInt(value)
                                };
                                updateWorkoutTemplate(template.id as string, 'exercisesPerMuscle', updatedLimits);
                              }}
                            >
                              <SelectTrigger id={`limit-${template.id}-${muscleGroupId}`} className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Volume Range Per Muscle Group (Sets)</Label>
                  <p className="text-xs text-muted-foreground">
                    Set the minimum and maximum number of total working sets for each muscle group
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(template.muscleGroups as string[] || []).map((muscleGroupId: string) => {
                      const muscle = muscleGroups.find(m => m.id === muscleGroupId);
                      if (!muscle) return null;
                      
                      const volumeRange = (template.volumeRange as Record<string, { min: number; max: number }>) || {};
                      const currentRange = volumeRange[muscleGroupId] || { min: 2, max: 5 };
                      
                      return (
                        <div key={muscleGroupId} className="flex flex-col space-y-2 p-3 border rounded-lg">
                          <Badge variant="secondary" className={muscle.color}>
                            {muscle.name}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 flex-1">
                              <Label htmlFor={`volume-min-${template.id}-${muscleGroupId}`} className="text-xs whitespace-nowrap">
                                Min:
                              </Label>
                              <Select
                                value={currentRange.min.toString()}
                                onValueChange={(value) => {
                                  const updatedRange = {
                                    ...(template.volumeRange as Record<string, { min: number; max: number }> || {}),
                                    [muscleGroupId]: { 
                                      min: parseInt(value), 
                                      max: currentRange.max 
                                    }
                                  };
                                  updateWorkoutTemplate(template.id as string, 'volumeRange', updatedRange);
                                }}
                              >
                                <SelectTrigger id={`volume-min-${template.id}-${muscleGroupId}`} className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-1 flex-1">
                              <Label htmlFor={`volume-max-${template.id}-${muscleGroupId}`} className="text-xs whitespace-nowrap">
                                Max:
                              </Label>
                              <Select
                                value={currentRange.max.toString()}
                                onValueChange={(value) => {
                                  const updatedRange = {
                                    ...(template.volumeRange as Record<string, { min: number; max: number }> || {}),
                                    [muscleGroupId]: { 
                                      min: currentRange.min, 
                                      max: parseInt(value) 
                                    }
                                  };
                                  updateWorkoutTemplate(template.id as string, 'volumeRange', updatedRange);
                                }}
                              >
                                <SelectTrigger id={`volume-max-${template.id}-${muscleGroupId}`} className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Exercise Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Exercise Selection</Label>
              
              {/* Add Exercise Button */}
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addExerciseToTemplate(template.id as string)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              </div>

              {/* Exercises List */}
              {((template.exercises as Array<Record<string, unknown>>) || []).map((exercise: Record<string, unknown>, exerciseIndex: number) => (
                <Card key={exerciseIndex} className="p-4 border-dashed">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Targeted Muscle</Label>
                      <Select
                        value={(exercise.targetedMuscle as string) || ''}
                        onValueChange={(value) => updateExerciseInTemplate(template.id as string, exerciseIndex, 'targetedMuscle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select muscle group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHEST">Chest</SelectItem>
                          <SelectItem value="BACK">Back</SelectItem>
                          <SelectItem value="SIDE_DELTS">Side Delts</SelectItem>
                          <SelectItem value="FRONT_DELTS">Front Delts</SelectItem>
                          <SelectItem value="REAR_DELTS">Rear Delts</SelectItem>
                          <SelectItem value="ELBOW_FLEXORS">Elbow Flexors (Biceps, Brachialis, Brachioradialis)</SelectItem>
                          <SelectItem value="TRICEPS">Triceps</SelectItem>
                          <SelectItem value="FOREARMS">Forearms</SelectItem>
                          <SelectItem value="GLUTES">Glutes</SelectItem>
                          <SelectItem value="QUADRICEPS">Quadriceps</SelectItem>
                          <SelectItem value="HAMSTRINGS">Hamstrings</SelectItem>
                          <SelectItem value="ADDUCTORS">Adductors</SelectItem>
                          <SelectItem value="CALVES">Calves</SelectItem>
                          <SelectItem value="ERECTORS">Erectors</SelectItem>
                          <SelectItem value="ABS">Abs</SelectItem>
                          <SelectItem value="OBLIQUES">Obliques</SelectItem>
                          <SelectItem value="HIP_FLEXORS">Hip Flexors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Example Exercises from Database</Label>
                      <ExerciseSelector 
                        muscleGroup={(exercise.targetedMuscle as string) || ''}
                        value={(exercise.selectedExercise as string) || ''}
                        onValueChange={(value: string) => updateExerciseInTemplate(template.id as string, exerciseIndex, 'selectedExercise', value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Exercise options will be filtered based on your selected muscle group
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeExerciseFromTemplate(template.id as string, exerciseIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Exercise
                    </Button>
                  </div>
                </Card>
              ))}
              
              {((template.exercises as Array<Record<string, unknown>>) || []).length === 0 && (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No exercises added yet</p>
                  <p className="text-sm">Click &quot;Add Exercise&quot; to start building your workout</p>
                </div>
              )}
            </div>

            <Separator />
          </CardContent>
        </Card>
      ))}

      {workoutTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workout Summary</CardTitle>
            <CardDescription>Overview of all configured workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workoutTemplates.map((template: Record<string, unknown>, index: number) => (
                <div key={template.id as string} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{(template.name as string) || `Workout ${index + 1}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {((template.exercises as Array<Record<string, unknown>>) || []).length} exercises • {((template.muscleGroups as string[]) || []).length} muscle groups
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {(template.muscleGroups as string[] || []).map((groupId) => {
                      const muscle = muscleGroups.find(m => m.id === groupId);
                      return muscle ? (
                        <Badge key={groupId} variant="secondary" className={muscle.color}>
                          {muscle.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}