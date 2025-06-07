'use client'; // Add use client for useState and event handlers

import Link from 'next/link';
import { Menu, Zap, User, MessageSquare, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'; // Enhanced icons
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet'; // For mobile menu
import { useState } from 'react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/login", label: "Login", icon: LogIn },
    { href: "/signup", label: "Sign Up", icon: UserPlus },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center px-6">
        {/* Logo/Brand */}
        <Link href="/" className="mr-10 flex items-center space-x-3 transition-colors hover:text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hypertrophy AI
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden flex-1 items-center space-x-6 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Button and Sheet */}
        <div className="md:hidden flex-1 flex justify-end">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle mobile menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="flex flex-col space-y-3 mt-8 px-2">
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
