'use client';

import { Badge } from '@/components/ui/badge';
import { UserPlan } from '@prisma/client';

interface PlanBadgeProps {
  plan: UserPlan;
  className?: string;
}

export function PlanBadge({ plan, className = '' }: PlanBadgeProps) {
  const displayInfo = getPlanDisplayInfo(plan);

  return (
    <Badge 
      variant={plan === 'PRO' ? 'default' : 'secondary'}
      className={`${displayInfo.color} ${className}`}
    >
      {displayInfo.name}
    </Badge>
  );
}

// Inline the function to avoid any import issues
function getPlanDisplayInfo(plan: UserPlan) {
  switch (plan) {
    case 'FREE':
      return {
        name: 'Free',
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
    case 'PRO':
      return {
        name: 'Pro',
        price: '$9.99',
        period: '/month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    default:
      return {
        name: 'Unknown',
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
  }
}
