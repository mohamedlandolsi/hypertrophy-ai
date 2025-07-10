'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import SafeHtmlRenderer to avoid SSR issues
const SafeHtmlRenderer = dynamic(
  () => import('./safe-html-renderer'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }
);

export default function ClientOnlyHtmlRenderer(props: ComponentProps<typeof SafeHtmlRenderer>) {
  return <SafeHtmlRenderer {...props} />;
}
