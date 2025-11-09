'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Layout, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ProgramDashboardCTAProps {
  isPro: boolean;
  programCount: number;
}

export function ProgramDashboardCTA({ programCount }: ProgramDashboardCTAProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        <div className="flex-1 text-center sm:text-start">
          <h3 className="text-lg font-semibold mb-2">
            {programCount === 0 ? 'Get Started with Your First Program' : 'Build Your Next Program'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {programCount === 0 
              ? 'Create a custom program or start from a template' 
              : 'Create another custom program to reach your goals'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Create New Program - Primary CTA */}
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
          >
            <Link href={`/${locale}/programs/create`}>
              <Plus className="h-5 w-5" />
              Create New Program
            </Link>
          </Button>

          {/* Browse Templates */}
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="gap-2"
          >
            <Link href={`/${locale}/programs#templates`}>
              <Layout className="h-5 w-5" />
              Browse Templates
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionsProps {
  isPro: boolean;
  hasPrograms: boolean;
}

export function QuickActions({ hasPrograms }: QuickActionsProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create New Program */}
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <Link href={`/${locale}/programs/create`}>
          <CardContent className="flex flex-col items-center justify-center text-center py-8 gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Create New Program</h4>
              <p className="text-sm text-muted-foreground">Build from scratch</p>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Browse Templates */}
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <Link href={`/${locale}/programs#templates`}>
          <CardContent className="flex flex-col items-center justify-center text-center py-8 gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Browse Templates</h4>
              <p className="text-sm text-muted-foreground">Start with a template</p>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* View My Programs */}
      {hasPrograms && (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <Link href={`/${locale}/programs#my-programs`}>
            <CardContent className="flex flex-col items-center justify-center text-center py-8 gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">My Programs</h4>
                <p className="text-sm text-muted-foreground">View your programs</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      )}
    </div>
  );
}
