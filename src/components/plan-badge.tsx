'use client';

import { Badge } from '@/components/ui/badge';
import { UserPlan } from '@prisma/client';
import { useTranslations } from 'next-intl';

interface PlanBadgeProps {
  plan: UserPlan;
  className?: string;
}

export function PlanBadge({ plan, className = '' }: PlanBadgeProps) {
  const t = useTranslations('planBadge');
  const displayInfo = getPlanDisplayInfo(plan, t);

  return (
    <Badge 
      variant={plan === 'PRO' ? 'default' : 'secondary'}
      className={`${displayInfo.className} ${className} font-semibold`}
    >
      {displayInfo.name}
    </Badge>
  );
}

// Inline the function to avoid any import issues
function getPlanDisplayInfo(plan: UserPlan, t: (key: string) => string) {
  switch (plan) {
    case 'FREE':
      return {
        name: t('free'),
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      };
    case 'PRO':
      return {
        name: t('pro'),
        price: '$9',
        period: '/month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        className: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm hover:shadow-md transition-shadow',
      };
    default:
      return {
        name: t('unknown'),
        price: '$0',
        period: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      };
  }
}
