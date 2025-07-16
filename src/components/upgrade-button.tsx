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
      /**
       * Initializes a LemonSqueezy checkout overlay
       * @param options - Checkout configuration options
       */
      Setup: (options: {
        eventHandler?: (event: { event: string; data?: { total?: number; orderId?: string; [key: string]: unknown } }) => void;
      }) => void;
      /**
       * Opens a checkout URL in the LemonSqueezy overlay
       * @param url - The checkout URL to open
       */
      Url: {
        Open: (url: string) => void;
      };
      /**
       * Refreshes the checkout session
       */
      Refresh: () => void;
    };
    createLemonSqueezy?: () => void;
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
  console.log('UpgradeButton rendered with:', { defaultInterval, showDialog });
  
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

    // Initialize LemonSqueezy when component mounts
    const initializeLemonSqueezy = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            console.log('LemonSqueezy event:', event);
            if (event.event === 'Checkout.Success') {
              // Track successful checkout
              trackEvent('purchase', 'subscription', 'pro_plan', event.data?.total);
              // Redirect to success page
              window.location.href = '/dashboard?upgraded=true';
            }
          }
        });
      }
    };

    // Try to initialize immediately or wait for script to load
    if (window.LemonSqueezy) {
      initializeLemonSqueezy();
    } else {
      // Wait for the script to load
      const checkLemonSqueezy = setInterval(() => {
        if (window.LemonSqueezy) {
          initializeLemonSqueezy();
          clearInterval(checkLemonSqueezy);
        }
      }, 100);
      
      // Clear interval after 10 seconds to prevent memory leaks
      setTimeout(() => clearInterval(checkLemonSqueezy), 10000);
    }
  }, []);

  // Sync internal selectedInterval with defaultInterval prop changes
  useEffect(() => {
    console.log('UpgradeButton: defaultInterval changed to:', defaultInterval);
    setSelectedInterval(defaultInterval);
    console.log('UpgradeButton: selectedInterval updated to:', defaultInterval);
  }, [defaultInterval]);

  useEffect(() => {
    // Initialize currency if not provided
    const initializeCurrency = async () => {
      if (!currency) {
        try {
          const detectedCurrency = await getDefaultCurrency();
          setSelectedCurrency(detectedCurrency);
        } catch {
          // Silently fall back to sync default
          setSelectedCurrency(getDefaultCurrencySync());
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
        } catch {
          // Silently use fallback pricing
          setPricingData({
            currency: selectedCurrency,
            monthly: 29,
            yearly: 278,
            savings: 6,
            savingsPercentage: 20,
            formattedMonthly: '29 TND',
            formattedYearly: '278 TND'
          });
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

    const isProduction = process.env.NODE_ENV === 'production';
    const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
    
    console.log(`[${environment}] handleUpgrade called with interval:`, interval);
    console.log(`[${environment}] selectedInterval state:`, selectedInterval);
    console.log(`[${environment}] defaultInterval prop:`, defaultInterval);
    console.log(`[${environment}] Final interval being used:`, interval);
    console.log(`[${environment}] showDialog:`, showDialog);
    console.log(`[${environment}] Currency:`, selectedCurrency);

    // Track upgrade button click
    trackEvent('upgrade_button_click', 'subscription', `pro_plan_${interval}`);

    setIsLoading(true);
    
    try {
      // Create checkout URL via API
      const requestBody = { 
        interval,
        currency: selectedCurrency 
      };
      console.log(`[${environment}] Sending request body:`, requestBody);
      
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${environment}] Checkout API error:`, errorText);
        throw new Error('Failed to create checkout URL');
      }

      const responseData = await response.json();
      console.log(`[${environment}] Checkout API response:`, responseData);
      
      const { checkoutUrl } = responseData;
      
      console.log(`[${environment}] Checkout URL:`, checkoutUrl);
      
      // Track checkout initiation
      trackEvent('begin_checkout', 'subscription', `pro_plan_${interval}`, interval === 'year' ? 99.99 : 9.99);
      
      // In development mode, show warning about checkout
      if (!isProduction) {
        const proceed = confirm(
          `Development Mode: You are about to be redirected to the checkout page.\n\n` +
          `URL: ${checkoutUrl}\n\n` +
          `Click OK to proceed or Cancel to abort.`
        );
        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }
      
      // Open Lemon Squeezy checkout overlay if available, otherwise redirect
      if (window.LemonSqueezy?.Url?.Open) {
        console.log(`[${environment}] Opening LemonSqueezy overlay with URL:`, checkoutUrl);
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        console.log(`[${environment}] LemonSqueezy overlay not available, redirecting to:`, checkoutUrl);
        // Fallback to direct redirect (same tab to avoid popup blockers)
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error(`[${environment}] Error initiating checkout:`, error);
      
      // Show more specific error messages
      let errorMessage = 'Something went wrong with the checkout process. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication error. Please sign in and try again.';
        } else if (error.message.includes('checkout')) {
          errorMessage = 'Checkout service temporarily unavailable. Please try again in a few minutes.';
        }
      }
      
      alert(errorMessage);
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
          onClick={() => {
            console.log('Button clicked - Debug info:');
            console.log('  defaultInterval prop:', defaultInterval);
            console.log('  selectedInterval state:', selectedInterval);
            console.log('  About to call handleUpgrade with:', selectedInterval);
            handleUpgrade(selectedInterval);
          }}
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
