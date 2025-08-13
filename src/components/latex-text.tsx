"use client";

import React from 'react';
import { LaTeX, parseLatex } from './latex';

interface LaTeXTextProps {
  children: string;
  className?: string;
}

export const LaTeXText: React.FC<LaTeXTextProps> = ({ children, className }) => {
  const parts = parseLatex(children);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else {
          return (
            <LaTeX
              key={index}
              math={part.math}
              block={part.block}
            />
          );
        }
      })}
    </span>
  );
};
