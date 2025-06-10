'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();

  if (pathname === '/chat') {
    return null; // Don't render Navbar on /chat page
  }

  return <Navbar />;
};

export default ConditionalNavbar;
