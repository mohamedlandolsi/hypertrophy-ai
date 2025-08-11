'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Settings, 
  Database, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronLeft,
  Users,
  BarChart3,
  FileText,
  MessageSquare
} from 'lucide-react';

interface AdminSidebarProps {
  className?: string;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    title: 'AI Configuration',
    href: '/admin/settings',
    icon: Settings,
    description: 'AI model and system settings'
  },
  {
    title: 'Knowledge Base',
    href: '/admin/knowledge',
    icon: Database,
    description: 'Manage AI knowledge content'
  },
  {
    title: 'AI Testing',
    href: '/admin/ai-testing',
    icon: MessageSquare,
    description: 'Test AI responses and prompts'
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage user accounts and roles'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Usage statistics and insights'
  },
  {
    title: 'Logs & Monitoring',
    href: '/admin/logs',
    icon: FileText,
    description: 'System logs and monitoring'
  }
];

function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Image 
            src="/logo.png" 
            alt="HypertroQ Logo" 
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div>
            <h2 className="text-lg font-semibold">HypertroQ Admin</h2>
            <p className="text-xs text-muted-foreground">System Management</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-6">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <div className="flex-1">
                <div>{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-6 space-y-4">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Main App</span>
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  return (
    <div className={cn("flex h-full w-64 flex-col border-r border-border bg-card", className)}>
      <AdminSidebarContent />
    </div>
  );
}

export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
        <AdminSidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
