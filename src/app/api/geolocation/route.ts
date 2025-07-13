import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side geolocation API to avoid CORS issues
 * Tries multiple services for better reliability
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1';

    // Skip geolocation for local/development IPs
    if (clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      return NextResponse.json({ 
        country_code: 'TN', // Default to Tunisia for local development
        country: 'Tunisia',
        note: 'Local IP detected, using default location'
      });
    }

    // Try multiple geolocation services
    const services = [
      {
        url: `https://ipapi.co/${clientIp}/json/`,
        timeout: 5000
      },
      {
        url: `https://freegeoip.app/json/${clientIp}`,
        timeout: 5000
      },
      {
        url: `https://api.country.is/${clientIp}`,
        timeout: 5000
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
          const data: Record<string, unknown> = await response.json();
          
          // Handle different API response formats
          let countryCode: string | undefined;
          
          if (typeof data.country_code === 'string') {
            countryCode = data.country_code;
          } else if (typeof data.country === 'string') {
            countryCode = data.country;
          } else if (typeof data.countryCode === 'string') {
            countryCode = data.countryCode;
          }

          if (countryCode) {
            return NextResponse.json({
              country_code: countryCode.toUpperCase(),
              country: (data.country_name as string) || (data.country as string) || 'Unknown',
              service: service.url.split('/')[2], // domain name
            });
          }
        }
      } catch (serviceError) {
        console.warn(`Geolocation service ${service.url} failed:`, serviceError);
        continue; // Try next service
      }
    }

    // If all services fail, return fallback
    return NextResponse.json({ 
      country_code: 'TN',
      country: 'Tunisia',
      note: 'All geolocation services failed, using fallback'
    });

  } catch (error) {
    console.error('Geolocation API error:', error);
    
    return NextResponse.json({ 
      country_code: 'TN',
      country: 'Tunisia',
      error: 'Geolocation service unavailable'
    }, { status: 200 }); // Still return 200 to avoid breaking the app
  }
}
