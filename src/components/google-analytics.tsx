'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const GoogleAnalytics = () => {
  useEffect(() => {
    console.log('Google Analytics: All env vars:', {
      GA_MEASUREMENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      ALL_NEXT_PUBLIC: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    });

    if (!GA_MEASUREMENT_ID) {
      console.warn('Google Analytics: GA_MEASUREMENT_ID is not set');
      return;
    }

    console.log('Google Analytics: Loading with ID:', GA_MEASUREMENT_ID);

    // Load Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.onload = () => console.log('Google Analytics: gtag.js loaded successfully');
    script1.onerror = () => console.error('Google Analytics: Failed to load gtag.js');
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href,
      });
      console.log('Google Analytics: Configuration loaded');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
};

// Event tracking functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackConversion = (eventName: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      value: value,
      currency: 'USD',
    });
  }
};
