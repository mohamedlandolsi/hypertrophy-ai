'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Plus, Search, Edit, Trash2, Eye, Filter, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface TrainingSplit {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  difficulty: string;
  isActive: boolean;
  structuresCount: number;
  programsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Structure {
  id: string;
  pattern: string;
  daysPerWeek: number;
  isWeeklyBased: boolean;
  dayAssignmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

const FOCUS_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes',
  'Core', 'Abs', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Calves'
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function TrainingSplitsPage() {
  const router = useRouter();
  const [filteredSplits, setFilteredSplits] = useState<TrainingSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    focusAreas: [] as string[],
    difficulty: 'Intermediate',
    isActive: true
  });

  const [selectedSplit, setSelectedSplit] = useState<TrainingSplit | null>(null);
  const [selectedSplitStructures, setSelectedSplitStructures] = useState<Structure[]>([]);
  const [splitToDelete, setSplitToDelete] = useState<TrainingSplit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  // Fetch training splits
  const fetchSplits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('active', activeFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/training-splits?${params}`);
      const data = await response.json();

      if (data.success) {
        setFilteredSplits(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch training splits',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch training splits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch split details with structures
  const fetchSplitDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/training-splits/${id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedSplit(data.data);
        setSelectedSplitStructures(data.data.structures || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch split details',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch split details',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchSplits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilter]);

  // Handle create submit
  const handleCreateSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.focusAreas.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one focus area is required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/training-splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Training split created successfully'
        });

        // Optimistic update
        setFilteredSplits(prev => [data.data, ...prev]);

        // Reset form and close modal
        setFormData({
          name: '',
          description: '',
          focusAreas: [],
          difficulty: 'Intermediate',
          isActive: true
        });
        setIsCreateModalOpen(false);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to create training split',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create training split',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedSplit) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.focusAreas.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one focus area is required',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/training-splits/${selectedSplit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Training split updated successfully'
        });

        // Optimistic update
        setFilteredSplits(prev => prev.map((s: TrainingSplit) => 
          s.id === selectedSplit.id ? data.data : s
        ));

        setIsEditModalOpen(false);
        setSelectedSplit(null);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update training split',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update training split',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!splitToDelete) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/training-splits/${splitToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Training split deactivated successfully'
        });

        // Optimistic update
        setFilteredSplits(prev => prev.map((s: TrainingSplit) => 
          s.id === splitToDelete.id ? { ...s, isActive: false } : s
        ));

        setIsDeleteDialogOpen(false);
        setSplitToDelete(null);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to deactivate training split',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to deactivate training split',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (split: TrainingSplit) => {
    setSelectedSplit(split);
    setFormData({
      name: split.name,
      description: split.description,
      focusAreas: split.focusAreas,
      difficulty: split.difficulty,
      isActive: split.isActive
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = async (split: TrainingSplit) => {
    setSelectedSplit(split);
    setIsViewModalOpen(true);
    await fetchSplitDetails(split.id);
  };

  // Open delete dialog
  const openDeleteDialog = (split: TrainingSplit) => {
    setSplitToDelete(split);
    setIsDeleteDialogOpen(true);
  };

  // Toggle focus area selection
  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Training Splits</h1>
              <p className="text-muted-foreground mt-1">
                Manage training split templates and their structures
              </p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Split
            </Button>
          </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Splits</SelectItem>
                    <SelectItem value="true">Active Only</SelectItem>
                    <SelectItem value="false">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredSplits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No training splits found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create your first split
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Focus Areas</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-center">Structures</TableHead>
                    <TableHead className="text-center">Programs</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSplits.map((split) => (
                    <TableRow key={split.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{split.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {split.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {split.focusAreas.slice(0, 3).map(area => (
                            <Badge key={area} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {split.focusAreas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{split.focusAreas.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            split.difficulty === 'Beginner' ? 'default' :
                            split.difficulty === 'Intermediate' ? 'secondary' :
                            'outline'
                          }
                        >
                          {split.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {split.structuresCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {split.programsCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={split.isActive ? 'default' : 'destructive'}>
                          {split.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/training-splits/${split.id}/structures`)}
                            title="Manage Structures"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(split)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(split)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(split)}
                            disabled={!split.isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Split</DialogTitle>
            <DialogDescription>
              Create a new training split template with focus areas and difficulty level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Upper/Lower Split"
              />
            </div>

            <div>
              <Label htmlFor="create-description">Description *</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this training split..."
                rows={4}
              />
            </div>

            <div>
              <Label>Focus Areas * (Select at least one)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {FOCUS_AREAS.map(area => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-${area}`}
                      checked={formData.focusAreas.includes(area)}
                      onCheckedChange={() => toggleFocusArea(area)}
                    />
                    <label
                      htmlFor={`create-${area}`}
                      className="text-sm cursor-pointer"
                    >
                      {area}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="create-difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger id="create-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(diff => (
                    <SelectItem key={diff} value={diff}>
                      {diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                }
              />
              <label htmlFor="create-active" className="text-sm cursor-pointer">
                Active (visible to users)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({
                  name: '',
                  description: '',
                  focusAreas: [],
                  difficulty: 'Intermediate',
                  isActive: true
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Split'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Split</DialogTitle>
            <DialogDescription>
              Update training split details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Upper/Lower Split"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this training split..."
                rows={4}
              />
            </div>

            <div>
              <Label>Focus Areas * (Select at least one)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {FOCUS_AREAS.map(area => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${area}`}
                      checked={formData.focusAreas.includes(area)}
                      onCheckedChange={() => toggleFocusArea(area)}
                    />
                    <label
                      htmlFor={`edit-${area}`}
                      className="text-sm cursor-pointer"
                    >
                      {area}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger id="edit-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(diff => (
                    <SelectItem key={diff} value={diff}>
                      {diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                }
              />
              <label htmlFor="edit-active" className="text-sm cursor-pointer">
                Active (visible to users)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedSplit(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Split'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal (with structures) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSplit?.name}</DialogTitle>
            <DialogDescription>
              View training split details and associated structures
            </DialogDescription>
          </DialogHeader>

          {selectedSplit && (
            <div className="space-y-6">
              {/* Split Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedSplit.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Focus Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSplit.focusAreas.map(area => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Difficulty</Label>
                    <p className="mt-1">{selectedSplit.difficulty}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Structures</Label>
                    <p className="mt-1">{selectedSplit.structuresCount}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="mt-1">
                      <Badge variant={selectedSplit.isActive ? 'default' : 'destructive'}>
                        {selectedSplit.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Related Structures */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Related Structures</h3>
                {selectedSplitStructures.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No structures created for this split yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedSplitStructures.map(structure => (
                      <Card key={structure.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{structure.pattern}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {structure.isWeeklyBased ? 'Weekly' : 'Cyclic'} • {structure.daysPerWeek} days/week • {structure.dayAssignmentsCount} day assignments
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Training Split?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{splitToDelete?.name}&quot; and make it unavailable to users.
              {splitToDelete && splitToDelete.programsCount > 0 && (
                <span className="block mt-2 font-semibold text-orange-600">
                  Note: This split is currently used in {splitToDelete.programsCount} program(s).
                </span>
              )}
              This action can be reversed by editing the split and setting it to active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
