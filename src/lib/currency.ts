/**
 * Currency conversion service for HypertroQ pricing
 * Converts from TND (Tunisian Dinar) to various currencies
 */

// Base prices in TND (Tunisian Dinar)
export const BASE_PRICES_TND = {
  MONTHLY: 29,
  YEARLY: 278, // 20% discount from 29 * 12 = 348
} as const;

// Supported currencies with their symbols and country info
export const SUPPORTED_CURRENCIES = {
  TND: { symbol: 'TND', name: 'Tunisian Dinar', country: 'Tunisia', flag: '🇹🇳' },
  USD: { symbol: '$', name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', country: 'European Union', flag: '🇪🇺' },
  EGP: { symbol: 'ج.م', name: 'Egyptian Pound', country: 'Egypt', flag: '🇪🇬' },
  DZD: { symbol: 'د.ج', name: 'Algerian Dinar', country: 'Algeria', flag: '🇩🇿' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', country: 'Morocco', flag: '🇲🇦' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', country: 'Saudi Arabia', flag: '🇸🇦' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', country: 'UAE', flag: '🇦🇪' },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal', country: 'Qatar', flag: '🇶🇦' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'Kuwait', flag: '🇰🇼' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export interface ExchangeRates {
  [key: string]: number;
}

export interface PricingData {
  currency: CurrencyCode;
  monthly: number;
  yearly: number;
  savings: number;
  savingsPercentage: number;
  formattedMonthly: string;
  formattedYearly: string;
}

// Cache for exchange rates (valid for 1 hour)
interface CacheEntry {
  rates: ExchangeRates;
  timestamp: number;
  ttl: number;
}

let ratesCache: CacheEntry | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates from server-side API to avoid CORS issues
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  if (ratesCache && Date.now() - ratesCache.timestamp < ratesCache.ttl) {
    return ratesCache.rates;
  }

  try {
    // Use our server-side API route to avoid CORS issues
    const response = await fetch('/api/exchange-rates?base=TND', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      // Add timeout using AbortController
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.rates) {
        // Cache the rates
        ratesCache = {
          rates: data.rates,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        };

        return data.rates;
      }
    }

    throw new Error('Invalid response from exchange rate API');
  } catch {
    // Use fallback rates silently in production
    const fallbackRates: ExchangeRates = {
      TND: 1,
      USD: 0.32,
      EUR: 0.29,
      EGP: 15.8,
      DZD: 43.2,
      MAD: 3.1,
      SAR: 1.2,
      AED: 1.17,
      QAR: 1.16,
      KWD: 0.097,
    };

    // Cache fallback rates for shorter time
    ratesCache = {
      rates: fallbackRates,
      timestamp: Date.now(),
      ttl: 10 * 60 * 1000, // 10 minutes for fallback
    };

    return fallbackRates;
  }
}

/**
 * Convert TND amount to target currency
 */
export async function convertFromTND(
  amountTND: number,
  targetCurrency: CurrencyCode
): Promise<number> {
  if (targetCurrency === 'TND') {
    return amountTND;
  }

  const rates = await fetchExchangeRates();
  const rate = rates[targetCurrency];

  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${targetCurrency}`);
  }

  return amountTND * rate;
}

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  
  // Round to 2 decimal places for most currencies, but handle special cases
  let roundedAmount: number;
  
  if (currency === 'KWD') {
    // Kuwaiti Dinar typically uses 3 decimal places
    roundedAmount = Math.round(amount * 1000) / 1000;
  } else if (['EGP', 'DZD'].includes(currency)) {
    // Some currencies work better with whole numbers for pricing
    roundedAmount = Math.round(amount);
  } else {
    roundedAmount = Math.round(amount * 100) / 100;
  }

  // For Arabic currencies, use appropriate formatting
  if (['EGP', 'DZD', 'MAD', 'SAR', 'AED', 'QAR', 'KWD'].includes(currency)) {
    return `${roundedAmount} ${currencyInfo.symbol}`;
  }

  // For Western currencies, use standard formatting
  if (currency === 'EUR') {
    return `${roundedAmount}${currencyInfo.symbol}`;
  }

  return `${currencyInfo.symbol}${roundedAmount}`;
}

/**
 * Get pricing data for a specific currency
 */
export async function getPricingForCurrency(currency: CurrencyCode): Promise<PricingData> {
  const monthlyTND = BASE_PRICES_TND.MONTHLY;
  const yearlyTND = BASE_PRICES_TND.YEARLY;

  const monthlyConverted = await convertFromTND(monthlyTND, currency);
  const yearlyConverted = await convertFromTND(yearlyTND, currency);

  const yearlyMonthlyEquivalent = yearlyConverted / 12;
  const savings = monthlyConverted - yearlyMonthlyEquivalent;
  const savingsPercentage = Math.round((savings / monthlyConverted) * 100);

  return {
    currency,
    monthly: monthlyConverted,
    yearly: yearlyConverted,
    savings,
    savingsPercentage,
    formattedMonthly: formatCurrency(monthlyConverted, currency),
    formattedYearly: formatCurrency(yearlyConverted, currency),
  };
}

// Country code to currency mapping
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  // Tunisia
  'TN': 'TND',
  // United States
  'US': 'USD',
  // European Union countries
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 
  'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'IE': 'EUR', 'GR': 'EUR',
  'FI': 'EUR', 'LU': 'EUR', 'SI': 'EUR', 'SK': 'EUR', 'EE': 'EUR',
  'LV': 'EUR', 'LT': 'EUR', 'CY': 'EUR', 'MT': 'EUR',
  // Egypt
  'EG': 'EGP',
  // Algeria
  'DZ': 'DZD',
  // Morocco
  'MA': 'MAD',
  // Saudi Arabia
  'SA': 'SAR',
  // UAE
  'AE': 'AED',
  // Qatar
  'QA': 'QAR',
  // Kuwait
  'KW': 'KWD',
};

interface GeolocationResponse {
  country_code?: string;
  country?: string;
  timezone?: string;
  error?: string;
}

/**
 * Get user's country code using IP geolocation
 * Uses server-side API route to avoid CORS issues
 */
async function getUserCountryCode(): Promise<string | null> {
  try {
    // Use our server-side API route to avoid CORS issues
    const response = await fetch('/api/geolocation', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000)
    });

    if (response.ok) {
      const data: GeolocationResponse = await response.json();
      if (data.country_code) {
        return data.country_code.toUpperCase();
      }
    }

    return null;
  } catch {
    // Silently fail and use locale-based detection
    return null;
  }
}

/**
 * Get currency from browser locale as fallback
 */
function getCurrencyFromLocale(): CurrencyCode {
  if (typeof window === 'undefined') {
    return 'TND';
  }

  const locale = navigator.language.toLowerCase();
  
  // Extract country code from locale (e.g., 'en-US' -> 'US')
  const localeParts = locale.split('-');
  if (localeParts.length > 1) {
    const countryCode = localeParts[1].toUpperCase();
    if (COUNTRY_TO_CURRENCY[countryCode]) {
      return COUNTRY_TO_CURRENCY[countryCode];
    }
  }

  // Fallback to language-based detection
  if (locale.includes('ar')) {
    // Arabic speakers - prefer regional currencies
    if (locale.includes('eg')) return 'EGP';
    if (locale.includes('sa')) return 'SAR';
    if (locale.includes('ae')) return 'AED';
    if (locale.includes('qa')) return 'QAR';
    if (locale.includes('kw')) return 'KWD';
    if (locale.includes('dz')) return 'DZD';
    if (locale.includes('ma')) return 'MAD';
    return 'TND'; // Default for Arabic
  }
  
  if (locale.includes('en-us') || locale.includes('us')) return 'USD';
  if (locale.includes('en-eu') || locale.includes('de') || locale.includes('fr')) return 'EUR';

  return 'TND'; // Default
}

/**
 * Get user's preferred currency based on their location
 * Enhanced with IP geolocation and browser locale fallback
 */
export async function getDefaultCurrency(): Promise<CurrencyCode> {
  try {
    // First, try IP-based geolocation
    const countryCode = await getUserCountryCode();
    if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
      console.log(`Currency detected from location: ${countryCode} -> ${COUNTRY_TO_CURRENCY[countryCode]}`);
      return COUNTRY_TO_CURRENCY[countryCode];
    }

    // Fallback to browser locale
    const localeCurrency = getCurrencyFromLocale();
    console.log(`Currency detected from locale: ${localeCurrency}`);
    return localeCurrency;

  } catch {
    // Silently use locale-based detection
    return getCurrencyFromLocale();
  }
}

/**
 * Synchronous version for immediate use (uses locale only)
 * Use this when you need a currency immediately without waiting for geolocation
 */
export function getDefaultCurrencySync(): CurrencyCode {
  return getCurrencyFromLocale();
}

/**
 * Get all supported currencies with pricing
 */
export async function getAllPricingData(): Promise<Record<CurrencyCode, PricingData>> {
  const currencies = Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[];
  const pricingData: Record<CurrencyCode, PricingData> = {} as Record<CurrencyCode, PricingData>;

  await Promise.all(
    currencies.map(async (currency) => {
      try {
        pricingData[currency] = await getPricingForCurrency(currency);
      } catch (error) {
        console.error(`Failed to get pricing for ${currency}:`, error);
        // Fallback to TND if conversion fails
        if (currency !== 'TND') {
          pricingData[currency] = await getPricingForCurrency('TND');
        }
      }
    })
  );

  return pricingData;
}

/**
 * Utility to refresh exchange rates manually
 */
export function clearRatesCache(): void {
  ratesCache = null;
}

const currencyService = {
  getPricingForCurrency,
  getAllPricingData,
  formatCurrency,
  convertFromTND,
  getDefaultCurrency,
  clearRatesCache,
  SUPPORTED_CURRENCIES,
  BASE_PRICES_TND,
};

export default currencyService;
