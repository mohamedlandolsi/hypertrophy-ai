'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSidebar, AdminMobileSidebar } from '@/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { PanelLeftClose, PanelLeftOpen, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { signOut } from '../app/actions';
import LanguageSwitcher from '@/components/language-switcher';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoadingUser(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setIsLoadingUser(false);
        }
      });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const UserAvatarFallback = user ? (user.user_metadata?.full_name?.[0] || user.email?.[0])?.toUpperCase() : 'U';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex transition-all duration-300",
        sidebarCollapsed ? "w-0" : "w-64"
      )}>
        <AdminSidebar className={cn(
          "transition-all duration-300",
          sidebarCollapsed && "ml-[-256px]"
        )} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <AdminMobileSidebar />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2 transition-colors hover:text-primary">
              <Image 
                src="/logo.png" 
                alt="HypertroQ Logo" 
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <div className="hidden md:block">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HypertroQ
                </span>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoadingUser ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-avatar.png"} alt="User Avatar" />
                      <AvatarFallback>{UserAvatarFallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || 'No email'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>AI Configuration</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-default">
                      <span>Language</span>
                      <LanguageSwitcher />
                    </div>
                  </div>
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted cursor-default">
                      <span>Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => await signOut()} className="flex items-center w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/login';
                    }
                  }}
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
