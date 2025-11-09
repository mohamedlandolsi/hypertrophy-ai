'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SubscriptionInfo {
  isPro: boolean;
  status?: string;
  currentPeriodEnd?: string;
}

export function SubscriptionBadge() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        const response = await fetch('/api/user/subscription-tier');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Error fetching subscription info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionInfo();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!subscriptionInfo) {
    return null;
  }

  // Format the next billing date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (subscriptionInfo.isPro) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:text-white"
          >
            <Crown className="h-3.5 w-3.5 me-1.5" />
            <span className="font-semibold">PRO</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Pro Subscription</p>
                <p className="text-xs text-muted-foreground">
                  Status: {subscriptionInfo.status || 'Active'}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center text-sm">
                <Sparkles className="h-4 w-4 me-2 text-purple-600" />
                <span>Unlimited Programs</span>
              </div>
              <div className="flex items-center text-sm">
                <Sparkles className="h-4 w-4 me-2 text-purple-600" />
                <span>Unlimited AI Coaching</span>
              </div>
              <div className="flex items-center text-sm">
                <Sparkles className="h-4 w-4 me-2 text-purple-600" />
                <span>All Premium Features</span>
              </div>
            </div>

            {subscriptionInfo.currentPeriodEnd && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Next billing: {formatDate(subscriptionInfo.currentPeriodEnd)}
                </p>
              </div>
            )}

            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <Link href={`/${locale}/profile#subscription`}>
                Manage Subscription
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Free user - show upgrade button
  return (
    <Button 
      asChild 
      size="sm" 
      variant="outline"
      className="h-8 px-3 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950"
    >
      <Link href={`/${locale}/pricing`}>
        <Crown className="h-3.5 w-3.5 me-1.5" />
        <span className="font-semibold">Upgrade</span>
      </Link>
    </Button>
  );
}
