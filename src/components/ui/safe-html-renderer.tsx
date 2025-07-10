'use client';

import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
}

export default function SafeHtmlRenderer({ content, className = '' }: SafeHtmlRendererProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to detect if content is HTML
  const isHtmlContent = (text: string): boolean => {
    // Check for common HTML tags that would be in rich text content
    const htmlPattern = /<(h[1-6]|p|div|span|strong|em|ul|ol|li|blockquote|br|b|i|u|code|pre)\b[^>]*>/i;
    return htmlPattern.test(text);
  };

  // Function to safely render HTML
  const renderSafeHtml = (htmlContent: string) => {
    if (!isClient) {
      return { __html: '' }; // Return empty during SSR
    }

    const cleanHtml = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'br',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'ul', 'ol', 'li',
        'blockquote',
        'code', 'pre'
      ],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false
    });

    return {
      __html: cleanHtml
    };
  };

  // Show loading state during SSR or initial client hydration
  if (!isClient) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (isHtmlContent(content)) {
    return (
      <div 
        className={`rich-text-content ${className}`}
        dangerouslySetInnerHTML={renderSafeHtml(content)}
      />
    );
  }

  // If it's not HTML content, render as plain text with line breaks
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {content}
    </div>
  );
}
