'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MaintenanceCheckProps {
  children: React.ReactNode;
  locale?: string;
}

export default function MaintenanceCheck({ children, locale = 'en' }: MaintenanceCheckProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        const data = await response.json();
        
        if (data.success) {
          // If maintenance mode is active and user cannot access, redirect to maintenance page
          if (data.maintenanceMode && !data.canAccess) {
            router.push(`/${locale}/maintenance`);
            return;
          }
        } else {
          console.error('Failed to check maintenance status:', data.error);
          // On error, allow access (fail-safe)
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
        // On error, allow access (fail-safe)
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, [locale, router]);

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If maintenance mode is active and user cannot access, this component won't render
  // because we redirect to maintenance page above
  
  // If we reach here, user can access the content
  return <>{children}</>;
}
