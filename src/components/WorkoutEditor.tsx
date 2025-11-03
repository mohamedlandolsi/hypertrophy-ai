'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  Edit, 
  Save, 
  Eye, 
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string | null;
  secondaryMuscles: string[];
  exerciseType: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
  volumeContributions: Record<string, number>; // muscle -> contribution (0-1)
  canBeUnilateral: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  isBilateral: boolean;
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  assignedDays: string[];
  exercises: WorkoutExercise[];
}

export interface WorkoutEditorProps {
  workoutId: string;
  programId: string;
  onSave?: () => void;
  onPreview?: () => void;
}

interface MuscleVolumeMetric {
  muscle: string;
  volume: number;
  target: number;
  status: 'critical' | 'low' | 'good' | 'optimal';
  percentage: number;
}

// Sortable Exercise Card Component
function SortableExerciseCard({ 
  workoutExercise, 
  onEdit, 
  onDelete 
}: { 
  workoutExercise: WorkoutExercise;
  onEdit: (exercise: WorkoutExercise) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: workoutExercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const { exercise } = workoutExercise;

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "transition-all hover:shadow-md",
        isDragging && "shadow-lg"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Exercise Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base">{exercise.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {exercise.primaryMuscle || 'Not set'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {exercise.exerciseType}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(workoutExercise)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(workoutExercise.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sets/Reps and Bilateral Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 font-medium">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span>{workoutExercise.sets} × {workoutExercise.reps}</span>
              </div>
              
              {exercise.canBeUnilateral && (
                <Badge variant={workoutExercise.isBilateral ? 'default' : 'secondary'}>
                  {workoutExercise.isBilateral ? 'Bilateral' : 'Unilateral'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Exercise Sheet Component
function AddExerciseSheet({ 
  isOpen, 
  onOpenChange, 
  onAdd 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exercise: Exercise, sets: number, reps: number, isBilateral: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [exerciseFilter, setExerciseFilter] = useState<'ALL' | 'COMPOUND' | 'ISOLATION'>('ALL');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(8);
  const [isBilateral, setIsBilateral] = useState(true);
  const [loading, setLoading] = useState(false);

  const muscles = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Traps'
  ];

  const fetchExercises = useCallback(async () => {
    if (!selectedMuscle) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/exercises/by-muscle-group?muscle=${selectedMuscle}`);
      if (!response.ok) throw new Error('Failed to fetch exercises');
      
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      toast.error('Failed to load exercises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedMuscle]);

  useEffect(() => {
    if (step === 2 && selectedMuscle) {
      fetchExercises();
    }
  }, [step, selectedMuscle, fetchExercises]);

  const filteredExercises = exercises.filter(ex => {
    if (exerciseFilter === 'ALL') return true;
    return ex.exerciseType === exerciseFilter;
  });

  const handleReset = () => {
    setStep(1);
    setSelectedMuscle('');
    setSelectedExercise(null);
    setSets(3);
    setReps(8);
    setIsBilateral(true);
    setExerciseFilter('ALL');
  };

  const handleAdd = () => {
    if (!selectedExercise) return;
    onAdd(selectedExercise, sets, reps, isBilateral);
    handleReset();
    onOpenChange(false);
    toast.success('Exercise added to workout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleReset();
    }}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Exercise</SheetTitle>
          <SheetDescription>
            Step {step} of 4: {
              step === 1 ? 'Select target muscle' :
              step === 2 ? 'Choose exercise' :
              step === 3 ? 'Configure sets & reps' :
              'Bilateral/Unilateral'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Step 1: Select Muscle */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Target Muscle Group</Label>
              <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select muscle group..." />
                </SelectTrigger>
                <SelectContent>
                  {muscles.map(muscle => (
                    <SelectItem key={muscle} value={muscle}>
                      {muscle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!selectedMuscle}
              >
                Next: Choose Exercise
              </Button>
            </div>
          )}

          {/* Step 2: Select Exercise */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Exercise</Label>
                <div className="flex gap-2">
                  <Button
                    variant={exerciseFilter === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExerciseFilter('ALL')}
                  >
                    All
                  </Button>
                  <Button
                    variant={exerciseFilter === 'COMPOUND' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExerciseFilter('COMPOUND')}
                  >
                    Compound
                  </Button>
                  <Button
                    variant={exerciseFilter === 'ISOLATION' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExerciseFilter('ISOLATION')}
                  >
                    Isolation
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredExercises.map(exercise => (
                      <Card
                        key={exercise.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedExercise?.id === exercise.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{exercise.name}</h4>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {exercise.primaryMuscle || 'Not set'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {exercise.exerciseType}
                              </Badge>
                            </div>
                            </div>
                            {selectedExercise?.id === exercise.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!selectedExercise}
                  className="flex-1"
                >
                  Next: Sets & Reps
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Sets & Reps */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sets</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={sets}
                  onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reps</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                />
              </div>

              <Alert>
                <Dumbbell className="h-4 w-4" />
                <AlertDescription>
                  You&apos;re configuring: <strong>{sets} sets × {reps} reps</strong>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedExercise?.canBeUnilateral) {
                      setStep(4);
                    } else {
                      handleAdd();
                    }
                  }}
                  className="flex-1"
                >
                  {selectedExercise?.canBeUnilateral ? 'Next: Bilateral' : 'Add Exercise'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Bilateral/Unilateral */}
          {step === 4 && selectedExercise?.canBeUnilateral && (
            <div className="space-y-4">
              <Label>Exercise Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isBilateral && "ring-2 ring-primary"
                  )}
                  onClick={() => setIsBilateral(true)}
                >
                  <CardContent className="p-6 text-center">
                    <h4 className="font-semibold mb-2">Bilateral</h4>
                    <p className="text-sm text-muted-foreground">
                      Both sides together
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !isBilateral && "ring-2 ring-primary"
                  )}
                  onClick={() => setIsBilateral(false)}
                >
                  <CardContent className="p-6 text-center">
                    <h4 className="font-semibold mb-2">Unilateral</h4>
                    <p className="text-sm text-muted-foreground">
                      One side at a time
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleAdd} className="flex-1">
                  Add Exercise
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Volume Feedback Component
function VolumeFeedback({ 
  metrics 
}: { 
  metrics: MuscleVolumeMetric[] 
}) {
  const criticalMuscles = metrics.filter(m => m.status === 'critical');
  const lowMuscles = metrics.filter(m => m.status === 'low');
  const goodMuscles = metrics.filter(m => m.status === 'good' || m.status === 'optimal');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Volume Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Warnings */}
        {criticalMuscles.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical:</strong> Missing or very low volume for{' '}
              {criticalMuscles.map(m => m.muscle).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Low Volume Warnings */}
        {lowMuscles.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Low Volume:</strong> Consider adding more exercises for{' '}
              {lowMuscles.map(m => m.muscle).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Good Volume */}
        {goodMuscles.length > 0 && criticalMuscles.length === 0 && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Good balance</strong> for {goodMuscles.map(m => m.muscle).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Detailed Metrics */}
        <div className="space-y-3">
          {metrics.map(metric => (
            <div key={metric.muscle} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{metric.muscle}</span>
                <span className="text-muted-foreground">
                  {metric.volume.toFixed(1)} / {metric.target} sets
                </span>
              </div>
              <Progress 
                value={metric.percentage} 
                className={cn(
                  "h-2",
                  metric.status === 'critical' && "bg-red-100",
                  metric.status === 'low' && "bg-yellow-100",
                  (metric.status === 'good' || metric.status === 'optimal') && "bg-green-100"
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Workout Editor Component
export default function WorkoutEditor({
  workoutId,
  programId,
  onSave,
  onPreview
}: WorkoutEditorProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [volumeMetrics, setVolumeMetrics] = useState<MuscleVolumeMetric[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Fetch workout data
  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/programs/${programId}/workouts/${workoutId}`);
      if (!response.ok) throw new Error('Failed to fetch workout');
      
      const data = await response.json();
      setWorkout(data.workout);
    } catch (error) {
      toast.error('Failed to load workout');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [programId, workoutId]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  // Calculate volume metrics
  useEffect(() => {
    if (!workout) return;

    const muscleVolumes: Record<string, number> = {};
    
    workout.exercises.forEach(we => {
      const totalSets = we.sets;
      const contributions = we.exercise.volumeContributions;
      
      Object.entries(contributions).forEach(([muscle, contribution]) => {
        if (!muscleVolumes[muscle]) muscleVolumes[muscle] = 0;
        muscleVolumes[muscle] += totalSets * contribution;
      });
    });

    // Define targets based on workout type
    const targets: Record<string, number> = {
      'Chest': 12,
      'Back': 12,
      'Shoulders': 10,
      'Biceps': 8,
      'Triceps': 8,
      'Quads': 12,
      'Hamstrings': 10,
      'Glutes': 10
    };

    const metrics: MuscleVolumeMetric[] = Object.entries(targets).map(([muscle, target]) => {
      const volume = muscleVolumes[muscle] || 0;
      const percentage = Math.min((volume / target) * 100, 100);
      
      let status: MuscleVolumeMetric['status'];
      if (volume === 0) status = 'critical';
      else if (percentage < 50) status = 'low';
      else if (percentage < 80) status = 'good';
      else status = 'optimal';

      return { muscle, volume, target, status, percentage };
    });

    setVolumeMetrics(metrics);
  }, [workout]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWorkout(prev => {
        if (!prev) return prev;
        
        const oldIndex = prev.exercises.findIndex(ex => ex.id === active.id);
        const newIndex = prev.exercises.findIndex(ex => ex.id === over.id);
        
        const newExercises = arrayMove(prev.exercises, oldIndex, newIndex).map((ex, idx) => ({
          ...ex,
          order: idx
        }));
        
        return { ...prev, exercises: newExercises };
      });
    }
  };

  const handleAddExercise = async (
    exercise: Exercise,
    sets: number,
    reps: number,
    isBilateral: boolean
  ) => {
    if (!workout) return;

    const newExercise: WorkoutExercise = {
      id: `temp-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sets,
      reps,
      isBilateral,
      order: workout.exercises.length
    };

    setWorkout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise]
      };
    });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setWorkout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises
          .filter(ex => ex.id !== exerciseId)
          .map((ex, idx) => ({ ...ex, order: idx }))
      };
    });
    toast.success('Exercise removed');
  };

  const handleSaveWorkout = async () => {
    if (!workout) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/programs/${programId}/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workout.name,
          exercises: workout.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            isBilateral: ex.isBilateral,
            order: ex.order
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to save workout');
      
      toast.success('Workout saved successfully');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save workout');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!workout) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Workout not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Label>Workout Name</Label>
                <Input
                  value={workout.name}
                  onChange={(e) => setWorkout(prev => 
                    prev ? { ...prev, name: e.target.value } : prev
                  )}
                  placeholder="Enter workout name..."
                  className="text-lg font-semibold"
                />
              </div>
              <Badge className="ml-4" variant="secondary">
                {workout.type}
              </Badge>
            </div>

            {workout.assignedDays.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Assigned to:</span>
                {workout.assignedDays.map(day => (
                  <Badge key={day} variant="outline">
                    {day}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercises Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Exercises ({workout.exercises.length})
                </CardTitle>
                <Button onClick={() => setIsAddExerciseOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workout.exercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No exercises added yet
                  </p>
                  <Button onClick={() => setIsAddExerciseOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Exercise
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={workout.exercises.map(ex => ex.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {workout.exercises.map(exercise => (
                        <SortableExerciseCard
                          key={exercise.id}
                          workoutExercise={exercise}
                          onEdit={(ex) => {
                            // TODO: Implement edit functionality
                            console.log('Edit exercise:', ex);
                          }}
                          onDelete={handleDeleteExercise}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Volume Feedback Section */}
        <div className="space-y-4">
          <VolumeFeedback metrics={volumeMetrics} />
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
            
            <div className="flex gap-2">
              {onPreview && (
                <Button variant="outline" onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button onClick={handleSaveWorkout} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Exercise Sheet */}
      <AddExerciseSheet
        isOpen={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        onAdd={handleAddExercise}
      />
    </div>
  );
}
