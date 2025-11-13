'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Exercise {
  id: string;
  name: string;
  exerciseType: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
  description?: string;
  instructions?: string;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  isRecommended: boolean;
  imageUrl?: string;
  imageType?: string;
  volumeContributions: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface ExerciseFormData {
  name: string;
  exerciseType: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL';
  description: string;
  instructions: string;
  equipment: string[];
  category: 'APPROVED' | 'PENDING' | 'DEPRECATED';
  isActive: boolean;
  isRecommended: boolean;
  imageUrl?: string;
  imageType?: string;
  volumeContributions: Record<string, number>;
  regionalBias: Record<string, string>; // Stores which region/specific muscle is biased for muscles at 1.0
  primaryMuscle: string;
  secondaryMuscles: string[];
  isCompound: boolean;
  canBeUnilateral: boolean;
  volumeMetrics: Record<string, number>;
}

const EXERCISE_TYPES = [
  { value: 'COMPOUND', label: 'Compound', description: 'Multi-joint exercises that work multiple muscle groups' },
  { value: 'ISOLATION', label: 'Isolation', description: 'Single-joint exercises targeting specific muscles' },
  { value: 'UNILATERAL', label: 'Unilateral', description: 'One-sided exercises for balance and symmetry' },
];

// Volume tracking muscle groups with display names (simplified to match schema)
const VOLUME_MUSCLES = [
  // Chest
  { value: 'CHEST', label: 'Chest' },
  
  // Back
  { value: 'LATS', label: 'Lats' },
  { value: 'TRAPEZIUS_RHOMBOIDS', label: 'Trapezius & Rhomboids' },
  
  // Shoulders
  { value: 'FRONT_DELTS', label: 'Front Delts' },
  { value: 'SIDE_DELTS', label: 'Side Delts' },
  { value: 'REAR_DELTS', label: 'Rear Delts' },
  
  // Arms
  { value: 'ELBOW_FLEXORS', label: 'Elbow Flexors (Biceps)' },
  { value: 'TRICEPS', label: 'Triceps' },
  
  // Forearms
  { value: 'WRIST_FLEXORS', label: 'Wrist Flexors' },
  { value: 'WRIST_EXTENSORS', label: 'Wrist Extensors' },
  
  // Core
  { value: 'ABS', label: 'Abs' },
  
  // Lower Body
  { value: 'GLUTES', label: 'Glutes' },
  { value: 'QUADRICEPS', label: 'Quadriceps' },
  { value: 'HAMSTRINGS', label: 'Hamstrings' },
  { value: 'ADDUCTORS', label: 'Adductors' },
  { value: 'CALVES', label: 'Calves' },
];

// Regional bias options for muscles (only shown when volume = 1.0)
const MUSCLE_REGIONAL_BIAS: Record<string, Array<{ value: string; label: string }>> = {
  CHEST: [
    { value: 'UPPER_CHEST', label: 'Upper Chest' },
    { value: 'MIDDLE_CHEST', label: 'Middle Chest' },
    { value: 'LOWER_CHEST', label: 'Lower Chest' },
  ],
  LATS: [
    { value: 'UPPER_LATS', label: 'Upper Lats' },
    { value: 'MID_LOWER_LATS', label: 'Mid to Lower Lats' },
  ],
  ELBOW_FLEXORS: [
    { value: 'BICEPS', label: 'Biceps' },
    { value: 'BRACHIALIS', label: 'Brachialis' },
    { value: 'BRACHIORADIALIS', label: 'Brachioradialis' },
  ],
  TRICEPS: [
    { value: 'TRICEPS_LONG_HEAD', label: 'Long Head' },
    { value: 'TRICEPS_MEDIAL_LATERAL', label: 'Medial & Lateral Heads' },
  ],
  GLUTES: [
    { value: 'GLUTEUS_MAXIMUS', label: 'Gluteus Maximus' },
    { value: 'GLUTEUS_MEDIUS', label: 'Gluteus Medius' },
    { value: 'GLUTEUS_MINIMUS', label: 'Gluteus Minimus' },
  ],
  QUADRICEPS: [
    { value: 'RECTUS_FEMORIS', label: 'Rectus Femoris' },
    { value: 'VASTUS_HEADS', label: 'Vastus Heads (Lateralis, Medialis, Intermedius)' },
  ],
  ADDUCTORS: [
    { value: 'ADDUCTOR_LONGUS', label: 'Adductor Longus' },
    { value: 'ADDUCTOR_BREVIS', label: 'Adductor Brevis' },
    { value: 'ADDUCTOR_MAGNUS', label: 'Adductor Magnus' },
    { value: 'GRACILIS', label: 'Gracilis' },
    { value: 'PECTINEUS', label: 'Pectineus' },
  ],
};

const CATEGORIES = ['APPROVED', 'PENDING', 'DEPRECATED'];

const initialFormData: ExerciseFormData = {
  name: '',
  exerciseType: 'COMPOUND',
  description: '',
  instructions: '',
  equipment: [],
  category: 'APPROVED',
  isActive: true,
  isRecommended: false,
  volumeContributions: {},
  regionalBias: {},
  primaryMuscle: '',
  secondaryMuscles: [],
  isCompound: true,
  canBeUnilateral: false,
  volumeMetrics: {}
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
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showInactiveFilter, setShowInactiveFilter] = useState(false);
  const [muscleSearchTerm, setMuscleSearchTerm] = useState('');

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
        ...(exerciseTypeFilter && exerciseTypeFilter !== 'all' && { exerciseType: exerciseTypeFilter }),
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
  }, [currentPage, searchTerm, exerciseTypeFilter, categoryFilter, showInactiveFilter]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload image first if one is selected
      let imageData = null;
      if (imageFile) {
        try {
          imageData = await handleImageUpload();
        } catch (imageError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Image upload error:', imageError);
          }
          throw new Error('Failed to upload image: ' + (imageError instanceof Error ? imageError.message : 'Unknown error'));
        }
      }

      // Merge image data into the payload to avoid race condition with state updates
      const payload = {
        ...formData,
        ...(imageData && { imageUrl: imageData.imageUrl, imageType: imageData.imageType })
      };

      const url = editingId ? `/api/admin/exercises/${editingId}` : '/api/admin/exercises';
      const method = editingId ? 'PUT' : 'POST';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting exercise:', { url, method, payload });
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('API response:', { status: response.status, result });
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to save exercise');
      }

      setSuccess(result.message || 'Exercise saved successfully');
      
      // Optimistic UI update: Update local state without full page reload
      if (editingId && result.exercise) {
        // Update existing exercise in local state with server response
        setExercises(prevExercises => 
          prevExercises.map(ex => 
            ex.id === editingId ? result.exercise : ex
          )
        );
      } else if (result.exercise) {
        // For new exercises, add to local state with server response
        setExercises(prevExercises => [result.exercise, ...prevExercises]);
        setTotalExercises(prev => prev + 1);
      }
      
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      setEquipmentInput('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save exercise';
      if (process.env.NODE_ENV === 'development') {
        console.error('Exercise save error:', err);
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleImageUpload = async (): Promise<{ imageUrl: string; imageType: string } | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', imageFile);

      const response = await fetch('/api/admin/exercises/upload-image', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload image');
      }

      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: result.imageUrl,
        imageType: result.imageType
      }));

      return { imageUrl: result.imageUrl, imageType: result.imageType };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: undefined,
      imageType: undefined
    }));
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      exerciseType: exercise.exerciseType,
      description: exercise.description || '',
      instructions: exercise.instructions || '',
      equipment: exercise.equipment,
      category: exercise.category,
      isActive: exercise.isActive,
      isRecommended: exercise.isRecommended,
      imageUrl: exercise.imageUrl,
      imageType: exercise.imageType,
      volumeContributions: exercise.volumeContributions || {},
      regionalBias: (exercise as Exercise & { regionalBias?: Record<string, string> }).regionalBias || {},
      primaryMuscle: (exercise as Exercise & { primaryMuscle?: string }).primaryMuscle || '',
      secondaryMuscles: (exercise as Exercise & { secondaryMuscles?: string[] }).secondaryMuscles || [],
      isCompound: (exercise as Exercise & { isCompound?: boolean }).isCompound ?? (exercise.exerciseType === 'COMPOUND'),
      canBeUnilateral: (exercise as Exercise & { canBeUnilateral?: boolean }).canBeUnilateral || false,
      volumeMetrics: (exercise as Exercise & { volumeMetrics?: Record<string, number> }).volumeMetrics || {}
    });
    setEquipmentInput(exercise.equipment.join(', '));
    setImagePreview(exercise.imageUrl || null);
    setImageFile(null);
    setEditingId(exercise.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      // Optimistic UI update: Remove from local state immediately
      const exerciseToDelete = exercises.find(ex => ex.id === id);
      setExercises(prevExercises => prevExercises.filter(ex => ex.id !== id));
      setTotalExercises(prev => prev - 1);
      
      const response = await fetch(`/api/admin/exercises/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        // Rollback optimistic update on error
        if (exerciseToDelete) {
          setExercises(prevExercises => [...prevExercises, exerciseToDelete]);
          setTotalExercises(prev => prev + 1);
        }
        throw new Error(result.error || 'Failed to delete exercise');
      }

      setSuccess(result.message);
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
    setMuscleSearchTerm('');
    setIsDialogOpen(false);
  };

  // Volume tracking helper functions
  const updateVolumeContribution = (muscle: string, volume: number) => {
    const newContributions = { ...formData.volumeContributions };
    const newBias = { ...formData.regionalBias };
    
    if (volume === 0) {
      delete newContributions[muscle];
      delete newBias[muscle]; // Remove bias if volume is 0
    } else {
      newContributions[muscle] = volume;
      // Keep regional bias when volume changes (only clear when volume is 0)
    }
    
    setFormData({ ...formData, volumeContributions: newContributions, regionalBias: newBias });
  };

  const getVolumeContribution = (muscle: string) => {
    return formData.volumeContributions[muscle] || 0;
  };

  const updateRegionalBias = (muscle: string, region: string) => {
    const newBias = { ...formData.regionalBias };
    if (region === '' || region === 'NONE') {
      delete newBias[muscle];
    } else {
      newBias[muscle] = region;
    }
    setFormData({ ...formData, regionalBias: newBias });
  };

  const getRegionalBias = (muscle: string) => {
    return formData.regionalBias[muscle] || 'NONE';
  };

  const calculateTotalVolume = () => {
    return Object.values(formData.volumeContributions).reduce((sum, val) => sum + val, 0);
  };

  const getVolumeColor = (totalVolume: number) => {
    if (totalVolume < 0.5) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (totalVolume <= 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  const getExerciseTypeColor = (exerciseType: string) => {
    const colors = {
      'COMPOUND': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'ISOLATION': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'UNILATERAL': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[exerciseType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
                    <Label htmlFor="exerciseType">Exercise Type *</Label>
                    <Select
                      value={formData.exerciseType}
                      onValueChange={(value: 'COMPOUND' | 'ISOLATION' | 'UNILATERAL') => setFormData({ ...formData, exerciseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Exercise Categorization Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCompound"
                      checked={formData.isCompound}
                      onCheckedChange={(checked: boolean) => 
                        setFormData({ ...formData, isCompound: checked })
                      }
                    />
                    <Label htmlFor="isCompound" className="cursor-pointer">
                      Compound Exercise
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canBeUnilateral"
                      checked={formData.canBeUnilateral}
                      onCheckedChange={(checked: boolean) => 
                        setFormData({ ...formData, canBeUnilateral: checked })
                      }
                    />
                    <Label htmlFor="canBeUnilateral" className="cursor-pointer">
                      Can Be Performed Unilaterally
                    </Label>
                  </div>
                </div>

                {/* Primary and Secondary Muscles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryMuscle">Primary Muscle</Label>
                    <Select
                      value={formData.primaryMuscle}
                      onValueChange={(value: string) => 
                        setFormData({ ...formData, primaryMuscle: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary muscle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {VOLUME_MUSCLES.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Secondary Muscles (Multi-select)</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {VOLUME_MUSCLES.map(({ value, label }) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`secondary-${value}`}
                              checked={formData.secondaryMuscles.includes(value)}
                              onCheckedChange={(checked: boolean) => {
                                const newSecondaryMuscles = checked
                                  ? [...formData.secondaryMuscles, value]
                                  : formData.secondaryMuscles.filter(m => m !== value);
                                setFormData({ ...formData, secondaryMuscles: newSecondaryMuscles });
                              }}
                            />
                            <Label htmlFor={`secondary-${value}`} className="cursor-pointer text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecommended"
                      checked={formData.isRecommended}
                      onCheckedChange={(checked: boolean) => 
                        setFormData({ ...formData, isRecommended: checked })
                      }
                    />
                    <Label htmlFor="isRecommended" className="cursor-pointer">
                      Recommended Exercise (appears first in program guide)
                    </Label>
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

                {/* Exercise Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="exercise-image">Exercise Image/GIF (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload an image or GIF to demonstrate the exercise (Max 10MB, JPG/PNG/GIF/WebP)
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      id="exercise-image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-2 border rounded-lg p-2">
                      <Image 
                        src={imagePreview} 
                        alt="Exercise preview" 
                        width={192}
                        height={192}
                        className="max-h-48 mx-auto rounded"
                      />
                    </div>
                  )}
                  
                  {uploadingImage && (
                    <p className="text-sm text-muted-foreground">Uploading image...</p>
                  )}
                </div>

                {/* Volume Contributions Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Volume Contributions</Label>
                    <p className="text-sm text-muted-foreground">
                      Set how much each muscle is targeted: 1.0 (primary), 0.75 (strong secondary), 0.5 (standard secondary), 0.25 (light secondary), 0 (not targeted)
                    </p>
                  </div>
                  
                  {/* Total Volume Display with Warning */}
                  {Object.keys(formData.volumeContributions).length > 0 && (
                    <div className="p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Volume:</span>
                        <Badge className={getVolumeColor(calculateTotalVolume())}>
                          {calculateTotalVolume().toFixed(2)}
                        </Badge>
                      </div>
                      {calculateTotalVolume() > 2 && (
                        <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                          ⚠️ Warning: Total volume exceeds 2.0. This exercise may be targeting too many muscles significantly. Consider adjusting values.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Muscle Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search muscles..."
                      value={muscleSearchTerm}
                      onChange={(e) => setMuscleSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {VOLUME_MUSCLES.filter(({ label }) => 
                      label.toLowerCase().includes(muscleSearchTerm.toLowerCase())
                    ).map(({ value, label }) => (
                      <div key={value} className="space-y-2">
                        <div className="flex items-center justify-between space-x-2">
                          <Label htmlFor={`volume-${value}`} className="text-sm font-normal flex-grow">
                            {label}
                          </Label>
                          <Select
                            value={getVolumeContribution(value).toString()}
                            onValueChange={(val) => updateVolumeContribution(value, parseFloat(val))}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="0.25">0.25</SelectItem>
                              <SelectItem value="0.5">0.5</SelectItem>
                              <SelectItem value="0.75">0.75</SelectItem>
                              <SelectItem value="1">1.0</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Regional Bias - Shown when volume is non-zero (0.25, 0.5, 0.75, 1.0) */}
                        {getVolumeContribution(value) > 0 && MUSCLE_REGIONAL_BIAS[value] && (
                          <div className="ml-4 mt-1">
                            <Select
                              value={getRegionalBias(value)}
                              onValueChange={(region) => updateRegionalBias(value, region)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Select region/bias (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE">No specific bias</SelectItem>
                                {MUSCLE_REGIONAL_BIAS[value].map(({ value: regionValue, label: regionLabel }) => (
                                  <SelectItem key={regionValue} value={regionValue}>
                                    {regionLabel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
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
                        const benchPressPreset = {
                          CHEST: 1.0,
                          FRONT_DELTS: 0.5,
                          TRICEPS: 0.5
                        };
                        setFormData({ ...formData, volumeContributions: benchPressPreset });
                      }}
                    >
                      Bench Press Preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const squatPreset = {
                          QUADRICEPS: 1.0,
                          GLUTES: 0.75,
                          HAMSTRINGS: 0.5
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
                        const rowPreset = {
                          LATS: 1.0,
                          TRAPEZIUS_RHOMBOIDS: 0.75,
                          REAR_DELTS: 0.5,
                          ELBOW_FLEXORS: 0.5
                        };
                        setFormData({ ...formData, volumeContributions: rowPreset });
                      }}
                    >
                      Row Preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const deadliftPreset = {
                          LATS: 1.0,
                          TRAPEZIUS_RHOMBOIDS: 0.75,
                          GLUTES: 0.75,
                          HAMSTRINGS: 0.75
                        };
                        setFormData({ ...formData, volumeContributions: deadliftPreset });
                      }}
                    >
                      Deadlift Preset
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
              <Label htmlFor="exerciseTypeFilter">Exercise Type</Label>
              <Select value={exerciseTypeFilter} onValueChange={setExerciseTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All exercise types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All exercise types</SelectItem>
                  {EXERCISE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
            No exercises found. {searchTerm || (exerciseTypeFilter !== 'all') || (categoryFilter !== 'all') ? 'Try adjusting your filters.' : 'Create your first exercise to get started.'}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead className="w-[150px]">Equipment</TableHead>
                    <TableHead className="w-[180px]">Volume</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{exercise.name}</div>
                          {exercise.isRecommended && (
                            <Badge variant="default" className="bg-green-600 mt-1">
                              ⭐ Recommended
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exercise.imageUrl ? (
                          <Image 
                            src={exercise.imageUrl} 
                            alt={exercise.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getExerciseTypeColor(exercise.exerciseType)}>
                          {exercise.exerciseType.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(exercise.category)}>
                          {exercise.category.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
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
                        <div>
                          {exercise.volumeContributions && Object.keys(exercise.volumeContributions).length > 0 ? (
                            <div className="space-y-1">
                              {/* Total Volume Badge */}
                              <Badge className={getVolumeColor(
                                Object.values(exercise.volumeContributions).reduce((sum: number, val: number) => sum + val, 0)
                              )}>
                                Total: {Object.values(exercise.volumeContributions).reduce((sum: number, val: number) => sum + val, 0).toFixed(2)}
                              </Badge>
                              {/* Show muscle count */}
                              <div className="text-xs text-muted-foreground">
                                {Object.keys(exercise.volumeContributions).length} muscle{Object.keys(exercise.volumeContributions).length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No volumes</span>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
