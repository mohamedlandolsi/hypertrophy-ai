"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTextFormatting } from '@/lib/text-formatting';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
  imageData?: string;
  imageMimeType?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, imageData }) => {
  const formatting = getTextFormatting(content);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  
  return (
    <div
      dir={formatting.dir}
      lang={formatting.lang}
      style={formatting.style}
      className={`message-content ${formatting.className}`}
    >
      {/* Display image if present */}
      {imageData && (
        <div className={content && content !== '[Image]' ? 'mb-3' : ''}>
          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <DialogTrigger asChild>
              <img
                src={imageData}
                alt="Uploaded image"
                className="max-w-full max-h-64 object-contain rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ maxWidth: '300px' }}
                title="Click to view full size"
              />
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-2" showCloseButton={true}>
              <DialogTitle className="sr-only">Image Preview</DialogTitle>
              <div className="flex items-center justify-center">
                <img
                  src={imageData}
                  alt="Uploaded image - Full size"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Only show text content if it exists and is not just the placeholder */}
      {content && content !== '[Image]' && (
        <div className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          // Custom styling for different elements
          p: ({ children }) => (
            <p 
              className="text-sm leading-relaxed mb-3 last:mb-0 text-foreground dark:text-foreground"
              style={{
                lineHeight: formatting.lang === 'ar' ? '1.8' : '1.7',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                textRendering: 'optimizeLegibility',
                fontFeatureSettings: '"liga" 1, "calt" 1',
                wordSpacing: formatting.dir === 'auto' ? '0.1em' : 'normal',
              }}
            >
              {children}
            </p>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-bold text-foreground dark:text-foreground">
              {children}
            </strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic text-foreground/80 dark:text-foreground/80">
              {children}
            </em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3 pl-4 text-foreground dark:text-foreground">
              {children}
            </ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 my-3 pl-6 text-foreground dark:text-foreground">
              {children}
            </ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="text-sm leading-relaxed mb-1 text-foreground dark:text-foreground">
              {children}
            </li>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-foreground dark:text-foreground">
              {children}
            </h3>
          ),
          // Code blocks
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted dark:bg-muted text-xs font-mono text-foreground dark:text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-3 rounded-lg bg-muted dark:bg-muted text-xs font-mono overflow-x-auto text-foreground dark:text-foreground">
                {children}
              </code>
            );
          },
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary dark:border-primary pl-4 my-3 italic text-foreground/70 dark:text-foreground/70">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-border dark:border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border dark:border-border px-3 py-2 bg-muted dark:bg-muted font-semibold text-xs text-foreground dark:text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border dark:border-border px-3 py-2 text-xs text-foreground dark:text-foreground">
              {children}
            </td>
          ),
          // Links
          a: ({ children, href }) => {
            // Regular external links only (article links are handled separately now)
            return (
              <a 
                href={href} 
                className="text-primary dark:text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          // Horizontal rules
          hr: () => (
            <hr className="my-4 border-border dark:border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
