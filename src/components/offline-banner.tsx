'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setShowReconnected(false);
    } else if (wasOffline && isOnline) {
      setShowBanner(false);
      setShowReconnected(true);
      // Hide reconnected banner after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm animate-in slide-in-from-top duration-200">
        <div className="flex items-center justify-center gap-2">
          <Wifi className="w-4 h-4" />
          Connection restored
        </div>
      </div>
    );
  }

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        You are offline. Some features may not be available.
      </div>
    </div>
  );
}
