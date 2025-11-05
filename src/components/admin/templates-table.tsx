'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Edit, Trash2, Eye, Target, BarChart3, FileText } from 'lucide-react';
import { toggleTemplateStatus, deleteProgramTemplate } from '@/app/api/admin/templates/actions';
import { showToast } from '@/lib/toast';

interface ProgramTemplateWithDetails {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  workoutStructureType: 'REPEATING' | 'AB' | 'ABC';
  estimatedDurationWeeks: number;
  targetAudience: string;
  popularity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  split: {
    id: string;
    name: string;
  } | null;
  structure: {
    id: string;
    pattern: string;
    daysPerWeek: number;
  } | null;
  _count: {
    trainingPrograms: number; // Number of times template has been used
    templateWorkouts: number;
  };
}

interface TemplatesTableProps {
  templates: ProgramTemplateWithDetails[];
}

// Helper function to get difficulty badge variant and label
function getDifficultyInfo(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') {
  switch (level) {
    case 'BEGINNER':
      return { variant: 'default' as const, label: 'Beginner' };
    case 'INTERMEDIATE':
      return { variant: 'secondary' as const, label: 'Intermediate' };
    case 'ADVANCED':
      return { variant: 'destructive' as const, label: 'Advanced' };
  }
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ProgramTemplateWithDetails | null>(null);

  const handleStatusToggle = async (template: ProgramTemplateWithDetails) => {
    startTransition(async () => {
      try {
        const result = await toggleTemplateStatus(template.id, template.isActive);
        
        if (result.success) {
          showToast.success('Success', result.message);
        } else {
          showToast.error('Error', result.error || 'Failed to update template status');
        }
      } catch {
        showToast.error('Error', 'An unexpected error occurred');
      }
    });
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteProgramTemplate(templateToDelete.id);
        
        if (result.success) {
          showToast.success('Success', result.message);
          setDeleteDialogOpen(false);
          setTemplateToDelete(null);
        } else {
          showToast.error('Error', result.error || 'Failed to delete template');
        }
      } catch {
        showToast.error('Error', 'An unexpected error occurred');
      }
    });
  };

  const openDeleteDialog = (template: ProgramTemplateWithDetails) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No program templates</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first program template.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/templates/new">
            Create New Template
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Split Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Workouts</TableHead>
              <TableHead>Times Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => {
              const difficultyInfo = getDifficultyInfo(template.difficultyLevel);
              
              return (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {template.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {template.targetAudience}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{template.split?.name || 'N/A'}</div>
                      <Badge variant="outline" className="text-xs">
                        {template.workoutStructureType}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={difficultyInfo.variant}>
                      {difficultyInfo.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {template.estimatedDurationWeeks} {template.estimatedDurationWeeks === 1 ? 'week' : 'weeks'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{template._count.templateWorkouts}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{template._count.trainingPrograms}</span>
                      <span className="text-xs text-muted-foreground">users</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => handleStatusToggle(template)}
                        disabled={isPending}
                        aria-label={`Toggle ${template.name} status`}
                      />
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/templates/${template.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/templates/${template.id}/analytics`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/templates/${template.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteDialog(template)}
                          disabled={template._count.trainingPrograms > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Template
                        </DropdownMenuItem>
                        
                        {template._count.trainingPrograms > 0 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            Cannot delete: {template._count.trainingPrograms} user{template._count.trainingPrograms === 1 ? '' : 's'} using this
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the program template
              &quot;{templateToDelete?.name || 'Unknown'}&quot; and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Template workouts ({templateToDelete?._count.templateWorkouts || 0})</li>
                <li>Exercise configurations</li>
                <li>Template structure data</li>
              </ul>
              {templateToDelete && templateToDelete._count.trainingPrograms > 0 && (
                <div className="mt-2 text-destructive font-medium">
                  ⚠️ This template is currently being used by {templateToDelete._count.trainingPrograms} user{templateToDelete._count.trainingPrograms === 1 ? '' : 's'}. 
                  Consider deactivating instead of deleting.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending || (templateToDelete?._count.trainingPrograms ?? 0) > 0}
            >
              {isPending ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
