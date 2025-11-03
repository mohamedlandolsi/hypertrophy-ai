'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface DayAssignment {
  id?: string;
  dayOfWeek?: string;
  dayNumber: number;
  workoutType: string;
}

interface Structure {
  id: string;
  daysPerWeek: number;
  pattern: string;
  isWeeklyBased: boolean;
  createdAt: string;
  programCount: number;
  dayAssignments: DayAssignment[];
}

interface Split {
  id: string;
  name: string;
  description: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TrainingSplitStructuresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [split, setSplit] = useState<Split | null>(null);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [structureToDelete, setStructureToDelete] = useState<Structure | null>(null);
  const [splitId, setSplitId] = useState<string>('');

  const [formData, setFormData] = useState({
    daysPerWeek: 3,
    pattern: '',
    isWeeklyBased: true,
    dayAssignments: [] as DayAssignment[],
  });

  useEffect(() => {
    params.then(p => {
      setSplitId(p.id);
      fetchData(p.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/training-splits/${id}/structures`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch structures');
      }

      const data = await response.json();
      setSplit(data.split);
      setStructures(data.structures);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load structures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      daysPerWeek: 3,
      pattern: '',
      isWeeklyBased: true,
      dayAssignments: [],
    });
  };

  const generateDefaultDayAssignments = (daysPerWeek: number, isWeeklyBased: boolean): DayAssignment[] => {
    return Array.from({ length: daysPerWeek }, (_, i) => ({
      dayNumber: i + 1,
      dayOfWeek: isWeeklyBased ? DAYS_OF_WEEK[i % 7] : undefined,
      workoutType: '',
    }));
  };

  const handleDaysPerWeekChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      daysPerWeek: value,
      dayAssignments: generateDefaultDayAssignments(value, prev.isWeeklyBased),
    }));
  };

  const handleIsWeeklyBasedChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isWeeklyBased: checked,
      dayAssignments: generateDefaultDayAssignments(prev.daysPerWeek, checked),
    }));
  };

  const handleDayAssignmentChange = (index: number, field: keyof DayAssignment, value: string) => {
    setFormData(prev => ({
      ...prev,
      dayAssignments: prev.dayAssignments.map((day, i) =>
        i === index ? { ...day, [field]: value } : day
      ),
    }));
  };

  const handleCreate = () => {
    resetFormData();
    setFormData(prev => ({
      ...prev,
      dayAssignments: generateDefaultDayAssignments(3, true),
    }));
    setCreateModalOpen(true);
  };

  const handleEdit = (structure: Structure) => {
    setSelectedStructure(structure);
    setFormData({
      daysPerWeek: structure.daysPerWeek,
      pattern: structure.pattern,
      isWeeklyBased: structure.isWeeklyBased,
      dayAssignments: structure.dayAssignments.length > 0
        ? structure.dayAssignments
        : generateDefaultDayAssignments(structure.daysPerWeek, structure.isWeeklyBased),
    });
    setEditModalOpen(true);
  };

  const handleView = (structure: Structure) => {
    setSelectedStructure(structure);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (structure: Structure) => {
    setStructureToDelete(structure);
    setDeleteDialogOpen(true);
  };

  const handleClone = async (structure: Structure) => {
    try {
      const response = await fetch(
        `/api/admin/training-splits/${splitId}/structures/${structure.id}/clone`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone structure');
      }

      const result = await response.json();
      
      // Optimistically add to list
      setStructures(prev => [result.data, ...prev]);

      toast({
        title: 'Success',
        description: 'Structure cloned successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to clone structure',
        variant: 'destructive',
      });
    }
  };

  const submitCreate = async () => {
    try {
      // Validate
      if (!formData.pattern.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Pattern is required',
          variant: 'destructive',
        });
        return;
      }

      if (formData.isWeeklyBased && formData.dayAssignments.some(d => !d.workoutType.trim())) {
        toast({
          title: 'Validation Error',
          description: 'All workout types must be specified for weekly-based structures',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/admin/training-splits/${splitId}/structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create structure');
      }

      const result = await response.json();
      
      // Optimistically add to list
      setStructures(prev => [result.data, ...prev]);
      
      setCreateModalOpen(false);
      resetFormData();

      toast({
        title: 'Success',
        description: 'Structure created successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create structure',
        variant: 'destructive',
      });
    }
  };

  const submitEdit = async () => {
    if (!selectedStructure) return;

    try {
      // Validate
      if (!formData.pattern.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Pattern is required',
          variant: 'destructive',
        });
        return;
      }

      if (formData.isWeeklyBased && formData.dayAssignments.some(d => !d.workoutType.trim())) {
        toast({
          title: 'Validation Error',
          description: 'All workout types must be specified for weekly-based structures',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `/api/admin/training-splits/${splitId}/structures/${selectedStructure.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update structure');
      }

      const result = await response.json();
      
      // Optimistically update in list
      setStructures(prev =>
        prev.map(s => (s.id === selectedStructure.id ? result.data : s))
      );
      
      setEditModalOpen(false);
      setSelectedStructure(null);
      resetFormData();

      toast({
        title: 'Success',
        description: 'Structure updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update structure',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!structureToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/training-splits/${splitId}/structures/${structureToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete structure');
      }

      // Optimistically remove from list
      setStructures(prev => prev.filter(s => s.id !== structureToDelete.id));
      
      setDeleteDialogOpen(false);
      setStructureToDelete(null);

      toast({
        title: 'Success',
        description: 'Structure deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete structure',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-20 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/training-splits`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Splits
          </Button>
        
        {split && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{split.name}</h1>
            <p className="text-muted-foreground">{split.description}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Training Structures</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Structure
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Days/Week</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No structures found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              structures.map(structure => (
                <TableRow key={structure.id}>
                  <TableCell className="font-medium">{structure.daysPerWeek}</TableCell>
                  <TableCell>{structure.pattern}</TableCell>
                  <TableCell>
                    <Badge variant={structure.isWeeklyBased ? 'default' : 'secondary'}>
                      {structure.isWeeklyBased ? 'Weekly' : 'Cyclic'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{structure.programCount}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(structure.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(structure)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(structure)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClone(structure)}
                        title="Clone"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(structure)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Training Structure</DialogTitle>
            <DialogDescription>
              Create a new structure for this training split
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="daysPerWeek">Days Per Week (1-7)</Label>
              <Input
                id="daysPerWeek"
                type="number"
                min={1}
                max={7}
                value={formData.daysPerWeek}
                onChange={e => handleDaysPerWeekChange(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern Description</Label>
              <Input
                id="pattern"
                placeholder='e.g., "2 on 1 off", "every other day"'
                value={formData.pattern}
                onChange={e => setFormData({ ...formData, pattern: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWeeklyBased"
                checked={formData.isWeeklyBased}
                onCheckedChange={handleIsWeeklyBasedChange}
              />
              <Label htmlFor="isWeeklyBased" className="cursor-pointer">
                Weekly-based structure (assign specific days)
              </Label>
            </div>

            {formData.isWeeklyBased && formData.dayAssignments.length > 0 && (
              <div className="space-y-2">
                <Label>Day Assignments</Label>
                <div className="space-y-3 border rounded-lg p-4">
                  {formData.dayAssignments.map((day, index) => (
                    <div key={index} className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Day {day.dayNumber}</Label>
                        <Input
                          placeholder="Day name"
                          value={day.dayOfWeek || ''}
                          onChange={e =>
                            handleDayAssignmentChange(index, 'dayOfWeek', e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Workout Type</Label>
                        <Input
                          placeholder='e.g., "Upper", "Lower", "Push", "Pull"'
                          value={day.workoutType}
                          onChange={e =>
                            handleDayAssignmentChange(index, 'workoutType', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate}>Create Structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Structure</DialogTitle>
            <DialogDescription>
              Modify the structure details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-daysPerWeek">Days Per Week (1-7)</Label>
              <Input
                id="edit-daysPerWeek"
                type="number"
                min={1}
                max={7}
                value={formData.daysPerWeek}
                onChange={e => handleDaysPerWeekChange(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-pattern">Pattern Description</Label>
              <Input
                id="edit-pattern"
                placeholder='e.g., "2 on 1 off", "every other day"'
                value={formData.pattern}
                onChange={e => setFormData({ ...formData, pattern: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isWeeklyBased"
                checked={formData.isWeeklyBased}
                onCheckedChange={handleIsWeeklyBasedChange}
              />
              <Label htmlFor="edit-isWeeklyBased" className="cursor-pointer">
                Weekly-based structure (assign specific days)
              </Label>
            </div>

            {formData.isWeeklyBased && formData.dayAssignments.length > 0 && (
              <div className="space-y-2">
                <Label>Day Assignments</Label>
                <div className="space-y-3 border rounded-lg p-4">
                  {formData.dayAssignments.map((day, index) => (
                    <div key={index} className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Day {day.dayNumber}</Label>
                        <Input
                          placeholder="Day name"
                          value={day.dayOfWeek || ''}
                          onChange={e =>
                            handleDayAssignmentChange(index, 'dayOfWeek', e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Workout Type</Label>
                        <Input
                          placeholder='e.g., "Upper", "Lower", "Push", "Pull"'
                          value={day.workoutType}
                          onChange={e =>
                            handleDayAssignmentChange(index, 'workoutType', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Structure Details</DialogTitle>
          </DialogHeader>
          {selectedStructure && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Days Per Week</Label>
                <p className="font-medium">{selectedStructure.daysPerWeek}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Pattern</Label>
                <p className="font-medium">{selectedStructure.pattern}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant={selectedStructure.isWeeklyBased ? 'default' : 'secondary'}>
                    {selectedStructure.isWeeklyBased ? 'Weekly' : 'Cyclic'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Programs Using This Structure</Label>
                <p className="font-medium">{selectedStructure.programCount}</p>
              </div>

              {selectedStructure.isWeeklyBased && selectedStructure.dayAssignments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Day Assignments</Label>
                  <div className="space-y-2 border rounded-lg p-4">
                    {selectedStructure.dayAssignments.map((day, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">
                          Day {day.dayNumber} {day.dayOfWeek && `(${day.dayOfWeek})`}
                        </span>
                        <Badge>{day.workoutType}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="font-medium">
                  {new Date(selectedStructure.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {structureToDelete && structureToDelete.programCount > 0 ? (
                <>
                  This structure is used by <strong>{structureToDelete.programCount}</strong> program(s).
                  You cannot delete it until those programs are removed or reassigned.
                </>
              ) : (
                <>
                  This will permanently delete the structure &quot;{structureToDelete?.pattern}&quot;.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {structureToDelete && structureToDelete.programCount === 0 && (
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
