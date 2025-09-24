'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Search, Filter, Dumbbell, Target } from 'lucide-react';
import { TrainingExercise } from '@/stores/program-builder-store';
import useProgramBuilderStore from '@/stores/program-builder-store';
import CategoryTemplates from './category-templates';

interface ExerciseWithVolume extends TrainingExercise {
  directVolume: number;
  indirectVolume: { [muscleGroup: string]: number };
  totalSets: number;
}

interface EnhancedExerciseSelectorProps {
  workoutTemplateId: string;
  workoutName: string;
  requiredMuscleGroups: string[];
  availableExercises: TrainingExercise[];
  selectedExerciseIds: string[];
  onToggleExercise: (exerciseId: string) => void;
  onApplyTemplate?: (exerciseIds: string[]) => void;
  canAddMore: boolean;
  isValid: boolean;
  selectedCount: number;
  maxCount: number;
}

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  CHEST: 'bg-red-100 text-red-800',
  BACK: 'bg-blue-100 text-blue-800',
  SHOULDERS: 'bg-yellow-100 text-yellow-800',
  BICEPS: 'bg-purple-100 text-purple-800',
  TRICEPS: 'bg-pink-100 text-pink-800',
  QUADRICEPS: 'bg-green-100 text-green-800',
  HAMSTRINGS: 'bg-orange-100 text-orange-800',
  GLUTES: 'bg-indigo-100 text-indigo-800',
  CALVES: 'bg-gray-100 text-gray-800',
  ABS: 'bg-cyan-100 text-cyan-800',
  FOREARMS: 'bg-amber-100 text-amber-800',
  ADDUCTORS: 'bg-emerald-100 text-emerald-800',
};

const EXERCISE_TYPE_INFO = {
  COMPOUND: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: '🏋️',
    description: 'Multi-joint, multiple muscle groups'
  },
  ISOLATION: {
    color: 'bg-blue-100 text-blue-800',
    icon: '🎯',
    description: 'Single joint, targeted muscle'
  },
  UNILATERAL: {
    color: 'bg-purple-100 text-purple-800',
    icon: '⚖️',
    description: 'Single limb, balance correction'
  }
};

export default function EnhancedExerciseSelector({
  workoutTemplateId,
  workoutName,
  requiredMuscleGroups,
  availableExercises,
  selectedExerciseIds,
  onToggleExercise,
  onApplyTemplate,
  canAddMore,
  isValid,
  selectedCount,
  maxCount
}: EnhancedExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showOnlyRequired, setShowOnlyRequired] = useState(false);

  // Get real-time volume analysis from store
  const getRecommendedSetsFromStore = useProgramBuilderStore(state => state.getRecommendedSets);
  const getWorkoutVolume = useProgramBuilderStore(state => state.getWorkoutVolume);
  const selectedCategory = useProgramBuilderStore(state => state.selectedCategory);
  
  const workoutVolume = getWorkoutVolume(workoutTemplateId);

  // Calculate missing muscle groups for current workout
  const missingMuscleGroups = requiredMuscleGroups.filter(muscle => 
    !workoutVolume.muscleGroups.some(vol => vol.muscleGroup === muscle && vol.totalSets > 0)
  );

  // Calculate volume for each exercise
  const exercisesWithVolume: ExerciseWithVolume[] = useMemo(() => {
    return availableExercises.map(exercise => {
      const isSelected = selectedExerciseIds.includes(exercise.id);
      const baseSets = isSelected ? getRecommendedSetsFromStore(exercise.type, exercise.primaryMuscleGroup) : 0;
      
      const indirectVolume: { [muscleGroup: string]: number } = {};
      exercise.secondaryMuscleGroups.forEach(muscle => {
        indirectVolume[muscle] = baseSets * 0.5; // Indirect volume counts as half
      });

      return {
        ...exercise,
        directVolume: baseSets,
        indirectVolume,
        totalSets: baseSets
      };
    });
  }, [availableExercises, selectedExerciseIds, getRecommendedSetsFromStore]);

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    return exercisesWithVolume.filter(exercise => {
      // Search filter
      if (searchTerm && !exercise.name.en.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Muscle group filter
      if (muscleFilter !== 'all' && exercise.primaryMuscleGroup !== muscleFilter) {
        return false;
      }

      // Exercise type filter
      if (typeFilter !== 'all' && exercise.type !== typeFilter.toUpperCase()) {
        return false;
      }

      // Required muscle groups filter
      if (showOnlyRequired && !requiredMuscleGroups.includes(exercise.primaryMuscleGroup)) {
        return false;
      }

      return true;
    });
  }, [exercisesWithVolume, searchTerm, muscleFilter, typeFilter, showOnlyRequired, requiredMuscleGroups]);

  // Calculate total volume by muscle group
  const muscleGroupVolumes = useMemo(() => {
    const volumes: Record<string, { direct: number; indirect: number; total: number }> = {};
    
    exercisesWithVolume.forEach(exercise => {
      if (selectedExerciseIds.includes(exercise.id)) {
        // Direct volume
        const primaryMuscle = exercise.primaryMuscleGroup;
        if (!volumes[primaryMuscle]) {
          volumes[primaryMuscle] = { direct: 0, indirect: 0, total: 0 };
        }
        volumes[primaryMuscle].direct += exercise.directVolume;
        
        // Indirect volume
        exercise.secondaryMuscleGroups.forEach(muscle => {
          if (!volumes[muscle]) {
            volumes[muscle] = { direct: 0, indirect: 0, total: 0 };
          }
          volumes[muscle].indirect += exercise.indirectVolume[muscle] || 0;
        });
      }
    });

    // Calculate totals
    Object.keys(volumes).forEach(muscle => {
      volumes[muscle].total = volumes[muscle].direct + volumes[muscle].indirect;
    });

    return volumes;
  }, [exercisesWithVolume, selectedExerciseIds]);

  const uniqueMuscleGroups = Array.from(new Set(availableExercises.map(ex => ex.primaryMuscleGroup)));

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {workoutName}
            </CardTitle>
            <CardDescription>
              Required: {requiredMuscleGroups.join(', ')} • {selectedCount}/{maxCount} exercises
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isValid ? "default" : "destructive"}>
              {selectedCount}/{maxCount} exercises
            </Badge>
            {isValid && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Missing Muscle Groups Alert with Suggestions */}
        {missingMuscleGroups.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 mb-1">Missing Muscle Groups</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  The following required muscle groups are not being trained:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {missingMuscleGroups.map(muscle => (
                    <Badge key={muscle} variant="outline" className="text-yellow-800 border-yellow-300">
                      {muscle}
                    </Badge>
                  ))}
                </div>
                
                {/* Exercise Suggestions */}
                <div className="bg-yellow-100 rounded-md p-3">
                  <h5 className="font-medium text-yellow-800 mb-2 text-sm">Suggested Exercises:</h5>
                  <div className="space-y-1">
                    {missingMuscleGroups.slice(0, 2).map(muscle => {
                      const suggestedExercises = availableExercises
                        .filter(ex => ex.primaryMuscleGroup === muscle && !selectedExerciseIds.includes(ex.id))
                        .slice(0, 2);
                      
                      return suggestedExercises.length > 0 ? (
                        <div key={muscle} className="text-sm">
                          <span className="font-medium text-yellow-800">{muscle}:</span>{' '}
                          {suggestedExercises.map(ex => ex.name.en).join(', ')}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Smart Templates</TabsTrigger>
            <TabsTrigger value="selection">Manual Selection</TabsTrigger>
            <TabsTrigger value="volume">Volume Analysis</TabsTrigger>
          </TabsList>
          
          {/* Templates Tab */}
          <TabsContent value="templates">
            {onApplyTemplate && (
              <CategoryTemplates
                selectedCategory={selectedCategory}
                availableExercises={availableExercises}
                workoutName={workoutName}
                requiredMuscleGroups={requiredMuscleGroups}
                onApplyTemplate={onApplyTemplate}
              />
            )}
          </TabsContent>

          <TabsContent value="selection" className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={muscleFilter} onValueChange={setMuscleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by muscle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Muscles</SelectItem>
                  {uniqueMuscleGroups.map(muscle => (
                    <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                  <SelectItem value="unilateral">Unilateral</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required-only"
                  checked={showOnlyRequired}
                  onCheckedChange={(checked) => setShowOnlyRequired(!!checked)}
                />
                <Label htmlFor="required-only" className="text-sm">Required only</Label>
              </div>
            </div>

            {/* Exercise List */}
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredExercises.map(exercise => {
                const isSelected = selectedExerciseIds.includes(exercise.id);
                const canSelect = !isSelected && canAddMore;
                const typeInfo = EXERCISE_TYPE_INFO[exercise.type as keyof typeof EXERCISE_TYPE_INFO];

                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary' : 'border-border'
                    } ${!canSelect && !isSelected ? 'opacity-50' : 'hover:bg-muted/50 cursor-pointer'}`}
                    onClick={() => (canSelect || isSelected) && onToggleExercise(exercise.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={!canSelect && !isSelected}
                      onChange={() => {}} // Handled by div onClick
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-medium">
                          {exercise.name.en}
                        </div>
                        <Badge className={typeInfo.color}>
                          {typeInfo.icon} {exercise.type}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge className={MUSCLE_GROUP_COLORS[exercise.primaryMuscleGroup]}>
                          {exercise.primaryMuscleGroup}
                        </Badge>
                        {exercise.secondaryMuscleGroups.map(muscle => (
                          <Badge key={muscle} variant="outline" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="text-xs text-muted-foreground">
                          Recommended: {exercise.totalSets} sets
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="text-right">
                        <div className="text-sm font-medium">{exercise.totalSets} sets</div>
                        <div className="text-xs text-muted-foreground">
                          {exercise.indirectVolume && Object.keys(exercise.indirectVolume).length > 0 && (
                            `+${Object.values(exercise.indirectVolume).reduce((a, b) => a + b, 0)} indirect`
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exercises found matching your filters.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setMuscleFilter('all');
                    setTypeFilter('all');
                    setShowOnlyRequired(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="volume" className="space-y-4">
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Volume Distribution by Muscle Group
              </h4>

              {Object.entries(muscleGroupVolumes).map(([muscle, volume]) => (
                <div key={muscle} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={MUSCLE_GROUP_COLORS[muscle]}>{muscle}</Badge>
                    {requiredMuscleGroups.includes(muscle) && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {volume.total.toFixed(1)} total sets
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {volume.direct} direct + {volume.indirect.toFixed(1)} indirect
                    </div>
                  </div>
                </div>
              ))}

              {Object.keys(muscleGroupVolumes).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select exercises to see volume distribution.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}