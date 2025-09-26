'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Prisma } from '@prisma/client';
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
import { MoreHorizontal, Edit, Trash2, Eye, Users, FileText } from 'lucide-react';
import { toggleProgramStatus, deleteTrainingProgram } from '@/app/api/admin/programs/actions';
import { showToast } from '@/lib/toast';

interface TrainingProgramWithDetails {
  id: string;
  name: Prisma.JsonValue; // JSON field for multilingual names
  description: Prisma.JsonValue; // JSON field for multilingual descriptions
  price: number;
  lemonSqueezyId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  structureType: string;
  sessionCount: number;
  trainingDays: number;
  restDays: number;
  weeklySchedule?: Prisma.JsonValue | null;
  hasInteractiveBuilder: boolean;
  allowsCustomization: boolean;
  _count: {
    userPurchases: number;
    userPrograms: number;
    workoutTemplates: number;
  };
  programGuide: {
    id: string;
  } | null;
}

interface ProgramsTableProps {
  programs: TrainingProgramWithDetails[];
}

export function ProgramsTable({ programs }: ProgramsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<TrainingProgramWithDetails | null>(null);

  const handleStatusToggle = async (program: TrainingProgramWithDetails) => {
    startTransition(async () => {
      try {
        const result = await toggleProgramStatus(program.id, program.isActive);
        
        if (result.success) {
          showToast.success('Success', result.message);
        } else {
          showToast.error('Error', result.error || 'Failed to update program status');
        }
      } catch {
        showToast.error('Error', 'An unexpected error occurred');
      }
    });
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteTrainingProgram(programToDelete.id);
        
        if (result.success) {
          showToast.success('Success', result.message);
          setDeleteDialogOpen(false);
          setProgramToDelete(null);
        } else {
          showToast.error('Error', result.error || 'Failed to delete program');
        }
      } catch {
        showToast.error('Error', 'An unexpected error occurred');
      }
    });
  };

  const openDeleteDialog = (program: TrainingProgramWithDetails) => {
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No training programs</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first training program.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/programs/new">
            Create New Program
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
              <TableHead>Program Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Purchases</TableHead>
              <TableHead>Workouts</TableHead>
              <TableHead>Guide</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{(program.name as Record<string, string>)?.en || 'Untitled'}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {(program.description as Record<string, string>)?.en || 'No description'}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-mono text-sm space-y-1">
                    <div className="text-green-600">${(program.price / 100 * 0.32).toFixed(2)} USD</div>
                    <div className="text-xs text-muted-foreground">{(program.price / 100).toFixed(2)} TND</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={program.isActive}
                      onCheckedChange={() => handleStatusToggle(program)}
                      disabled={isPending}
                      aria-label={`Toggle ${(program.name as Record<string, string>)?.en || 'program'} status`}
                    />
                    <Badge variant={program.isActive ? 'default' : 'secondary'}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{program._count.userPurchases}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{program._count.workoutTemplates}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={program.programGuide ? 'default' : 'destructive'}>
                    {program.programGuide ? 'Complete' : 'Missing'}
                  </Badge>
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
                        <Link href={`/admin/programs/${program.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/programs/${program.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Program
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(program)}
                        disabled={program._count.userPurchases > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Program
                      </DropdownMenuItem>
                      
                      {program._count.userPurchases > 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          Cannot delete: has purchases
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the training program
              &quot;{(programToDelete?.name as Record<string, string>)?.en || 'Unknown'}&quot; and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Program guide content</li>
                <li>Workout templates</li>
                <li>User program configurations</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgram}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete Program'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}