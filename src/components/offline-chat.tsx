'use client';

import { MessageSquare, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface OfflineChatProps {
  pendingMessages?: string[];
  onRetry?: () => void;
}

export function OfflineChat({ pendingMessages = [], onRetry }: OfflineChatProps) {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">You&apos;re Offline</h3>
        <p className="text-muted-foreground max-w-md">
          Check your internet connection. Your messages will be sent when connection is restored.
        </p>
      </div>

      {pendingMessages.length > 0 && (
        <div className="w-full max-w-md">
          <h4 className="text-sm font-medium mb-2">Pending Messages ({pendingMessages.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pendingMessages.map((message, index) => (
              <div
                key={index}
                className="p-2 bg-muted rounded text-sm text-left opacity-75"
              >
                {message.length > 50 ? `${message.substring(0, 50)}...` : message}
              </div>
            ))}
          </div>
        </div>
      )}

      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}

      <div className="text-xs text-muted-foreground">
        <MessageSquare className="w-4 h-4 inline mr-1" />
        Your chat history is saved locally
      </div>
    </div>
  );
}
