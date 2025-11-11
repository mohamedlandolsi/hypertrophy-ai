'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-1SDWNDGJHG';

export const GoogleAnalytics = () => {
  useEffect(() => {

    if (!GA_MEASUREMENT_ID) {
      return;
    }

    // Check if already loaded to prevent duplicate loading
    if (typeof window.gtag === 'function') {
      return;
    }

    if (process.env.NODE_ENV === 'development') { console.log('Google Analytics: Loading scripts...'); }

    // Load Google Analytics with error handling
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.onload = () => console.log('Google Analytics: gtag.js loaded successfully');
    script1.onerror = (error) => {
      console.error('Google Analytics: Failed to load gtag.js', error);
      // Don't break the app if analytics fails
    };
    
    try {
      document.head.appendChild(script1);
    } catch (error) {
      console.error('Google Analytics: Failed to append gtag script', error);
      return;
    }

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href,
      });
      if (process.env.NODE_ENV === 'development') { console.log('Google Analytics: Configuration loaded successfully'); }
    `;
    
    try {
      document.head.appendChild(script2);
    } catch (error) {
      console.error('Google Analytics: Failed to append config script', error);
    }

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
