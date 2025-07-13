'use client';

import { Button } from '@/components/ui/button';
import { Menu, X, MessageSquare, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: {
    id: string;
    email?: string;
  };
  onLogout?: () => void;
}

export function MobileNav({ isOpen, onToggle, user, onLogout }: MobileNavProps) {
  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onToggle}
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onToggle}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-64 bg-background border-l border-border z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="font-semibold">Menu</h2>
                  <Button variant="ghost" size="sm" onClick={onToggle}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2">
                  <Link href="/chat" onClick={onToggle}>
                    <Button variant="ghost" className="w-full justify-start">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                  </Link>
                  
                  {user && (
                    <Link href="/profile" onClick={onToggle}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/pricing" onClick={onToggle}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Pricing
                    </Button>
                  </Link>
                </nav>

                {/* User Actions */}
                {user && onLogout && (
                  <div className="p-4 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        onLogout();
                        onToggle();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
