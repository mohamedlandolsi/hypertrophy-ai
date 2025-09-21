import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ProgramsTable } from '@/components/admin/programs-table';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

// Types
interface TrainingProgramWithDetails {
  id: string;
  name: {
    en: string;
    ar: string;
    fr: string;
  };
  description: {
    en: string;
    ar: string;
    fr: string;
  };
  price: number;
  lemonSqueezyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // New fields from enhanced schema (optional for backward compatibility)
  programType?: string;
  difficulty?: string;
  estimatedDuration?: number;
  sessionCount?: number;
  hasInteractiveBuilder?: boolean;
  allowsCustomization?: boolean;
  _count: {
    userPurchases: number;
    userPrograms: number;
    workoutTemplates: number;
  };
  programGuide: {
    id: string;
  } | null;
}

// Server Component for data fetching
async function ProgramsTableData() {
  // Check admin authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/unauthorized');
  }

  // Fetch training programs with related data
  const programs = await prisma.trainingProgram.findMany({
    include: {
      programGuide: {
        select: { id: true }
      },
      _count: {
        select: {
          userPurchases: true,
          userPrograms: true,
          workoutTemplates: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <ProgramsTable programs={programs as TrainingProgramWithDetails[]} />;
}

// Main page component
export default function AdminProgramsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Programs</h1>
            <p className="text-muted-foreground">
              Manage your fitness training programs and workout templates
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Program
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Programs Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Programs</CardTitle>
            <CardDescription>
              View and manage all training programs in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <ProgramsTableData />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Stats cards component (Server Component)
async function StatsCards() {
  const stats = await prisma.trainingProgram.aggregate({
    _count: {
      id: true,
    },
    where: {
      isActive: true,
    }
  });

  const totalPrograms = await prisma.trainingProgram.count();
  const totalPurchases = await prisma.userPurchase.count();
  const activePrograms = stats._count.id;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPrograms}</div>
          <p className="text-xs text-muted-foreground">
            All training programs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePrograms}</div>
          <p className="text-xs text-muted-foreground">
            Currently available for purchase
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPurchases}</div>
          <p className="text-xs text-muted-foreground">
            Programs sold to customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeletons
function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Export types for use in other components
export type { TrainingProgramWithDetails };