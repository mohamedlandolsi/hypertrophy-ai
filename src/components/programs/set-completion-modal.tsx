'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { ExerciseSet } from '@/components/programs/interactive-program-viewer';

interface SetCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<ExerciseSet>) => void;
  set: ExerciseSet;
  exerciseName: string;
  setNumber: number;
  previousSets?: ExerciseSet[];
}

export function SetCompletionModal({
  isOpen,
  onClose,
  onComplete,
  set,
  exerciseName,
  setNumber,
  previousSets = []
}: SetCompletionModalProps) {
  const [actualReps, setActualReps] = useState<number>(
    typeof set.reps === 'number' ? set.reps : 10
  );
  const [actualWeight, setActualWeight] = useState<number>(set.weight || 0);
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'failed' | 'modified'>('completed');

  const handleSubmit = () => {
    onComplete({
      actualReps,
      actualWeight,
      rpe,
      notes,
      isCompleted: completionStatus === 'completed'
    });
    onClose();
  };

  const getLastSetData = () => {
    if (previousSets.length > 0) {
      const lastSet = previousSets[previousSets.length - 1];
      return {
        reps: lastSet.actualReps || lastSet.reps,
        weight: lastSet.actualWeight || lastSet.weight,
        rpe: lastSet.rpe
      };
    }
    return null;
  };

  const lastSetData = getLastSetData();

  const getRPEDescription = (rpe: number) => {
    const descriptions = {
      6: 'Easy - Could do 4+ more reps',
      7: 'Moderate - Could do 3 more reps',
      8: 'Hard - Could do 2 more reps',
      9: 'Very Hard - Could do 1 more rep',
      10: 'Maximum - Could not do more reps'
    };
    return descriptions[rpe as keyof typeof descriptions] || '';
  };

  const getProgressComparison = () => {
    if (!lastSetData) return null;
    
    const weightChange = actualWeight - (lastSetData.weight as number || 0);
    const repsChange = actualReps - (typeof lastSetData.reps === 'number' ? lastSetData.reps : 0);
    
    return {
      weightChange,
      repsChange,
      isProgression: weightChange > 0 || (weightChange === 0 && repsChange > 0)
    };
  };

  const progressComparison = getProgressComparison();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Complete Set {setNumber}
          </DialogTitle>
          <DialogDescription>
            Record your performance for <strong>{exerciseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target vs Actual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Target</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-semibold">{set.reps} reps</div>
                {set.weight && <div className="text-sm text-muted-foreground">{set.weight} kg</div>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Previous Set</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {lastSetData ? (
                  <>
                    <div className="text-lg font-semibold">{lastSetData.reps} reps</div>
                    <div className="text-sm text-muted-foreground">{lastSetData.weight} kg</div>
                    {lastSetData.rpe && (
                      <Badge variant="outline" className="mt-1">RPE {lastSetData.rpe}</Badge>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">First set</div>
                )}
              </div>
            </div>
          </div>

          {/* Actual Performance */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual-reps">Actual Reps</Label>
                <Input
                  id="actual-reps"
                  type="number"
                  value={actualReps}
                  onChange={(e) => setActualReps(parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual-weight">Weight (kg)</Label>
                <Input
                  id="actual-weight"
                  type="number"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                  step="0.5"
                  min="0"
                />
              </div>
            </div>

            {/* RPE Slider */}
            <div className="space-y-3">
              <Label>Rate of Perceived Exertion (RPE)</Label>
              <div className="space-y-2">
                <Slider
                  value={[rpe]}
                  onValueChange={(value: number[]) => setRpe(value[0])}
                  min={6}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>6 - Easy</span>
                  <span className="font-medium text-center">RPE {rpe}</span>
                  <span>10 - Max</span>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {getRPEDescription(rpe)}
                </p>
              </div>
            </div>

            {/* Completion Status */}
            <div className="space-y-2">
              <Label>Set Status</Label>
              <Select value={completionStatus} onValueChange={(value: 'completed' | 'failed' | 'modified') => setCompletionStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Completed Successfully
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      Failed/Incomplete
                    </div>
                  </SelectItem>
                  <SelectItem value="modified">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      Modified Exercise
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress Indicator */}
            {progressComparison && (
              <div className={`p-3 rounded-lg ${progressComparison.isProgression ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${progressComparison.isProgression ? 'text-green-600' : 'text-orange-600'}`} />
                  <span className="font-medium text-sm">
                    {progressComparison.isProgression ? 'Progression!' : 'Comparison'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {progressComparison.weightChange !== 0 && (
                    <span>Weight: {progressComparison.weightChange > 0 ? '+' : ''}{progressComparison.weightChange}kg </span>
                  )}
                  {progressComparison.repsChange !== 0 && (
                    <span>Reps: {progressComparison.repsChange > 0 ? '+' : ''}{progressComparison.repsChange}</span>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="How did the set feel? Any adjustments made?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Complete Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}