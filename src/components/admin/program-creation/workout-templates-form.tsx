'use client';

import { useFormContext } from 'react-hook-form';
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

const workoutTypes = [
  'Push',
  'Pull', 
  'Legs',
  'Upper',
  'Lower',
  'Full Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Shoulders',
  'Arms',
  'Legs & Glutes'
];

export function WorkoutTemplatesForm() {
  const { watch, setValue } = useFormContext();
  const workoutTemplates = watch('workoutTemplates') || [];

  const addWorkoutTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: '',
      type: 'Push',
      muscleGroups: [],
      estimatedDuration: 60,
      exercises: [],
      restPeriods: { compound: 180, isolation: 120 }
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Workout Name</Label>
                <Input
                  value={template.name as string || ''}
                  onChange={(e) => updateWorkoutTemplate(template.id as string, 'name', e.target.value)}
                  placeholder="e.g., Push Day, Upper Body"
                />
              </div>
              <div className="space-y-2">
                <Label>Workout Type</Label>
                <Select 
                  value={template.type as string || ''} 
                  onValueChange={(value) => updateWorkoutTemplate(template.id as string, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="30"
                max="120"
                value={template.estimatedDuration as number || 60}
                onChange={(e) => updateWorkoutTemplate(template.id as string, 'estimatedDuration', parseInt(e.target.value) || 60)}
                className="max-w-32"
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

            {/* Rest Periods */}
            <div className="space-y-3">
              <Label>Rest Periods</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Compound Exercises (seconds)</Label>
                  <Input
                    type="number"
                    min="60"
                    max="300"
                    value={((template.restPeriods as Record<string, number>) || {}).compound || 180}
                    onChange={(e) => {
                      const currentRest = (template.restPeriods as Record<string, number>) || {};
                      updateWorkoutTemplate(template.id as string, 'restPeriods', {
                        ...currentRest,
                        compound: parseInt(e.target.value) || 180
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Isolation Exercises (seconds)</Label>
                  <Input
                    type="number"
                    min="60"
                    max="180"
                    value={((template.restPeriods as Record<string, number>) || {}).isolation || 120}
                    onChange={(e) => {
                      const currentRest = (template.restPeriods as Record<string, number>) || {};
                      updateWorkoutTemplate(template.id as string, 'restPeriods', {
                        ...currentRest,
                        isolation: parseInt(e.target.value) || 120
                      });
                    }}
                  />
                </div>
              </div>
            </div>
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
                        {template.type as string} • {template.estimatedDuration as number}min • {((template.muscleGroups as string[]) || []).length} muscle groups
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