'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar, RotateCcw } from 'lucide-react';

import type { ProgramCreationInput } from '@/lib/validations/program-creation';

export function ProgramStructureForm() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProgramCreationInput>();
  
  const structureType = watch('structureType');
  const weeklySchedule = watch('weeklySchedule');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Structure & Settings</CardTitle>
          <CardDescription>
            Configure how your training program is structured and organized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Training Structure */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Training Structure</Label>
            
            <div>
              <Label htmlFor="structureType">Structure Type</Label>
              <Select onValueChange={(value) => setValue('structureType', value as 'weekly' | 'cyclic')} defaultValue={structureType || 'weekly'}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select structure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Weekly Structure</div>
                        <div className="text-sm text-muted-foreground">Based on weekdays (Mon, Tue, Wed...)</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="cyclic">
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Cyclic Structure</div>
                        <div className="text-sm text-muted-foreground">e.g., 3 days on, 1 day off, repeat</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how the training schedule is organized
              </p>
            </div>

            {watch('structureType') === 'weekly' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionsPerWeek">Sessions per week</Label>
                  <Input 
                    id="sessionsPerWeek"
                    type="number"
                    placeholder="4"
                    min="1"
                    max="7"
                    {...register('sessionCount', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.sessionCount && (
                    <p className="text-sm text-red-600 mt-1">{errors.sessionCount.message}</p>
                  )}
                </div>

                {/* Weekly Schedule */}
                <div>
                  <Label className="text-sm font-medium">Weekly Schedule</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Assign workout session names to each day of the week (leave empty for rest days)
                  </p>
                  <div className="grid gap-3">
                    {[
                      { key: 'monday', label: 'Monday' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-3">
                        <div className="w-20 text-sm font-medium text-right">{label}:</div>
                        <Input
                          placeholder="e.g., Push Day, Upper Body A, Rest"
                          className="flex-1"
                          value={weeklySchedule?.[key as keyof typeof weeklySchedule] || ''}
                          onChange={(e) => setValue(`weeklySchedule.${key}` as keyof ProgramCreationInput, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {watch('structureType') === 'cyclic' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trainingDays">Training Days</Label>
                  <Input 
                    id="trainingDays"
                    type="number"
                    placeholder="3"
                    min="1"
                    max="6"
                    {...register('trainingDays', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Days of training</p>
                </div>
                <div>
                  <Label htmlFor="restDays">Rest Days</Label>
                  <Input 
                    id="restDays"
                    type="number"
                    placeholder="1"
                    min="1"
                    max="3"
                    {...register('restDays', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Days of rest</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

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