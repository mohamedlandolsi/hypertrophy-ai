'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  TrendingUp,
  Calendar,
  Dumbbell,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProgramTemplate {
  id: string;
  name: string;
  description: string | null;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetAudience: string | null;
  estimatedDurationWeeks: number | null;
  popularity: number;
  trainingSplit: {
    name: string;
  };
  _count: {
    trainingPrograms: number;
    templateWorkouts: number;
  };
}

interface ConfirmationData {
  template: ProgramTemplate;
  customName: string;
}

interface UserTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

const difficultyColors = {
  BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  ADVANCED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function UserTemplateSelector({ open, onOpenChange, locale }: UserTemplateSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [splitFilter, setSplitFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'name'>('popular');

  // Confirmation modal
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [customName, setCustomName] = useState('');

  // Fetch templates
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.targetAudience?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((t) => t.difficultyLevel === difficultyFilter);
    }

    // Split filter
    if (splitFilter !== 'all') {
      filtered = filtered.filter((t) => t.trainingSplit.name === splitFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return 0; // Would need createdAt field
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, difficultyFilter, splitFilter, sortBy]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/programs/templates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: ProgramTemplate) => {
    setConfirmationData({ template, customName: template.name });
    setCustomName(template.name);
  };

  const handleConfirmCreate = async () => {
    if (!confirmationData) return;

    try {
      setCreating(true);
      const response = await fetch('/api/programs/create-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: confirmationData.template.id,
          customName: customName || confirmationData.template.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle tier limit error
        if (data.requiresUpgrade) {
          toast({
            title: 'Upgrade Required',
            description: data.message,
            variant: 'destructive',
            action: (
              <Button
                size="sm"
                onClick={() => router.push(`/${locale}/pricing`)}
              >
                Upgrade
              </Button>
            ),
          });
          return;
        }

        throw new Error(data.error || 'Failed to create program');
      }

      toast({
        title: 'Success!',
        description: `Program "${data.program.name}" created successfully`,
        variant: 'default',
      });

      // Close modals
      setConfirmationData(null);
      onOpenChange(false);

      // Redirect to program customization page
      router.push(`/${locale}/programs/${data.program.id}/build`);
      router.refresh();
    } catch (error) {
      console.error('Error creating program:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create program',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Get unique split types for filter
  const splitTypes = Array.from(new Set(templates.map((t) => t.trainingSplit.name)));

  return (
    <>
      {/* Main Template Selector Dialog */}
      <Dialog open={open && !confirmationData} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose a Program Template</DialogTitle>
            <DialogDescription>
              Select a pre-built program template to get started quickly
            </DialogDescription>
          </DialogHeader>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-4 border-b">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Split Filter */}
            <Select value={splitFilter} onValueChange={setSplitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Split Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Splits</SelectItem>
                {splitTypes.map((split) => (
                  <SelectItem key={split} value={split}>
                    {split}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 pb-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-1">
              <Button
                variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('popular')}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Most Popular
              </Button>
              <Button
                variant={sortBy === 'name' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                Name
              </Button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={difficultyColors[template.difficultyLevel]}>
                          {template.difficultyLevel}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Dumbbell className="h-3 w-3" />
                        {template.trainingSplit.name}
                        {template.estimatedDurationWeeks && (
                          <>
                            <span className="mx-1">•</span>
                            <Calendar className="h-3 w-3" />
                            {template.estimatedDurationWeeks} weeks
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description?.substring(0, 100) || 'No description'}
                        {template.description && template.description.length > 100 && '...'}
                      </p>
                      {template.targetAudience && (
                        <p className="text-xs text-muted-foreground mt-2">
                          For: {template.targetAudience}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {template._count.trainingPrograms} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3 w-3" />
                          {template._count.templateWorkouts} workouts
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmationData}
        onOpenChange={(open) => !open && setConfirmationData(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Program from Template</DialogTitle>
            <DialogDescription>
              Confirm the details of your new program
            </DialogDescription>
          </DialogHeader>

          {confirmationData && (
            <div className="space-y-4">
              {/* Template Preview */}
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Template:</strong> {confirmationData.template.name}
                  <br />
                  <strong>Workouts:</strong> {confirmationData.template._count.templateWorkouts}
                  <br />
                  <strong>Difficulty:</strong> {confirmationData.template.difficultyLevel}
                </AlertDescription>
              </Alert>

              {/* Custom Name Input */}
              <div className="space-y-2">
                <Label htmlFor="custom-name">Program Name (optional)</Label>
                <Input
                  id="custom-name"
                  placeholder={confirmationData.template.name}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the template name
                </p>
              </div>

              {/* What Will Happen */}
              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <p className="font-medium mb-2">What will happen:</p>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>A new program will be created in your account</li>
                  <li>All workouts and exercises will be copied</li>
                  <li>You can customize it after creation</li>
                  <li>The original template remains unchanged</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmationData(null)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmCreate} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Program
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
