'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();

  // Don't render Navbar on chat page or admin pages (includes locale prefixes)
  if (pathname.includes('/chat') || pathname.includes('/admin')) {
    return null;
  }

  return <Navbar />;
};

export default ConditionalNavbar;
