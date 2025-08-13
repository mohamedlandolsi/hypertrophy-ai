"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LaTeXProps {
  math: string;
  block?: boolean;
}

export const LaTeX: React.FC<LaTeXProps> = ({ math, block = false }) => {
  try {
    if (block) {
      return <BlockMath math={math} />;
    } else {
      return <InlineMath math={math} />;
    }
  } catch (error) {
    // Fallback to raw text if LaTeX rendering fails
    console.warn('LaTeX rendering failed:', error);
    return <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{block ? `$$${math}$$` : `$${math}$`}</span>;
  }
};

// Utility function to detect and parse LaTeX in text
export const parseLatex = (text: string): (string | { type: 'latex'; math: string; block: boolean })[] => {
  const parts: (string | { type: 'latex'; math: string; block: boolean })[] = [];
  
  // First handle block math ($$...$$)
  let lastIndex = 0;
  
  // Block math regex: $$...$$
  const blockRegex = /\$\$([^$]*?)\$\$/g;
  let blockMatch;
  
  while ((blockMatch = blockRegex.exec(text)) !== null) {
    // Add text before the match
    if (blockMatch.index > lastIndex) {
      const beforeText = text.slice(lastIndex, blockMatch.index);
      parts.push(...parseInlineMath(beforeText));
    }
    
    // Add the block math
    parts.push({
      type: 'latex',
      math: blockMatch[1].trim(),
      block: true
    });
    
    lastIndex = blockMatch.index + blockMatch[0].length;
  }
  
  // Add remaining text and process for inline math
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(...parseInlineMath(remainingText));
  }
  
  return parts;
};

// Helper function to parse inline math from text
const parseInlineMath = (text: string): (string | { type: 'latex'; math: string; block: boolean })[] => {
  const parts: (string | { type: 'latex'; math: string; block: boolean })[] = [];
  
  // Inline math regex: $...$ (but not $$)
  const inlineRegex = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the inline math
    parts.push({
      type: 'latex',
      math: match[1].trim(),
      block: false
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
};
