'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Globe, Check } from 'lucide-react';
import { 
  SUPPORTED_CURRENCIES, 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency
} from '@/lib/currency';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode, pricingData: PricingData) => void;
  className?: string;
}

export function CurrencySelector({ 
  selectedCurrency, 
  onCurrencyChange, 
  className = '' 
}: CurrencySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleCurrencySelect = async (currency: CurrencyCode) => {
    if (currency === selectedCurrency) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const pricingData = await getPricingForCurrency(currency);
      onCurrencyChange(currency, pricingData);
    } catch (error) {
      console.error('Failed to get pricing for currency:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES[selectedCurrency];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${className}`}
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">
            {selectedCurrencyInfo.flag} {selectedCurrency}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 max-w-[calc(100vw-2rem)] p-0" 
        align={isMobile ? "center" : "end"}
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        <div className="p-4">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3">
            Select Currency
          </h4>
          <div className="grid gap-1 max-h-64 overflow-y-auto">
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => handleCurrencySelect(code as CurrencyCode)}
                disabled={isLoading}
                className={`flex items-center justify-between w-full p-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation ${
                  code === selectedCurrency 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{info.flag}</span>
                  <div>
                    <div className="font-medium text-sm">{code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {info.country}
                    </div>
                  </div>
                </div>
                {code === selectedCurrency && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Exchange rates are updated hourly and may vary slightly during checkout.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface CurrencyBadgeProps {
  currency: CurrencyCode;
  className?: string;
}

export function CurrencyBadge({ currency, className = '' }: CurrencyBadgeProps) {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  
  return (
    <Badge variant="secondary" className={`gap-1 ${className}`}>
      <span className="text-xs">{currencyInfo.flag}</span>
      {currency}
    </Badge>
  );
}

export default CurrencySelector;
