'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/components/google-analytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Declare global LemonSqueezy for TypeScript
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

interface UpgradeButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showDialog?: boolean;
}

export function UpgradeButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  showDialog = true 
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);
  
  const handleUpgrade = async () => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Track upgrade button click
    trackEvent('upgrade_button_click', 'subscription', 'pro_plan_click');

    setIsLoading(true);
    
    try {
      // Get environment variables for Lemon Squeezy
      const storeSubdomain = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_SUBDOMAIN || 'hypertroq';
      const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID || '9c872ed8-6ef8-47b2-a2dd-00a832697ebb';
      
      console.log('Lemon Squeezy config:', { storeSubdomain, variantId }); // Debug log

      // Create checkout URL with correct Lemon Squeezy format
      const checkoutUrl = `https://${storeSubdomain}.lemonsqueezy.com/buy/${variantId}?embed=1&checkout[custom][user_id]=${userId}`;
      
      console.log('Checkout URL:', checkoutUrl); // Debug log
      console.log('Store Subdomain:', storeSubdomain, 'Variant ID:', variantId); // Debug log
      
      // Track checkout initiation
      trackEvent('begin_checkout', 'subscription', 'pro_plan', 9.99);
      
      // Open Lemon Squeezy checkout overlay if available, otherwise redirect
      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        // Fallback to opening in new tab
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showDialog) {
    return (        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crown className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Loading...' : 'Upgrade to Pro'}
        </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crown className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Loading...' : 'Upgrade to Pro'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Upgrade to HypertroQ Pro
          </DialogTitle>
          <DialogDescription>
            Unlock unlimited AI coaching and advanced features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Plan vs Pro Plan */}
          <div className="grid grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Free</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  15 messages/day
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  No conversation memory
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  No progress tracking
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  No advanced features
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Pro</h3>
                <Badge className="bg-blue-600">
                  <Crown className="mr-1 h-3 w-3" />
                  Upgrade
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Unlimited messages
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Full conversation memory
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Progress tracking & analysis
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Priority support
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center">
            <div className="text-3xl font-bold">$9.99</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <div className="text-xs text-muted-foreground mt-1">Cancel anytime</div>
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Processing...' : 'Start Pro Subscription'}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            Secure payment powered by Lemon Squeezy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
