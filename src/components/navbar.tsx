'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, MessageSquare, Settings, LogOut, LayoutDashboard, UserCircle, Crown, Dumbbell, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';
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
import { useRouter, usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslations } from 'next-intl';
import { BetaBadge } from '@/components/beta-badge';
import { CoachInboxNotification } from '@/components/coach-inbox-notification';
import { SubscriptionBadge } from '@/components/subscription-badge';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  
  // Extract locale from pathname
  const locale = pathname.match(/^\/([a-z]{2})(?=\/|$)/)?.[1] || 'en';

  // Prevent hydration mismatch by only using theme after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get logo source safely
  const getLogoSrc = () => {
    if (!mounted) {
      return "/logo.png"; // Default to light logo during SSR
    }
    return theme === 'dark' ? "/logo-dark.png" : "/logo.png";
  };

  useEffect(() => {
    const supabase = createClient(); // Define supabase client here
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      // Fetch user role from database if user exists
      if (currentUser) {
        try {
          const response = await fetch('/api/user/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role || 'user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default to user role on error
        }
      }
      
      setIsLoadingUser(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => { // Add types for event and session
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsLoadingUser(false);
        // Fetch role when user signs in
        if (session?.user && event === 'SIGNED_IN') {
          fetch('/api/user/role')
            .then(res => res.json())
            .then(data => setUserRole(data.role || 'user'))
            .catch(() => setUserRole('user'));
        } else if (event === 'SIGNED_OUT') {
          setUserRole('user');
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      
      // Reset local state immediately for immediate UI update
      setUser(null);
      setUserRole('user');
      setIsLoadingUser(false);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // If there's an error, we might want to reload the page to ensure clean state
      window.location.href = '/';
    }
  };

  const navLinks = [
    { href: `/${locale}/pricing`, label: t('pricing'), icon: Crown },
    { href: `/${locale}/programs`, label: t('programs'), icon: BookOpen },
    ...(user ? [{ href: `/${locale}/profile`, label: t('profile'), icon: UserCircle }] : []),
    ...(userRole?.split(',').map(r => r.trim()).includes('coach') ? [{ href: `/${locale}/coach-inbox`, label: 'Coach Inbox', icon: MessageSquare }] : []),
    ...(userRole === 'admin' ? [{ href: `/${locale}/admin`, label: t('dashboard'), icon: LayoutDashboard }] : []),
  ];

  const UserAvatarFallback = user ? (user.user_metadata?.full_name?.[0] || user.email?.[0])?.toUpperCase() : t('user')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="relative container flex h-16 items-center justify-center px-2 sm:px-4 lg:px-20 mx-auto">
        {/* Logo/Brand - absolutely positioned left in LTR, right in RTL */}
        <div className="absolute start-0 top-0 h-full flex items-center ps-2 sm:ps-4 lg:ps-6">
          <Link href={`/${locale}`} className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 transition-colors hover:text-primary">
            <Image 
              src={getLogoSrc()}
              alt="HypertroQ Logo" 
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                HypertroQ
              </span>
              {/* Hide beta badge on very small screens to prevent overlap with language selector */}
              <div className="hidden min-[380px]:block">
                <BetaBadge size="sm" />
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Menu - centered, hidden on mobile */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-5 lg:space-x-8">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>        {/* Right section - absolutely positioned right in LTR, left in RTL */}
        <div className="absolute end-0 top-0 h-full flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 pe-2 sm:pe-4 lg:pe-6 rtl:space-x-reverse">
          {/* Theme and Language switchers - always visible on mobile, desktop for logged-out users */}
          <div className="flex md:hidden items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          
          {isLoadingUser ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" /> // Placeholder for loading state
          ) : user ? (
              // Logged-in state: Subscription badge, language switcher, theme toggle, coach inbox (if coach), and avatar dropdown (desktop only)
              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <SubscriptionBadge />
                <LanguageSwitcher />
                <ThemeToggle />
                <CoachInboxNotification />
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
                        <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email?.split('@')[0] || t('user')}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || t('noEmail')}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/profile`} className="flex items-center w-full">
                        <User className="me-2 h-4 w-4" />
                        <span>{t('profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/admin/programs`} className="flex items-center w-full">
                            <Dumbbell className="me-2 h-4 w-4" />
                            <span>Manage Programs</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${locale}/admin/settings`} className="flex items-center w-full">
                            <Settings className="me-2 h-4 w-4" />
                            <span>{t('aiConfiguration')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center w-full cursor-pointer">
                      <LogOut className="me-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Logged-out state: Language switcher, theme toggle, and "Get started" button (desktop only)
              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <LanguageSwitcher />
                <ThemeToggle />
                <Button
                  variant="default"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/${locale}/login`;
                    }
                  }}
                >
                  {t('getStarted')}
                </Button>
              </div>
            )}
          {/* Mobile Menu Button and Sheet */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('toggleMobileMenu')}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">{t('navigationMenu')}</SheetTitle>
                <nav className="flex flex-col space-y-3 mt-8 px-2 h-full">
                  <Link
                    href={`/${locale}`}
                    className="mb-6 flex items-center space-x-3 px-2 rtl:space-x-reverse"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Image 
                      src={getLogoSrc()}
                      alt="HypertroQ Logo" 
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                    <span className="font-bold text-lg">HypertroQ</span>
                  </Link>
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                        <Link href={link.href}>
                          <link.icon className="me-2 h-4 w-4" />
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
                        {/* Subscription Badge */}
                        <div className="px-2">
                          <SubscriptionBadge />
                        </div>
                        
                        {/* User Profile Section */}
                        <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30 rtl:space-x-reverse">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-avatar.png"} alt="User Avatar" />
                            <AvatarFallback>{UserAvatarFallback}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {user.user_metadata?.full_name || user.email?.split('@')[0] || t('user')}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                              {user.email || t('noEmail')}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenuSeparator className="my-2"/>
                        
                        {/* User Menu Items */}
                        {userRole === 'admin' && (
                          <>
                            <SheetClose asChild>
                              <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                                <Link href={`/${locale}/admin/programs`}>
                                  <Dumbbell className="me-2 h-4 w-4" />
                                  Manage Programs
                                </Link>
                              </Button>
                            </SheetClose>
                            <SheetClose asChild>
                              <Button variant="outline" className="w-full justify-start h-12 px-4" asChild>
                                <Link href={`/${locale}/admin/settings`}>
                                  <Settings className="me-2 h-4 w-4" />
                                  {t('aiConfiguration')}
                                </Link>
                              </Button>
                            </SheetClose>
                          </>
                        )}
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full justify-start h-12 px-4" onClick={async () => { await handleLogout(); setIsMobileMenuOpen(false);}}>
                              <LogOut className="me-2 h-4 w-4" />
                              {t('logout')}
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                       <>
                         <SheetClose asChild>
                            <Button variant="default" className="w-full justify-center h-12 px-4" asChild>
                              <Link href={`/${locale}/login`}>
                                {t('getStarted')}
                              </Link>
                            </Button>
                          </SheetClose>
                       </>
                    )}
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
