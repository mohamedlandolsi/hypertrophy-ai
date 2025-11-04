'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, Plus, MoreVertical, Edit, Trash2, Play, FileText,
  Calendar, Clock, Dumbbell, Filter, TrendingUp, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomTrainingProgram {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE';
  createdAt: string;
  updatedAt: string;
  trainingSplit: {
    id: string;
    name: string;
    difficulty: string;
    focusAreas: string[];
  };
  splitStructure: {
    id: string;
    daysPerWeek: number;
    pattern: string;
  };
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  workouts: Array<{
    id: string;
    name: string;
  }>;
}

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  split: string;
  exerciseCount: number;
  workoutCount: number;
}

export default function ProgramsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [myPrograms, setMyPrograms] = useState<CustomTrainingProgram[]>([]);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  
  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [splitFilter, setSplitFilter] = useState<string>('all');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<CustomTrainingProgram | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');
  const [startMethod, setStartMethod] = useState<'scratch' | 'template'>('scratch');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's programs
      const programsResponse = await fetch('/api/user/programs');
      if (programsResponse.ok) {
        const data = await programsResponse.json();
        setMyPrograms(data.programs || []);
      }

      // Fetch templates (using existing workout templates)
      const templatesResponse = await fetch('/api/workout-templates?limit=12');
      if (templatesResponse.ok) {
        const data = await templatesResponse.json();
        // Transform workout templates into program templates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const programTemplates: ProgramTemplate[] = data.templates?.slice(0, 12).map((t: any) => ({
          id: t.id,
          name: t.name,
          description: `${t.type} workout template`,
          difficulty: t.split.difficulty,
          split: t.split.name,
          exerciseCount: t.exerciseCount,
          workoutCount: 1
        })) || [];
        setTemplates(programTemplates);
      }

      // Fetch available splits (removed - not used currently)
      // const splitsResponse = await fetch('/api/training-splits');
      // if (splitsResponse.ok) {
      //   const data = await splitsResponse.json();
      //   setSplits(data.splits || []);
      // }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) {
      toast.error('Please enter a program name');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/user/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProgramName,
          description: newProgramDescription,
          startMethod,
          templateId: startMethod === 'template' ? selectedTemplateId : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create program');
      }

      toast.success('Program created successfully!');
      setCreateModalOpen(false);
      resetForm();

      // Navigate to split selection page
      router.push(`/${locale}/programs/${data.program.id}/split-structure`);
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create program');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/user/programs/${programToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete program');
      }

      toast.success('Program deleted successfully');
      setMyPrograms(prev => prev.filter(p => p.id !== programToDelete.id));
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete program');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setNewProgramName('');
    setNewProgramDescription('');
    setStartMethod('scratch');
    setSelectedTemplateId('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesDifficulty = difficultyFilter === 'all' || template.difficulty.toLowerCase() === difficultyFilter;
    const matchesSplit = splitFilter === 'all' || template.split === splitFilter;
    return matchesDifficulty && matchesSplit;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Training Programs</h1>
        <p className="text-muted-foreground">
          Create and manage your personalized training programs
        </p>
      </div>

      {/* Section A: My Programs */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">My Programs</h2>
            <Badge variant="outline">{myPrograms.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/${locale}/programs/create`)}>
              <Target className="h-4 w-4 mr-2" />
              Guided Setup
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Create
            </Button>
          </div>
        </div>

        {myPrograms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No programs yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first training program to get started with your personalized fitness journey.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push(`/${locale}/programs/create`)} size="lg" variant="default">
                  <Target className="h-5 w-5 mr-2" />
                  Guided Setup
                </Button>
                <Button onClick={() => setCreateModalOpen(true)} size="lg" variant="outline">
                  <Plus className="h-5 w-5 mr-2" />
                  Quick Create
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myPrograms.map((program) => (
              <Card
                key={program.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 line-clamp-1">
                        {program.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${locale}/programs/${program.id}/workouts`);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${locale}/programs/${program.id}/split-structure`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgramToDelete(program);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Split Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Split</span>
                      <Badge variant="outline">{program.trainingSplit.name}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <Badge className={getDifficultyColor(program.trainingSplit.difficulty)}>
                        {program.trainingSplit.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={getStatusColor(program.status)}>
                        {program.status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created
                      </span>
                      <span>{formatDate(program.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated
                      </span>
                      <span>{formatDate(program.updatedAt)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/${locale}/programs/${program.id}/workouts`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Open Program
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-12" />

      {/* Section B: Browse Templates */}
      <div>
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Browse Templates</h2>
            <Badge variant="secondary">For Inspiration</Badge>
          </div>
          <p className="text-muted-foreground mb-4">
            Get inspired by popular workout templates to kickstart your program
          </p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={splitFilter} onValueChange={setSplitFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Split Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Splits</SelectItem>
                {Array.from(new Set(templates.map(t => t.split))).map(split => (
                  <SelectItem key={split} value={split}>{split}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(difficultyFilter !== 'all' || splitFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDifficultyFilter('all');
                  setSplitFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your filters or check back later for more templates.
              </p>
              <Button variant="outline" onClick={() => {
                setDifficultyFilter('all');
                setSplitFilter('all');
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group transition-all hover:shadow-lg hover:border-primary/50"
              >
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {template.split}
                    </Badge>
                    <Badge className={cn("text-xs", getDifficultyColor(template.difficulty))}>
                      {template.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Exercises</span>
                      <span className="font-medium text-foreground">{template.exerciseCount}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartMethod('template');
                      setSelectedTemplateId(template.id);
                      setCreateModalOpen(true);
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Use as Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Program Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
            <DialogDescription>
              Set up your training program and choose how to start
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Strength Program"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your program goals and approach..."
                rows={3}
                value={newProgramDescription}
                onChange={(e) => setNewProgramDescription(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>How would you like to start?</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    startMethod === 'scratch' ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  )}
                  onClick={() => setStartMethod('scratch')}
                >
                  <CardContent className="pt-6 pb-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">From Scratch</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Build your program step-by-step
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    startMethod === 'template' ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  )}
                  onClick={() => setStartMethod('template')}
                >
                  <CardContent className="pt-6 pb-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Use Template</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start with a pre-made workout
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {startMethod === 'template' && (
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateProgram} disabled={creating || !newProgramName.trim()}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{programToDelete?.name}&quot;? This action cannot be undone.
              All workouts and exercises will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgram}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
