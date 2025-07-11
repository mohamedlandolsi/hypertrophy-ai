'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPlan } from '@prisma/client';
import { UserPlanLimits } from '@/lib/subscription-client';

interface SubscriptionContextType {
  plan: UserPlan | null;
  limits: UserPlanLimits | null;
  messagesUsedToday: number;
  subscription: {
    id: string;
    status: string;
    lemonSqueezyId: string | null;
    planId: string | null;
    variantId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  isLoading: boolean;
  refreshPlan: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [limits, setLimits] = useState<UserPlanLimits | null>(null);
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const [subscription, setSubscription] = useState<{
    id: string;
    status: string;
    lemonSqueezyId: string | null;
    planId: string | null;
    variantId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlanData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
        setLimits(data.limits);
        setMessagesUsedToday(data.messagesUsedToday);
        setSubscription(data.subscription);
      } else {
        // User not authenticated or error - set defaults
        setPlan(null);
        setLimits(null);
        setMessagesUsedToday(0);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      // Set defaults on error
      setPlan(null);
      setLimits(null);
      setMessagesUsedToday(0);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, []);

  const contextValue: SubscriptionContextType = {
    plan,
    limits,
    messagesUsedToday,
    subscription,
    isLoading,
    refreshPlan: fetchPlanData,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}
