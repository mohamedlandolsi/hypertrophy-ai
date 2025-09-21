'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Simple relative time formatting
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return messageDate.toLocaleDateString();
};

interface UnreadMessage {
  id: string;
  content: string;
  createdAt: string;
  senderName: string;
  coachChatId: string;
}

interface InboxData {
  unreadCount: number;
  recentMessages: UnreadMessage[];
}

export function CoachInboxNotification() {
  const [inboxData, setInboxData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  // Extract locale from pathname
  const locale = pathname.match(/^\/([a-z]{2})(?=\/|$)/)?.[1] || 'en';

  const fetchInboxData = async () => {
    try {
      const response = await fetch('/api/coach-inbox');
      if (response.ok) {
        const data = await response.json();
        setInboxData(data);
      } else {
        // User is not a coach or not authenticated
        setInboxData(null);
      }
    } catch (error) {
      console.error('Error fetching inbox data:', error);
      setInboxData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
    
    // Refresh inbox data every 30 seconds
    const interval = setInterval(fetchInboxData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't show if user is not a coach or if loading
  if (loading || !inboxData) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <MessageCircle className="h-5 w-5" />
          {inboxData.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {inboxData.unreadCount > 9 ? '9+' : inboxData.unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Coach Inbox</span>
          {inboxData.unreadCount > 0 && (
            <Badge variant="secondary">{inboxData.unreadCount} unread</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {inboxData.recentMessages.length === 0 ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            No new messages
          </DropdownMenuItem>
        ) : (
          <>
            {inboxData.recentMessages.map((message) => (
              <DropdownMenuItem key={message.id} className="flex flex-col items-start p-3">
                <Link 
                  href={`/${locale}/coach-inbox?chat=${message.coachChatId}`}
                  className="w-full"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <Link href={`/${locale}/coach-inbox`} className="w-full text-center">
                View All Messages
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
