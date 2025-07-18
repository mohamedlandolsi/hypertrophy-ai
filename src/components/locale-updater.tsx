'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function LocaleUpdater() {
  const params = useParams();
  const locale = params?.locale as string || 'en';

  useEffect(() => {
    // Update the html lang and dir attributes when locale changes
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return null; // This component doesn't render anything
}
