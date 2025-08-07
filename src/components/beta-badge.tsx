'use client';

import { cn } from '@/lib/utils';

interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BetaBadge = ({ className, size = 'sm' }: BetaBadgeProps) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm'
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-full font-semibold tracking-wide uppercase',
        'bg-gradient-to-r from-orange-500 to-red-500 text-white',
        'shadow-md border border-orange-400/30',
        'animate-pulse-subtle',
        sizeClasses[size],
        className
      )}
    >
      Beta
    </span>
  );
};
