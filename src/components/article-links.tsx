"use client";

import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { ArticleLink } from '@/lib/article-links';

interface ArticleLinksProps {
  links: ArticleLink[];
  messageRole: 'user' | 'assistant';
}

export const ArticleLinks: React.FC<ArticleLinksProps> = ({ links, messageRole }) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="referenced-articles" className="border-b-0">
          <AccordionTrigger
            className={`
              flex items-center justify-between w-full py-2 px-3 text-xs font-medium
              transition-all duration-200 group hover:no-underline
              ${messageRole === 'user' 
                ? 'text-white/60 hover:text-white/80' 
                : 'text-primary/60 hover:text-primary/80'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>Referenced Articles ({links.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="space-y-1 pt-1">
              {links.map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-2 p-3 rounded-lg text-xs
                    transition-all duration-200 group
                    ${messageRole === 'user' 
                      ? 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white' 
                      : 'bg-primary/8 hover:bg-primary/15 text-primary/90 hover:text-primary border border-primary/20 hover:border-primary/30'
                    }
                  `}
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-1 truncate font-medium">
                    {link.title}
                  </span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
