'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Dumbbell,
  AlertCircle,
  Eye,
  Download,
  X,
  Filter,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  exerciseType: string;
  volumeContributions: Record<string, number>;
  canBeUnilateral: boolean;
}

interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  isBilateral: boolean;
  order: number;
}

interface Split {
  id: string;
  name: string;
  difficulty: string;
  focusAreas?: string[];
}

interface WorkoutTemplate {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  exercises: TemplateExercise[];
  split: Split;
}

interface Filters {
  splits: Split[];
  difficulties: string[];
}

export interface WorkoutTemplateImporterProps {
  programId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

type ConflictStrategy = 'rename' | 'skip' | 'replace';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default function WorkoutTemplateImporter({
  programId,
  open,
  onOpenChange,
  onImportSuccess
}: WorkoutTemplateImporterProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filters, setFilters] = useState<Filters>({ splits: [], difficulties: [] });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSplit, setSelectedSplit] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  // Preview states
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('rename');

  // Fetch templates
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchQuery, selectedSplit, selectedDifficulty]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSplit !== 'all') params.append('splitId', selectedSplit);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);

      const response = await fetch(`/api/workout-templates?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data.templates);
      setFilters(data.filters);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewTemplate) return;

    try {
      setImporting(true);

      const response = await fetch(`/api/programs/${programId}/import-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: previewTemplate.id,
          conflictStrategy
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.skipped) {
          toast.warning('Workout already exists and was skipped');
        } else {
          throw new Error(data.error || 'Failed to import template');
        }
        return;
      }

      if (data.renamed) {
        toast.success(`Template imported as "${data.workout.name}"`);
      } else {
        toast.success('Template imported successfully');
      }

      // Close modal and trigger refresh
      setPreviewTemplate(null);
      onOpenChange(false);
      onImportSuccess?.();
      
      // Reset filters
      setSearchQuery('');
      setSelectedSplit('all');
      setSelectedDifficulty('all');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import template');
    } finally {
      setImporting(false);
    }
  };

  const handlePreview = (template: WorkoutTemplate) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  return (
    <>
      {/* Main Template Browser Dialog */}
      <Dialog open={open && !previewTemplate} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Dumbbell className="h-5 w-5" />
              <span>Import Workout Template</span>
            </DialogTitle>
            <DialogDescription>
              Browse and import pre-configured workouts into your program
            </DialogDescription>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Split Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Filter className="h-3 w-3" />
                  <span>Training Split</span>
                </Label>
                <Select value={selectedSplit} onValueChange={setSelectedSplit}>
                  <SelectTrigger>
                    <SelectValue placeholder="All splits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Splits</SelectItem>
                    {filters.splits.map((split) => (
                      <SelectItem key={split.id} value={split.id}>
                        {split.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Filter className="h-3 w-3" />
                  <span>Difficulty Level</span>
                </Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {filters.difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No templates found. Try adjusting your filters or search query.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
                    onClick={() => handlePreview(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                          </CardDescription>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Exercise Count */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Exercises</span>
                        <span className="font-semibold">{template.exerciseCount}</span>
                      </div>

                      <Separator />

                      {/* Split Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Split</span>
                          <span className="font-medium text-xs">{template.split.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Difficulty</span>
                          <Badge className={cn("text-xs", getDifficultyColor(template.split.difficulty))}>
                            {template.split.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Focus Areas */}
                      {template.split.focusAreas && template.split.focusAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.split.focusAreas.slice(0, 3).map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {template.split.focusAreas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.split.focusAreas.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Eye className="h-3 w-3 mr-2" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{previewTemplate.name}</DialogTitle>
                    <DialogDescription className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{previewTemplate.type}</Badge>
                        <Badge className={getDifficultyColor(previewTemplate.split.difficulty)}>
                          {previewTemplate.split.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm">{previewTemplate.exerciseCount} exercises</p>
                    </DialogDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClosePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Conflict Strategy Selection */}
              <div className="space-y-2">
                <Label>If workout name exists:</Label>
                <Select
                  value={conflictStrategy}
                  onValueChange={(value) => setConflictStrategy(value as ConflictStrategy)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rename">Rename automatically (add number)</SelectItem>
                    <SelectItem value="skip">Skip import</SelectItem>
                    <SelectItem value="replace">Replace existing workout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Exercise List */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Exercises ({previewTemplate.exercises.length})
                  </h4>
                  {previewTemplate.exercises.map((ex, index) => (
                    <Card key={ex.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-medium">{ex.exercise.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {ex.sets} × {ex.reps}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Target className="h-3 w-3 mr-1" />
                                  {ex.exercise.primaryMuscle}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {ex.exercise.exerciseType}
                                </Badge>
                                {!ex.isBilateral && ex.exercise.canBeUnilateral && (
                                  <Badge variant="secondary" className="text-xs">
                                    Unilateral
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {ex.exercise.secondaryMuscles.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Secondary: {ex.exercise.secondaryMuscles.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={handleClosePreview} disabled={importing}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import Workout
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
