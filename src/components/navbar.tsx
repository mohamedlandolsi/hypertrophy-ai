'use client';

import Link from 'next/link';
import { Menu, Zap, User, MessageSquare, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
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

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient(); // Define supabase client here
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoadingUser(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => { // Add types for event and session
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsLoadingUser(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat", icon: MessageSquare },
  ];

  const UserAvatarFallback = user ? (user.user_metadata?.full_name?.[0] || user.email?.[0])?.toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="relative container flex h-16 items-center justify-center px-4 lg:px-20 mx-auto">
        {/* Logo/Brand - absolutely positioned left */}
        <div className="absolute left-0 top-0 h-full flex items-center pl-2 lg:pl-6" style={{ minWidth: 170 }}>
          <Link href="/" className="flex items-center space-x-2 lg:space-x-3 transition-colors hover:text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hypertrophy AI
            </span>
          </Link>
        </div>

        {/* Desktop Menu - centered, hidden on mobile */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-5 lg:space-x-8">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>        {/* Right section - absolutely positioned right */}
        <div className="absolute right-0 top-0 h-full flex items-center space-x-2 lg:space-x-3 pr-2 lg:pr-6">
          {isLoadingUser ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" /> // Placeholder for loading state
          ) : user ? (
              // Logged-in state: Avatar Dropdown (desktop only)
              <div className="hidden md:block">
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
                      <Link href="/parameters" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Parameter</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* ThemeToggle within Dropdown */}
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
              </div>
            ) : (
              // Logged-out state: "Get started" button and ThemeToggle
              <>
                <ThemeToggle />
                <Button
                  className="hidden md:inline-flex"
                  variant="default"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/login';
                    }
                  }}
                >
                  Get started
                </Button>
              </>
            )}
          {/* Mobile Menu Button and Sheet */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle mobile menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col space-y-3 mt-8 px-2 h-full">
                  <Link
                    href="/"
                    className="mb-6 flex items-center space-x-3 px-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-lg">Hypertrophy AI</span>
                  </Link>
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                        <Link href={link.href}>
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      </Button>
                    </SheetClose>
                  ))}
                    <div className="mt-auto flex flex-col space-y-3"> {/* Group user actions and theme toggle at bottom */}
                    {isLoadingUser ? (
                      <div className="h-12 w-full rounded-md bg-muted animate-pulse" /> // Placeholder for loading state
                    ) : user ? (
                      <>
                        {/* User Profile Section */}
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-avatar.png"} alt="User Avatar" />
                            <AvatarFallback>{UserAvatarFallback}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenuSeparator className="my-2"/>
                        
                        {/* User Menu Items */}
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                            <Link href="/profile">
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                            <Link href="/parameters">
                              <Settings className="mr-2 h-4 w-4" />
                              Parameter
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                            <Link href="/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start h-12 px-4" onClick={async () => { await signOut(); setIsMobileMenuOpen(false);}}>
                              <LogOut className="mr-2 h-4 w-4" />
                              Logout
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                       <SheetClose asChild>
                          <Button variant="default" className="w-full justify-center h-12 px-4" asChild>
                            <Link href="/login">
                              Get started
                            </Link>
                          </Button>
                        </SheetClose>
                    )}                    <div className="pt-4 border-t border-border mb-4">
                      <ThemeToggle />
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
