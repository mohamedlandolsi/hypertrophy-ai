import { NextRequest, NextResponse } from 'next/server';

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

/**
 * Server-side exchange rate API to avoid CORS issues
 * Fetches exchange rates and caches them server-side
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseCurrency = searchParams.get('base') || 'TND';

    // Try multiple exchange rate services
    const services = [
      {
        url: `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
        timeout: 8000
      },
      {
        url: `https://api.fixer.io/latest?base=${baseCurrency}`,
        timeout: 8000
      }
    ];

    for (const service of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout);

        const response = await fetch(service.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data: ExchangeRateResponse = await response.json();
          
          if (data.rates) {
            return NextResponse.json({
              rates: data.rates,
              base: data.base || baseCurrency,
              date: data.date || new Date().toISOString().split('T')[0],
              service: service.url.split('/')[2], // domain name
            });
          }
        }
      } catch (serviceError) {
        console.warn(`Exchange rate service ${service.url} failed:`, serviceError);
        continue; // Try next service
      }
    }

    // If all services fail, return fallback rates
    const fallbackRates = {
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

    return NextResponse.json({
      rates: fallbackRates,
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      note: 'All exchange rate services failed, using fallback rates'
    });

  } catch (error) {
    console.error('Exchange rate API error:', error);
    
    // Return fallback rates even on error
    const fallbackRates = {
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

    return NextResponse.json({
      rates: fallbackRates,
      base: 'TND',
      date: new Date().toISOString().split('T')[0],
      error: 'Exchange rate service unavailable'
    }, { status: 200 }); // Still return 200 to avoid breaking the app
  }
}
