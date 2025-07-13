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
import { 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency,
  getDefaultCurrency,
  getDefaultCurrencySync,
  SUPPORTED_CURRENCIES 
} from '@/lib/currency';
import { CurrencySelector } from '@/components/currency-selector';

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
  defaultInterval?: 'month' | 'year';
  currency?: CurrencyCode;
  pricingData?: PricingData | null;
}

export function UpgradeButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  showDialog = true,
  defaultInterval = 'month',
  currency,
  pricingData: externalPricingData = null
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>(defaultInterval);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency || getDefaultCurrencySync());
  const [pricingData, setPricingData] = useState<PricingData | null>(externalPricingData);

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

  useEffect(() => {
    // Initialize currency if not provided
    const initializeCurrency = async () => {
      if (!currency) {
        try {
          const detectedCurrency = await getDefaultCurrency();
          setSelectedCurrency(detectedCurrency);
        } catch (error) {
          console.error('Failed to detect currency:', error);
          // Keep the sync default
        }
      }
    };

    initializeCurrency();
  }, [currency]);

  useEffect(() => {
    if (externalPricingData) {
      setPricingData(externalPricingData);
    } else {
      // Load pricing data for the currency
      const loadPricingData = async () => {
        try {
          const pricing = await getPricingForCurrency(selectedCurrency);
          setPricingData(pricing);
        } catch (error) {
          console.error('Failed to load pricing data:', error);
        }
      };
      loadPricingData();
    }
  }, [selectedCurrency, externalPricingData]);
  
  const handleUpgrade = async (interval: 'month' | 'year' = 'month') => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Track upgrade button click
    trackEvent('upgrade_button_click', 'subscription', `pro_plan_${interval}`);

    setIsLoading(true);
    
    try {
      // Create checkout URL via API
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          interval,
          currency: selectedCurrency 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout URL');
      }

      const { checkoutUrl } = await response.json();
      
      console.log('Checkout URL:', checkoutUrl); // Debug log
      
      // Track checkout initiation
      trackEvent('begin_checkout', 'subscription', `pro_plan_${interval}`, interval === 'year' ? 99.99 : 9.99);
      
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

  const handleCurrencyChange = (currency: CurrencyCode, pricing: PricingData) => {
    setSelectedCurrency(currency);
    setPricingData(pricing);
  };

  if (!showDialog) {
    return (        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={() => handleUpgrade(selectedInterval)}
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
          {/* Currency Selector */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
            />
          </div>
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

          {/* Billing Interval Selection */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedInterval('month')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedInterval === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('year')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                selectedInterval === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Yearly
              {pricingData && (
                <Badge className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 py-0.5">
                  Save {pricingData.savingsPercentage}%
                </Badge>
              )}
            </button>
          </div>

          {/* Pricing */}
          <div className="text-center">
            {pricingData ? (
              <>
                <div className="text-3xl font-bold">
                  {selectedInterval === 'year' ? pricingData.formattedYearly : pricingData.formattedMonthly}
                </div>
                <div className="text-sm text-muted-foreground">
                  per {selectedInterval === 'year' ? 'year' : 'month'}
                </div>
                {selectedInterval === 'year' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Equivalent to {SUPPORTED_CURRENCIES[selectedCurrency].symbol}{(pricingData.yearly / 12).toFixed(2)}/month
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">Cancel anytime</div>
              </>
            ) : (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => handleUpgrade(selectedInterval)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Processing...' : `Start Pro Subscription ${selectedInterval === 'year' ? '(Yearly)' : '(Monthly)'}`}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            Secure payment powered by Lemon Squeezy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
