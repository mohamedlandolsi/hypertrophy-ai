'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { ProgramCreationInput } from '@/lib/validations/program-creation';

export function BasicInfoForm() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ProgramCreationInput>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Information</CardTitle>
          <CardDescription>
            Basic details about your training program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Program Name - Multilingual */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Program Name</Label>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>
              
              <TabsContent value="en" className="space-y-4">
                <div>
                  <Label htmlFor="name-en">English Name</Label>
                  <Input 
                    id="name-en"
                    placeholder="e.g., Upper/Lower Split Program" 
                    {...register('name.en')}
                  />
                  {errors.name?.en && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.en.message}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ar" className="space-y-4">
                <div>
                  <Label htmlFor="name-ar">Arabic Name</Label>
                  <Input 
                    id="name-ar"
                    placeholder="البرنامج التدريبي العلوي/السفلي" 
                    {...register('name.ar')}
                    dir="rtl"
                  />
                  {errors.name?.ar && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.ar.message}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fr" className="space-y-4">
                <div>
                  <Label htmlFor="name-fr">French Name</Label>
                  <Input 
                    id="name-fr"
                    placeholder="Programme Haut/Bas du Corps" 
                    {...register('name.fr')}
                  />
                  {errors.name?.fr && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.fr.message}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Program Description - Multilingual */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Program Description</Label>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>
              
              <TabsContent value="en" className="space-y-4">
                <div>
                  <Label htmlFor="description-en">English Description</Label>
                  <Textarea 
                    id="description-en"
                    placeholder="Comprehensive description of the training program..."
                    className="min-h-[100px]"
                    {...register('description.en')}
                  />
                  {errors.description?.en && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.en.message}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ar" className="space-y-4">
                <div>
                  <Label htmlFor="description-ar">Arabic Description</Label>
                  <Textarea 
                    id="description-ar"
                    placeholder="وصف شامل للبرنامج التدريبي..."
                    className="min-h-[100px]"
                    {...register('description.ar')}
                    dir="rtl"
                  />
                  {errors.description?.ar && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.ar.message}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fr" className="space-y-4">
                <div>
                  <Label htmlFor="description-fr">French Description</Label>
                  <Textarea 
                    id="description-fr"
                    placeholder="Description complète du programme d'entraînement..."
                    className="min-h-[100px]"
                    {...register('description.fr')}
                  />
                  {errors.description?.fr && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.fr.message}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Price (in cents)</Label>
            <Input 
              id="price"
              type="number"
              placeholder="2999 (for $29.99)"
              {...register('price', { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the price in cents (e.g., 2999 for $29.99)
            </p>
            {errors.price && (
              <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Settings</CardTitle>
          <CardDescription>
            Configure basic program behavior and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Program Type */}
          <div>
            <Label htmlFor="programType">Program Type</Label>
            <Select onValueChange={(value) => setValue('programType', value as 'Upper/Lower' | 'FB EOD' | 'Anterior/Posterior' | 'PPL x UL' | 'Upper/Lower x5')} defaultValue={watch('programType')}>
              <SelectTrigger>
                <SelectValue placeholder="Select program type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Upper/Lower">Upper/Lower Split</SelectItem>
                <SelectItem value="FB EOD">Full Body Every Other Day</SelectItem>
                <SelectItem value="Anterior/Posterior">Anterior/Posterior Split</SelectItem>
                <SelectItem value="PPL x UL">Push/Pull/Legs x Upper/Lower</SelectItem>
                <SelectItem value="Upper/Lower x5">Upper/Lower x5 Days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This determines the basic structure and workout templates
            </p>
            {errors.programType && (
              <p className="text-sm text-red-600 mt-1">{errors.programType.message}</p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select onValueChange={(value) => setValue('difficulty', value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} defaultValue={watch('difficulty')}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="text-sm text-red-600 mt-1">{errors.difficulty.message}</p>
            )}
          </div>

          {/* Duration and Sessions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedDuration">Duration (weeks)</Label>
              <Input 
                id="estimatedDuration"
                type="number"
                placeholder="12"
                min="1"
                max="52"
                {...register('estimatedDuration', { valueAsNumber: true })}
              />
              {errors.estimatedDuration && (
                <p className="text-sm text-red-600 mt-1">{errors.estimatedDuration.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sessionCount">Sessions per week</Label>
              <Input 
                id="sessionCount"
                type="number"
                placeholder="4"
                min="1"
                max="7"
                {...register('sessionCount', { valueAsNumber: true })}
              />
              {errors.sessionCount && (
                <p className="text-sm text-red-600 mt-1">{errors.sessionCount.message}</p>
              )}
            </div>
          </div>

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

          {/* Status */}
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