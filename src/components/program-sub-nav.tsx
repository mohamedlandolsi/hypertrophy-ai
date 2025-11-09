'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutGrid, 
  Dumbbell, 
  Calendar, 
  Settings as SettingsIcon,
  ChevronLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgramSubNavProps {
  programId: string;
  programName?: string;
}

export function ProgramSubNav({ programId, programName }: ProgramSubNavProps) {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  const navItems = [
    {
      href: `/${locale}/programs/${programId}/split-structure`,
      label: 'Split Structure',
      icon: LayoutGrid,
      match: '/split-structure'
    },
    {
      href: `/${locale}/programs/${programId}/workouts`,
      label: 'Workouts',
      icon: Dumbbell,
      match: '/workouts'
    },
    {
      href: `/${locale}/programs/${programId}/guide`,
      label: 'Week Preview',
      icon: Calendar,
      match: '/guide'
    },
    {
      href: `/${locale}/programs/${programId}/build`,
      label: 'Settings',
      icon: SettingsIcon,
      match: '/build'
    },
  ];

  const isActive = (match: string) => pathname.includes(match);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Back to Programs */}
          <Button 
            asChild 
            variant="ghost" 
            size="sm"
            className="shrink-0"
          >
            <Link href={`/${locale}/programs`}>
              <ChevronLeft className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">Programs</span>
            </Link>
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Program Name */}
          {programName && (
            <>
              <h2 className="font-semibold text-sm sm:text-base truncate">
                {programName}
              </h2>
              <Separator orientation="vertical" className="h-6 hidden md:block" />
            </>
          )}

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.match);
              
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "shrink-0 gap-2",
                    active && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
