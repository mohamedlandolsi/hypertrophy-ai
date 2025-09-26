'use client';

import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Dumbbell } from 'lucide-react';

const muscleGroups = [
  { id: 'chest', name: 'Chest', color: 'bg-red-100 text-red-800' },
  { id: 'back', name: 'Back', color: 'bg-blue-100 text-blue-800' },
  { id: 'shoulders', name: 'Shoulders', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'arms', name: 'Arms', color: 'bg-green-100 text-green-800' },
  { id: 'legs', name: 'Legs', color: 'bg-purple-100 text-purple-800' },
  { id: 'glutes', name: 'Glutes', color: 'bg-pink-100 text-pink-800' },
  { id: 'core', name: 'Core', color: 'bg-orange-100 text-orange-800' }
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
  const workoutTemplates = watch('workoutTemplates') || [];

  const addWorkoutTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: '',
      muscleGroups: [],
      exercises: []
    };
    setValue('workoutTemplates', [...workoutTemplates, newTemplate]);
  };

  const removeWorkoutTemplate = (templateId: string) => {
    setValue('workoutTemplates', workoutTemplates.filter((template: Record<string, unknown>) => template.id !== templateId));
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workout Templates</h3>
          <p className="text-sm text-muted-foreground">
            Define workout sessions for your training program
          </p>
        </div>
        <Button onClick={addWorkoutTemplate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Workout</span>
        </Button>
      </div>

      {workoutTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workout templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workout template to define the structure of your training sessions.
            </p>
            <Button onClick={addWorkoutTemplate} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create First Workout</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {workoutTemplates.map((template: Record<string, unknown>, index: number) => (
        <Card key={template.id as string}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Workout {index + 1}</CardTitle>
                <CardDescription>
                  Configure workout details and target muscle groups
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeWorkoutTemplate(template.id as string)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Workout Name</Label>
              <Input
                value={template.name as string || ''}
                onChange={(e) => updateWorkoutTemplate(template.id as string, 'name', e.target.value)}
                placeholder="e.g., Push Day, Upper Body"
                className="max-w-md"
              />
            </div>

            <Separator />

            {/* Muscle Groups */}
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

            {/* Exercise Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Exercise Selection</Label>
              
              {/* Add Exercise Button */}
              <div className="flex items-center space-x-2">
                <Button
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
                          <SelectItem value="SHOULDERS">Shoulders</SelectItem>
                          <SelectItem value="BICEPS">Biceps</SelectItem>
                          <SelectItem value="TRICEPS">Triceps</SelectItem>
                          <SelectItem value="FOREARMS">Forearms</SelectItem>
                          <SelectItem value="ABS">Abs</SelectItem>
                          <SelectItem value="GLUTES">Glutes</SelectItem>
                          <SelectItem value="QUADRICEPS">Quadriceps</SelectItem>
                          <SelectItem value="HAMSTRINGS">Hamstrings</SelectItem>
                          <SelectItem value="ADDUCTORS">Adductors</SelectItem>
                          <SelectItem value="CALVES">Calves</SelectItem>
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