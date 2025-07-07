'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
}

export default function SafeHtmlRenderer({ content, className = '' }: SafeHtmlRendererProps) {
  // Function to detect if content is HTML
  const isHtmlContent = (text: string): boolean => {
    // Check for common HTML tags that would be in rich text content
    const htmlPattern = /<(h[1-6]|p|div|span|strong|em|ul|ol|li|blockquote|br|b|i|u|code|pre)\b[^>]*>/i;
    return htmlPattern.test(text);
  };

  // Function to safely render HTML
  const renderSafeHtml = (htmlContent: string) => {
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
