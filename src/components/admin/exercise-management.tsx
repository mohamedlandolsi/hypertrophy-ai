'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  instructions?: string;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  volumeContributions?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface ExerciseFormData {
  name: string;
  muscleGroup: string;
  description: string;
  instructions: string;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  volumeContributions: Record<string, number>;
}

const MUSCLE_GROUPS = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
  'ABS', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'ADDUCTORS', 'CALVES'
];

// Volume tracking muscle groups with display names
const VOLUME_MUSCLES = [
  // Chest
  { value: 'UPPER_CHEST', label: 'Upper Chest' },
  { value: 'MIDDLE_CHEST', label: 'Middle Chest' },
  { value: 'LOWER_CHEST', label: 'Lower Chest' },
  
  // Arms - Biceps and Related
  { value: 'BICEPS', label: 'Biceps' },
  { value: 'BRACHIALIS', label: 'Brachialis' },
  { value: 'BRACHIORADIALIS', label: 'Brachioradialis' },
  
  // Arms - Triceps
  { value: 'TRICEPS_LONG_HEAD', label: 'Triceps Long Head' },
  { value: 'TRICEPS_MEDIAL_HEAD', label: 'Triceps Medial Head' },
  { value: 'TRICEPS_LATERAL_HEAD', label: 'Triceps Lateral Head' },
  
  // Shoulders
  { value: 'FRONT_DELTS', label: 'Front Delts' },
  { value: 'SIDE_DELTS', label: 'Side Delts' },
  { value: 'REAR_DELTS', label: 'Rear Delts' },
  
  // Forearms
  { value: 'WRIST_FLEXORS', label: 'Wrist Flexors' },
  { value: 'WRIST_EXTENSORS', label: 'Wrist Extensors' },
  
  // Back - Lats
  { value: 'UPPER_LATS', label: 'Upper Lats' },
  { value: 'MIDDLE_LATS', label: 'Middle Lats' },
  { value: 'LOWER_LATS', label: 'Lower Lats' },
  
  // Back - Other
  { value: 'TRAPEZIUS', label: 'Trapezius' },
  { value: 'RHOMBOIDS', label: 'Rhomboids' },
  { value: 'ERECTOR_SPINAE', label: 'Erector Spinae' },
  
  // Glutes
  { value: 'GLUTEUS_MAXIMUS', label: 'Gluteus Maximus' },
  { value: 'GLUTEUS_MEDIUS', label: 'Gluteus Medius' },
  { value: 'GLUTEUS_MINIMUS', label: 'Gluteus Minimus' },
  
  // Adductors
  { value: 'ADDUCTOR_MAGNUS', label: 'Adductor Magnus' },
  { value: 'OTHER_ADDUCTORS', label: 'Other Adductors' },
  
  // Quadriceps
  { value: 'RECTUS_FEMORIS', label: 'Rectus Femoris' },
  { value: 'VASTUS_LATERALIS', label: 'Vastus Lateralis' },
  { value: 'VASTUS_MEDIALIS', label: 'Vastus Medialis' },
  { value: 'VASTUS_INTERMEDIUS', label: 'Vastus Intermedius' },
  
  // Hamstrings
  { value: 'HAMSTRINGS', label: 'Hamstrings' },
  
  // Calves and Lower Leg
  { value: 'CALVES', label: 'Calves' },
  { value: 'TIBIALIS_ANTERIOR', label: 'Tibialis Anterior' },
  
  // Core
  { value: 'ABS', label: 'Abs' },
  { value: 'OBLIQUES', label: 'Obliques' },
  
  // Additional muscles
  { value: 'HIP_FLEXORS', label: 'Hip Flexors' },
  { value: 'SERRATUS_ANTERIOR', label: 'Serratus Anterior' },
  { value: 'PECTORALIS_MINOR', label: 'Pectoralis Minor' },
  { value: 'TERES_MAJOR', label: 'Teres Major' },
  { value: 'TERES_MINOR', label: 'Teres Minor' },
  { value: 'INFRASPINATUS', label: 'Infraspinatus' },
  { value: 'SUPRASPINATUS', label: 'Supraspinatus' },
  { value: 'SUBSCAPULARIS', label: 'Subscapularis' },
];

const CATEGORIES = ['APPROVED', 'PENDING', 'DEPRECATED'];
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const initialFormData: ExerciseFormData = {
  name: '',
  muscleGroup: '',
  description: '',
  instructions: '',
  equipment: [],
  category: 'APPROVED',
  isActive: true,
  difficulty: 'INTERMEDIATE',
  volumeContributions: {}
};

export default function ExerciseManagement() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ExerciseFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [equipmentInput, setEquipmentInput] = useState('');
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showInactiveFilter, setShowInactiveFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExercises, setTotalExercises] = useState(0);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...(muscleGroupFilter && muscleGroupFilter !== 'all' && { muscleGroup: muscleGroupFilter }),
        ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter }),
        ...(showInactiveFilter ? {} : { isActive: 'true' })
      });

      const response = await fetch(`/api/admin/exercises?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch exercises');
      }
      
      const data = await response.json();
      setExercises(data.exercises);
      setTotalPages(data.pagination.totalPages);
      setTotalExercises(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, muscleGroupFilter, categoryFilter, showInactiveFilter]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editingId ? `/api/admin/exercises/${editingId}` : '/api/admin/exercises';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save exercise');
      }

      setSuccess(result.message);
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      setEquipmentInput('');
      fetchExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      description: exercise.description || '',
      instructions: exercise.instructions || '',
      equipment: exercise.equipment,
      category: exercise.category,
      isActive: exercise.isActive,
      difficulty: exercise.difficulty,
      volumeContributions: exercise.volumeContributions || {}
    });
    setEquipmentInput(exercise.equipment.join(', '));
    setEditingId(exercise.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/admin/exercises/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete exercise');
      }

      setSuccess(result.message);
      fetchExercises();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    }
  };

  const handleAddEquipment = () => {
    if (equipmentInput.trim()) {
      const equipmentArray = equipmentInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      setFormData({ ...formData, equipment: equipmentArray });
    }
  };

  const removeEquipment = (index: number) => {
    const newEquipment = formData.equipment.filter((_, i) => i !== index);
    setFormData({ ...formData, equipment: newEquipment });
    setEquipmentInput(newEquipment.join(', '));
  };

  const resetDialog = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setEquipmentInput('');
    setIsDialogOpen(false);
  };

  // Volume tracking helper functions
  const updateVolumeContribution = (muscle: string, volume: number) => {
    const newContributions = { ...formData.volumeContributions };
    if (volume === 0) {
      delete newContributions[muscle];
    } else {
      newContributions[muscle] = volume;
    }
    setFormData({ ...formData, volumeContributions: newContributions });
  };

  const getVolumeContribution = (muscle: string) => {
    return formData.volumeContributions[muscle] || 0;
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors = {
      CHEST: 'bg-red-100 text-red-800',
      BACK: 'bg-blue-100 text-blue-800',
      SHOULDERS: 'bg-yellow-100 text-yellow-800',
      BICEPS: 'bg-green-100 text-green-800',
      TRICEPS: 'bg-purple-100 text-purple-800',
      FOREARMS: 'bg-gray-100 text-gray-800',
      ABS: 'bg-orange-100 text-orange-800',
      GLUTES: 'bg-pink-100 text-pink-800',
      QUADRICEPS: 'bg-indigo-100 text-indigo-800',
      HAMSTRINGS: 'bg-cyan-100 text-cyan-800',
      ADDUCTORS: 'bg-lime-100 text-lime-800',
      CALVES: 'bg-amber-100 text-amber-800'
    };
    return colors[muscleGroup as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DEPRECATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Exercise Management</CardTitle>
            <CardDescription>
              Manage exercises that the AI will use for hypertrophy recommendations. 
              Total: {totalExercises} exercises
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Update the exercise details below.' : 'Create a new exercise for AI recommendations.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Exercise Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Barbell Bench Press"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="muscleGroup">Muscle Group *</Label>
                    <Select
                      value={formData.muscleGroup}
                      onValueChange={(value) => setFormData({ ...formData, muscleGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select muscle group" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'APPROVED' | 'PENDING' | 'DEPRECATED') => 
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') => 
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the exercise"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Step-by-step exercise instructions"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">Equipment</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="equipment"
                        value={equipmentInput}
                        onChange={(e) => setEquipmentInput(e.target.value)}
                        placeholder="Enter equipment separated by commas"
                        onBlur={handleAddEquipment}
                      />
                      <Button type="button" onClick={handleAddEquipment} variant="outline">
                        Add
                      </Button>
                    </div>
                    {formData.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.equipment.map((item, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeEquipment(index)}>
                            {item} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Volume Contributions Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Volume Contributions</Label>
                    <p className="text-sm text-muted-foreground">
                      Set muscle volume contributions: 1.0 for direct, 0.5 for indirect, 0 for none
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {VOLUME_MUSCLES.map(({ value, label }) => (
                      <div key={value} className="flex items-center justify-between space-x-2">
                        <Label htmlFor={`volume-${value}`} className="text-sm font-normal flex-grow">
                          {label}
                        </Label>
                        <Select
                          value={getVolumeContribution(value).toString()}
                          onValueChange={(val) => updateVolumeContribution(value, parseFloat(val))}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="0.5">0.5</SelectItem>
                            <SelectItem value="1">1.0</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick preset buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const chestPreset = {
                          MIDDLE_CHEST: 1.0,
                          FRONT_DELTS: 0.5,
                          TRICEPS_MEDIAL_HEAD: 0.5,
                          TRICEPS_LATERAL_HEAD: 0.5
                        };
                        setFormData({ ...formData, volumeContributions: chestPreset });
                      }}
                    >
                      Chest Press Preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const latPreset = {
                          UPPER_LATS: 0.5,
                          MIDDLE_LATS: 1.0,
                          LOWER_LATS: 0.5,
                          RHOMBOIDS: 0.5,
                          TRAPEZIUS: 0.5,
                          REAR_DELTS: 0.5,
                          BICEPS: 0.5
                        };
                        setFormData({ ...formData, volumeContributions: latPreset });
                      }}
                    >
                      Lat Pulldown Preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const squatPreset = {
                          RECTUS_FEMORIS: 1.0,
                          VASTUS_LATERALIS: 1.0,
                          VASTUS_MEDIALIS: 1.0,
                          VASTUS_INTERMEDIUS: 1.0,
                          GLUTEUS_MAXIMUS: 1.0,
                          HAMSTRINGS: 0.5,
                          ABS: 0.5
                        };
                        setFormData({ ...formData, volumeContributions: squatPreset });
                      }}
                    >
                      Squat Preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, volumeContributions: {} });
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (AI can recommend this exercise)</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update Exercise' : 'Create Exercise'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/15 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 dark:bg-green-900/20 dark:border-green-800/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscleGroupFilter">Muscle Group</Label>
              <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All muscle groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All muscle groups</SelectItem>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryFilter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="showInactive"
                checked={showInactiveFilter}
                onCheckedChange={setShowInactiveFilter}
              />
              <Label htmlFor="showInactive">Show inactive</Label>
            </div>
          </div>
        </div>

        {/* Exercise Table */}
        {loading ? (
          <div className="text-center py-8">Loading exercises...</div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No exercises found. {searchTerm || (muscleGroupFilter !== 'all') || (categoryFilter !== 'all') ? 'Try adjusting your filters.' : 'Create your first exercise to get started.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Muscle Group</TableHead>
                    <TableHead className="min-w-[100px]">Category</TableHead>
                    <TableHead className="min-w-[100px]">Difficulty</TableHead>
                    <TableHead className="min-w-[150px]">Equipment</TableHead>
                    <TableHead className="min-w-[180px]">Volume Contributions</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px]">
                          <div className="font-semibold truncate">{exercise.name}</div>
                          {exercise.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {exercise.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMuscleGroupColor(exercise.muscleGroup)}>
                          {exercise.muscleGroup.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(exercise.category)}>
                          {exercise.category.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exercise.difficulty.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {exercise.equipment.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {exercise.equipment.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{exercise.equipment.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px]">
                          {exercise.volumeContributions && Object.keys(exercise.volumeContributions).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(exercise.volumeContributions).slice(0, 3).map(([muscle, volume]) => (
                                <Badge key={muscle} variant="outline" className="text-xs">
                                  {VOLUME_MUSCLES.find(m => m.value === muscle)?.label || muscle}: {volume}
                                </Badge>
                              ))}
                              {Object.keys(exercise.volumeContributions).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{Object.keys(exercise.volumeContributions).length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No volumes set</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exercise.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(exercise)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deprecate Exercise</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark &quot;{exercise.name}&quot; as deprecated and inactive. 
                                  The AI will no longer recommend this exercise. This action can be undone by editing the exercise.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(exercise.id)}
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                >
                                  Deprecate Exercise
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalExercises)} of {totalExercises} exercises
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
