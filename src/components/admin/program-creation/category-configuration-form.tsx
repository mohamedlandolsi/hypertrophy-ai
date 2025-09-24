'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, Target, Maximize } from 'lucide-react';

const categoryTypes = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    icon: Zap,
    description: 'Essential exercises only, minimal time commitment',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    sessions: '2-3 per week',
    duration: '45-60 min'
  },
  {
    id: 'essentialist',
    name: 'Essentialist',
    icon: Target,
    description: 'Balanced approach with key compound movements',
    color: 'bg-green-50 border-green-200 text-green-800',
    sessions: '3-4 per week',
    duration: '60-75 min'
  },
  {
    id: 'maximalist',
    name: 'Maximalist',
    icon: Maximize,
    description: 'Comprehensive training with maximum volume',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    sessions: '4-6 per week',
    duration: '75-90 min'
  }
];

export function CategoryConfigurationForm() {
  const { watch, setValue } = useFormContext();
  const categories = watch('categories') || [];

  const updateCategory = (categoryId: string, field: string, value: string | number | Record<string, string>) => {
    const updatedCategories = categories.map((cat: Record<string, unknown>) => 
      cat.type === categoryId ? { ...cat, [field]: value } : cat
    );
    
    // If category doesn't exist, create it
    if (!categories.find((cat: Record<string, unknown>) => cat.type === categoryId)) {
      updatedCategories.push({
        type: categoryId,
        [field]: value,
        weeklyVolume: categoryId === 'minimalist' ? 8 : categoryId === 'essentialist' ? 12 : 16,
        exerciseCount: categoryId === 'minimalist' ? 4 : categoryId === 'essentialist' ? 6 : 8,
        name: { en: '', ar: '', fr: '' },
        description: { en: '', ar: '', fr: '' }
      });
    }
    
    setValue('categories', updatedCategories);
  };

  const getCategoryData = (categoryId: string) => {
    return categories.find((cat: Record<string, unknown>) => cat.type === categoryId) || {
      weeklyVolume: categoryId === 'minimalist' ? 8 : categoryId === 'essentialist' ? 12 : 16,
      exerciseCount: categoryId === 'minimalist' ? 4 : categoryId === 'essentialist' ? 6 : 8,
      name: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' }
    };
  };

  return (
    <div className="space-y-6">
      {categoryTypes.map((categoryType) => {
        const Icon = categoryType.icon;
        const categoryData = getCategoryData(categoryType.id);
        
        return (
          <Card key={categoryType.id} className={`border-2 ${categoryType.color.includes('blue') ? 'border-blue-200' : categoryType.color.includes('green') ? 'border-green-200' : 'border-purple-200'}`}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${categoryType.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{categoryType.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {categoryType.sessions}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categoryType.duration}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{categoryType.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Volume Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weekly Volume (sets)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={categoryData.weeklyVolume}
                    onChange={(e) => updateCategory(categoryType.id, 'weeklyVolume', parseInt(e.target.value) || 0)}
                    placeholder="Enter weekly volume"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exercise Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    value={categoryData.exerciseCount}
                    onChange={(e) => updateCategory(categoryType.id, 'exerciseCount', parseInt(e.target.value) || 0)}
                    placeholder="Number of exercises"
                  />
                </div>
              </div>

              <Separator />

              {/* Name & Description */}
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category Name (English)</Label>
                    <Input
                      value={categoryData.name?.en || ''}
                      onChange={(e) => {
                        const currentName = categoryData.name as Record<string, string> || { en: '', ar: '', fr: '' };
                        updateCategory(categoryType.id, 'name', { ...currentName, en: e.target.value });
                      }}
                      placeholder={`${categoryType.name} program name`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name (Arabic)</Label>
                      <Input
                        value={categoryData.name?.ar || ''}
                        onChange={(e) => {
                          const currentName = categoryData.name as Record<string, string> || { en: '', ar: '', fr: '' };
                          updateCategory(categoryType.id, 'name', { ...currentName, ar: e.target.value });
                        }}
                        placeholder="Arabic name"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (French)</Label>
                      <Input
                        value={categoryData.name?.fr || ''}
                        onChange={(e) => {
                          const currentName = categoryData.name as Record<string, string> || { en: '', ar: '', fr: '' };
                          updateCategory(categoryType.id, 'name', { ...currentName, fr: e.target.value });
                        }}
                        placeholder="French name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (English)</Label>
                    <Textarea
                      value={categoryData.description?.en || ''}
                      onChange={(e) => {
                        const currentDesc = categoryData.description as Record<string, string> || { en: '', ar: '', fr: '' };
                        updateCategory(categoryType.id, 'description', { ...currentDesc, en: e.target.value });
                      }}
                      placeholder={`Describe the ${categoryType.name.toLowerCase()} approach...`}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (Arabic)</Label>
                      <Textarea
                        value={categoryData.description?.ar || ''}
                        onChange={(e) => {
                          const currentDesc = categoryData.description as Record<string, string> || { en: '', ar: '', fr: '' };
                          updateCategory(categoryType.id, 'description', { ...currentDesc, ar: e.target.value });
                        }}
                        placeholder="Arabic description"
                        className="text-right"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (French)</Label>
                      <Textarea
                        value={categoryData.description?.fr || ''}
                        onChange={(e) => {
                          const currentDesc = categoryData.description as Record<string, string> || { en: '', ar: '', fr: '' };
                          updateCategory(categoryType.id, 'description', { ...currentDesc, fr: e.target.value });
                        }}
                        placeholder="French description"
                        rows={2}
                      />
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Category Summary</CardTitle>
          <CardDescription>Overview of all configured program variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {categoryTypes.map((categoryType) => {
              const categoryData = getCategoryData(categoryType.id);
              return (
                <div key={categoryType.id} className="space-y-2">
                  <Badge className={categoryType.color}>{categoryType.name}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {categoryData.weeklyVolume} sets/week
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {categoryData.exerciseCount} exercises
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}