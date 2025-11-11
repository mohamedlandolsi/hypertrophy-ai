'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tags, FileText, File, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'FILE' | 'TEXT';
  status: 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
  KnowledgeItemCategory?: {
    KnowledgeCategory: {
      id: string;
      name: string;
    };
  }[];
}

interface ItemCategoryManagerProps {
  item: KnowledgeItem;
  onUpdate: (updatedItem: KnowledgeItem) => void;
}

export default function ItemCategoryManager({ item, onUpdate }: ItemCategoryManagerProps) {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Track optimistic updates for smoother UX
  const [optimisticCategories, setOptimisticCategories] = useState<KnowledgeItem['KnowledgeItemCategory']>(
    (item.KnowledgeItemCategory || []).filter((kic, index, array) => 
      array.findIndex(k => k.KnowledgeCategory.id === kic.KnowledgeCategory.id) === index
    )
  );

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      if (process.env.NODE_ENV === 'development') { console.log('🔍 Fetching categories...'); }
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Current item data:', {
          itemId: item.id,
          itemTitle: item.title,
          itemKnowledgeItemCategory: item.KnowledgeItemCategory,
          itemKnowledgeItemCategoryLength: item.KnowledgeItemCategory?.length
        });
      }
      
      const response = await fetch('/api/admin/knowledge-categories');
      if (process.env.NODE_ENV === 'development') { console.log('📡 Categories API response status:', response.status); }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') { console.log('📊 Categories data:', data); }
      if (process.env.NODE_ENV === 'development') { console.log('📊 Raw categories from API:', data.categories?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name, idLength: c.id?.length }))); }
      setCategories(data.categories || []);
      
      // Set currently selected categories
      const currentCategoryIds = item.KnowledgeItemCategory?.map(kic => {
        if (process.env.NODE_ENV === 'development') { console.log('🔍 Processing KnowledgeItemCategory:', kic); }
        return kic.KnowledgeCategory.id;
      }) || [];
      if (process.env.NODE_ENV === 'development') { console.log('🏷️ Current category IDs:', currentCategoryIds); }
      if (process.env.NODE_ENV === 'development') { console.log('🏷️ Current category IDs details:', currentCategoryIds.map(id => ({ id, length: id?.length, type: typeof id }))); }
      setSelectedCategoryIds(currentCategoryIds);
      
      // Initialize optimistic categories with deduplication
      const uniqueCategories = (item.KnowledgeItemCategory || [])
        .filter((kic, index, array) => 
          array.findIndex(k => k.KnowledgeCategory.id === kic.KnowledgeCategory.id) === index
        );
      setOptimisticCategories(uniqueCategories);
    } catch (err) {
      console.error('❌ Failed to load categories:', err);
      showToast.error('Failed to load categories');
    } finally {
      setLoading(false);
      if (process.env.NODE_ENV === 'development') { console.log('🏁 Finished fetching categories'); }
    }
  }, [item.id, item.title, item.KnowledgeItemCategory]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchCategories();
    }
  }, [isDialogOpen, fetchCategories]);

  const handleSave = async () => {
    setSaving(true);

    try {
      // Filter out any invalid IDs (empty strings, null, undefined) and deduplicate
      const validCategoryIds = [...new Set(selectedCategoryIds.filter(id => id && typeof id === 'string' && id.trim() !== ''))];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Pre-save category validation:', {
          knowledgeItemId: item.id,
          originalSelectedIds: selectedCategoryIds,
          originalCount: selectedCategoryIds.length,
          validIds: validCategoryIds,
          validCount: validCategoryIds.length,
          duplicatesRemoved: selectedCategoryIds.length - validCategoryIds.length,
          filteredOut: selectedCategoryIds.filter(id => !id || typeof id !== 'string' || id.trim() === ''),
          allAvailableCategories: categories.map(c => ({ id: c.id, name: c.name })),
          validationCheck: validCategoryIds.map(id => ({
            id,
            existsInAvailable: categories.some(c => c.id === id),
            type: typeof id,
            length: id?.length
          }))
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Saving categories:', {
          knowledgeItemId: item.id,
          originalIds: selectedCategoryIds,
          validIds: validCategoryIds,
          categoryCount: validCategoryIds.length
        });
      }

      const response = await fetch('/api/admin/knowledge-item-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeItemId: item.id,
          categoryIds: validCategoryIds
        })
      });

      if (process.env.NODE_ENV === 'development') { console.log('📡 API response status:', response.status, response.statusText); }

      let result;
      let responseText;
      try {
        responseText = await response.text();
        if (process.env.NODE_ENV === 'development') { console.log('📄 Raw response text (length:', responseText?.length || 0, '):', responseText); }
        
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        result = JSON.parse(responseText);
        if (process.env.NODE_ENV === 'development') { console.log('📄 Parsed response:', result); }
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        if (process.env.NODE_ENV === 'development') { console.log('📄 Response text preview:', responseText?.substring(0, 200) || 'N/A'); }
        throw new Error(`Invalid API response (status: ${response.status}): ${jsonError instanceof Error ? jsonError.message : 'Parse error'}`);
      }

      if (!response.ok) {
        const errorMsg = result?.error || result?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: result?.error || 'No error field',
          message: result?.message || 'No message field', 
          type: result?.type || 'No type field',
          fullResponse: result
        });
        throw new Error(errorMsg);
      }

      // Optimistically update the item with new categories
      const updatedCategories = categories.filter(cat => 
        validCategoryIds.includes(cat.id)
      ).map(cat => ({
        KnowledgeCategory: { id: cat.id, name: cat.name }
      }));

      const updatedItem: KnowledgeItem = {
        ...item,
        KnowledgeItemCategory: updatedCategories
      };

      showToast.success(result.message);
      setIsDialogOpen(false);
      
      // Pass the updated item back to parent for optimistic UI update
      onUpdate(updatedItem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update categories';
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Category toggle:', {
        categoryId, 
        categoryIdLength: categoryId?.length,
        categoryIdType: typeof categoryId,
        checked, 
        currentSelected: selectedCategoryIds,
        allCategories: categories.map(c => ({ id: c.id, name: c.name, idLength: c.id?.length }))
      });
    }
    
    if (checked) {
      setSelectedCategoryIds(prev => {
        const newIds = [...prev, categoryId];
        if (process.env.NODE_ENV === 'development') { console.log('➕ Adding category, new IDs:', newIds); }
        if (process.env.NODE_ENV === 'development') { console.log('➕ New IDs details:', newIds.map(id => ({ id, length: id?.length, type: typeof id }))); }
        return newIds;
      });
    } else {
      setSelectedCategoryIds(prev => {
        const newIds = prev.filter(id => id !== categoryId);
        if (process.env.NODE_ENV === 'development') { console.log('➖ Removing category, new IDs:', newIds); }
        return newIds;
      });
    }
    
    // Optimistically update UI for instant feedback
    const categoryInfo = categories.find(cat => cat.id === categoryId);
    if (categoryInfo) {
      if (checked) {
        // Only add if not already present to prevent duplicates
        setOptimisticCategories(prev => {
          const existing = (prev || []).find(item => item.KnowledgeCategory.id === categoryId);
          if (existing) return prev; // Already exists, don't add duplicate
          
          return [
            ...(prev || []),
            { KnowledgeCategory: { id: categoryInfo.id, name: categoryInfo.name } }
          ];
        });
      } else {
        setOptimisticCategories(prev => 
          (prev || []).filter(item => item.KnowledgeCategory.id !== categoryId)
        );
      }
    }
  };

  const displayCategories = (optimisticCategories || [])
    .map(kic => kic.KnowledgeCategory)
    // Remove duplicates by ID
    .filter((category, index, array) => 
      array.findIndex(c => c.id === category.id) === index
    );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={saving}>
          <Tags className="h-4 w-4 mr-2" />
          Categories ({displayCategories.length})
          {saving && <span className="ml-1 text-xs opacity-60">Saving...</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.type === 'FILE' ? <File className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            Manage Categories for &quot;{item.title}&quot;
          </DialogTitle>
          <DialogDescription>
            Assign this knowledge item to categories to improve AI behavior and organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Categories with smooth transitions */}
          {displayCategories.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Current Categories:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {displayCategories.map((category, index) => (
                  <Badge 
                    key={`category-${category.id}-${index}`} 
                    variant="secondary"
                    className="transition-all duration-200 ease-in-out"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <Label className="text-sm font-medium">Available Categories:</Label>
            {loading ? (
              <div className="text-center py-4">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No categories available. Create categories first.
              </div>
            ) : (
              <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <Card 
                      key={category.id} 
                      className={`p-3 transition-all duration-200 ease-in-out cursor-pointer hover:bg-accent/50 ${
                        isSelected ? 'ring-2 ring-primary bg-accent/30' : ''
                      }`}
                      onClick={() => handleCategoryToggle(category.id, !isSelected)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={category.id}
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleCategoryToggle(category.id, checked as boolean)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={category.id} 
                            className="font-medium cursor-pointer"
                          >
                            {category.name}
                          </Label>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving Categories...' : 'Save Categories'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
