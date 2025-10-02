'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import type { ProgramCreationInput, ProgramStructure } from '@/lib/validations/program-creation';

export function ProgramStructureForm() {
  const { register, watch, setValue, control } = useFormContext<ProgramCreationInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'programStructures',
  });

  const [expandedStructure, setExpandedStructure] = useState<number>(0);
  
  // General workout names (applies to all structures)
  const workoutNames = watch('workoutNames') || [];
  
  const addWorkoutName = () => {
    setValue('workoutNames', [...workoutNames, '']);
  };
  
  const updateWorkoutName = (index: number, value: string) => {
    const updated = [...workoutNames];
    updated[index] = value;
    setValue('workoutNames', updated);
  };
  
  const removeWorkoutName = (index: number) => {
    setValue('workoutNames', workoutNames.filter((_: string, i: number) => i !== index));
  };

  const addNewStructure = () => {
    const newStructure: ProgramStructure = {
      name: { en: '', ar: '', fr: '' },
      structureType: 'weekly',
      sessionCount: 4,
      trainingDays: 3,
      restDays: 1,
      weeklySchedule: {},
      order: fields.length,
      isDefault: fields.length === 0, // First structure is default
    };
    append(newStructure);
    setExpandedStructure(fields.length);
  };

  const setAsDefault = (index: number) => {
    // Set all structures to non-default, then set the selected one as default
    fields.forEach((_, i) => {
      setValue(`programStructures.${i}.isDefault`, i === index);
    });
  };

  return (
    <div className="space-y-6">
      {/* General Workout Names Section */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Names</CardTitle>
          <CardDescription>
            Define the names of your workouts (e.g., &ldquo;Push Day&rdquo;, &ldquo;Pull Day&rdquo;, &ldquo;Leg Day&rdquo;). These will be used across all program structures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workoutNames.map((name: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Workout ${index + 1} name`}
                  value={name}
                  onChange={(e) => updateWorkoutName(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWorkoutName(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWorkoutName}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Workout Name
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Program Structures Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Program Structures</CardTitle>
              <CardDescription>
                Configure multiple training structures for your program (e.g., weekly and cyclic variants)
              </CardDescription>
            </div>
            <Button type="button" onClick={addNewStructure} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Structure</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No program structures defined yet.</p>
              <Button type="button" onClick={addNewStructure}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Structure
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const structureType = watch(`programStructures.${index}.structureType`);
                const weeklySchedule = watch(`programStructures.${index}.weeklySchedule`);
                const isDefault = watch(`programStructures.${index}.isDefault`);
                const isExpanded = expandedStructure === index;

                return (
                  <Card
                    key={field.id}
                    className={`${isDefault ? 'ring-2 ring-blue-500' : ''} ${isExpanded ? 'ring-1 ring-gray-200' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div>
                            <h4 className="font-medium">
                              Structure {index + 1}
                              {isDefault && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {watch(`programStructures.${index}.name.en`) || 'Unnamed structure'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isDefault && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAsDefault(index)}
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant={isExpanded ? "outline" : "ghost"}
                            size="sm"
                            onClick={() => setExpandedStructure(isExpanded ? -1 : index)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Expand
                              </>
                            )}
                          </Button>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Structure Name */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Name (English)</Label>
                            <Input
                              placeholder="e.g., Weekly Structure"
                              {...register(`programStructures.${index}.name.en`)}
                            />
                          </div>
                          <div>
                            <Label>Name (Arabic)</Label>
                            <Input
                              placeholder="e.g., هيكل أسبوعي"
                              {...register(`programStructures.${index}.name.ar`)}
                            />
                          </div>
                          <div>
                            <Label>Name (French)</Label>
                            <Input
                              placeholder="e.g., Structure Hebdomadaire"
                              {...register(`programStructures.${index}.name.fr`)}
                            />
                          </div>
                        </div>

                        {/* Structure Type */}
                        <div>
                          <Label>Structure Type</Label>
                          <Select 
                            onValueChange={(value) => setValue(`programStructures.${index}.structureType`, value as 'weekly' | 'cyclic')} 
                            defaultValue={structureType || 'weekly'}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select structure type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Weekly Structure</div>
                                    <div className="text-sm text-muted-foreground">Based on weekdays</div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="cyclic">
                                <div className="flex items-center space-x-2">
                                  <RotateCcw className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Cyclic Structure</div>
                                    <div className="text-sm text-muted-foreground">e.g., 3 days on, 1 day off</div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Weekly Structure Configuration */}
                        {structureType === 'weekly' && (
                          <div className="space-y-4">
                            <div>
                              <Label>Sessions per week</Label>
                              <Input 
                                type="number"
                                placeholder="4"
                                min="1"
                                max="7"
                                {...register(`programStructures.${index}.sessionCount`, { valueAsNumber: true })}
                                className="mt-1"
                              />
                            </div>

                            {/* Weekly Schedule */}
                            <div>
                              <Label className="text-sm font-medium">Weekly Schedule</Label>
                              <p className="text-xs text-muted-foreground mb-3">
                                Assign workout names to each day or mark as rest day.
                              </p>
                              <div className="grid gap-3">
                                {[
                                  { key: 'day1', label: 'Day 1' },
                                  { key: 'day2', label: 'Day 2' },
                                  { key: 'day3', label: 'Day 3' },
                                  { key: 'day4', label: 'Day 4' },
                                  { key: 'day5', label: 'Day 5' },
                                  { key: 'day6', label: 'Day 6' },
                                  { key: 'day7', label: 'Day 7' },
                                ].map(({ key, label }) => {
                                  const currentValue = weeklySchedule?.[key as keyof typeof weeklySchedule] || '';
                                  const isRestDay = currentValue.toLowerCase() === 'rest';
                                  const availableWorkouts = workoutNames;
                                  
                                  return (
                                    <div key={key} className="flex items-center space-x-3">
                                      <div className="w-20 text-sm font-medium text-right">{label}:</div>
                                      <div className="flex items-center space-x-2 flex-1">
                                        <Select
                                          value={isRestDay ? 'Rest' : currentValue}
                                          onValueChange={(value) => {
                                            const currentSchedule = watch(`programStructures.${index}.weeklySchedule`) || {};
                                            setValue(`programStructures.${index}.weeklySchedule` as const, {
                                              ...currentSchedule,
                                              [key]: value,
                                            });
                                          }}
                                          disabled={availableWorkouts.length === 0}
                                        >
                                          <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select workout or rest" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Rest">Rest Day</SelectItem>
                                            {availableWorkouts.map((workout, idx) => (
                                              workout && <SelectItem key={idx} value={workout}>{workout}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`rest-${index}-${key}`}
                                            checked={isRestDay}
                                            onCheckedChange={(checked) => {
                                              const currentSchedule = watch(`programStructures.${index}.weeklySchedule`) || {};
                                              setValue(`programStructures.${index}.weeklySchedule` as const, {
                                                ...currentSchedule,
                                                [key]: checked ? 'Rest' : '',
                                              });
                                            }}
                                          />
                                          <Label 
                                            htmlFor={`rest-${index}-${key}`}
                                            className="text-sm font-normal cursor-pointer"
                                          >
                                            Rest
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cyclic Structure Configuration */}
                        {structureType === 'cyclic' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Training Days</Label>
                                <Input 
                                  type="number"
                                  placeholder="3"
                                  min="1"
                                  max="6"
                                  {...register(`programStructures.${index}.trainingDays`, { valueAsNumber: true })}
                                  className="mt-1"
                                />
                                <p className="text-sm text-muted-foreground mt-1">Days of training</p>
                              </div>
                              <div>
                                <Label>Rest Days</Label>
                                <Input 
                                  type="number"
                                  placeholder="1"
                                  min="1"
                                  max="3"
                                  {...register(`programStructures.${index}.restDays`, { valueAsNumber: true })}
                                  className="mt-1"
                                />
                                <p className="text-sm text-muted-foreground mt-1">Days of rest</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Separator className="my-6" />

          {/* Interactive Features */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Interactive Features</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasInteractiveBuilder"
                checked={watch('hasInteractiveBuilder')}
                onCheckedChange={(checked) => setValue('hasInteractiveBuilder', !!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="hasInteractiveBuilder">
                  Interactive Program Builder
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to build their program interactively with exercise selection
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowsCustomization"
                checked={watch('allowsCustomization')}
                onCheckedChange={(checked) => setValue('allowsCustomization', !!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="allowsCustomization">
                  Allow Customization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Users can customize exercises and volume based on preferences
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Program Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', !!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="isActive">
                Active Program
              </Label>
              <p className="text-sm text-muted-foreground">
                Make this program available for purchase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}