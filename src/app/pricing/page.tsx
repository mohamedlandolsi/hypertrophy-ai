'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, Star, Zap, Target, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { UpgradeButton } from '@/components/upgrade-button';
import { CurrencySelector } from '@/components/currency-selector';
import Head from 'next/head';
import { generateSchema } from '@/lib/seo';
import { 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency,
  getDefaultCurrency,
  getDefaultCurrencySync,
  SUPPORTED_CURRENCIES 
} from '@/lib/currency';

export default function PricingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TND');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        
        // Fetch user plan
        try {
          const response = await fetch('/api/user/plan');
          if (response.ok) {
            const planData = await response.json();
            setUserPlan(planData.plan);
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const initializeCurrency = async () => {
      setIsLoadingPricing(true);
      try {
        // Start with sync default for immediate UI
        const syncCurrency = getDefaultCurrencySync();
        setSelectedCurrency(syncCurrency);
        
        // Get async location-based currency
        const defaultCurrency = await getDefaultCurrency();
        setSelectedCurrency(defaultCurrency);
        
        const pricing = await getPricingForCurrency(defaultCurrency);
        setPricingData(pricing);
      } catch (error) {
        console.error('Error initializing currency:', error);
        // Fallback to sync default
        const fallbackCurrency = getDefaultCurrencySync();
        setSelectedCurrency(fallbackCurrency);
        try {
          const pricing = await getPricingForCurrency(fallbackCurrency);
          setPricingData(pricing);
        } catch (fallbackError) {
          console.error('Error with fallback currency:', fallbackError);
        }
      } finally {
        setIsLoadingPricing(false);
      }
    };

    initializeCurrency();
  }, []);

  const handleCurrencyChange = (currency: CurrencyCode, pricing: PricingData) => {
    setSelectedCurrency(currency);
    setPricingData(pricing);
  };

  const features = {
    free: [
      '15 messages per day',
      'Basic AI fitness guidance',
      'Access to knowledge base',
      'Standard response time'
    ],
    pro: [
      'Unlimited messages',
      'Persistent conversation memory',
      'Personalized training plans',
      'Progress tracking & analytics',
      'Advanced nutrition guidance',
      'Priority support',
      'Early access to new features',
      'Detailed workout history'
    ]
  };

  return (
    <>
      <Head>
        <title>Pricing Plans - Choose Your Fitness Journey | HypertroQ</title>
        <meta name="description" content="Transform your fitness goals with HypertroQ's AI-powered coaching. Start free with 15 daily messages or upgrade to Pro for unlimited coaching, conversation memory, and personalized training plans." />
        <meta name="keywords" content="fitness coaching pricing, AI personal trainer cost, fitness app subscription, personal training plans, workout coaching rates" />
        <link rel="canonical" href="https://hypertroq.com/pricing" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              generateSchema('Product', {
                name: 'HypertroQ Pro Subscription',
                description: 'Unlimited AI fitness coaching with personalized training plans and conversation memory',
                offers: [
                  {
                    '@type': 'Offer',
                    name: 'Free Plan',
                    price: '0',
                    priceCurrency: 'USD',
                    description: '15 messages per day, basic AI guidance',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Pro Plan - Monthly',
                    price: '9.99',
                    priceCurrency: 'USD',
                    description: 'Unlimited messages, conversation memory, personalized training',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Pro Plan - Yearly',
                    price: '99.99',
                    priceCurrency: 'USD',
                    description: 'Unlimited messages, conversation memory, personalized training - billed annually',
                  }
                ]
              })
            ])
          }}
        />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-900">
              <Star className="mr-1 h-3 w-3" />
              Subscription Plans
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Choose Your Fitness Journey
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your fitness goals with AI-powered coaching. Start free or unlock unlimited potential with Pro.
          </p>
          
          {/* Currency Selector */}
          <div className="flex justify-center mb-8">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
            />
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingInterval === 'month' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => {
                const newInterval = billingInterval === 'month' ? 'year' : 'month';
                console.log('Pricing page: billing interval changing from', billingInterval, 'to', newInterval);
                setBillingInterval(newInterval);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingInterval === 'year' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'year' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
              Yearly
            </span>
            {billingInterval === 'year' && pricingData && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Save {pricingData.savingsPercentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Free Plan</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Perfect for getting started with AI fitness coaching
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">$0</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.free.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                {!isAuthenticated ? (
                  <Link href="/signup">
                    <Button className="w-full" variant="outline" size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                ) : userPlan === 'FREE' ? (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    ✓ You have Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-blue-500 hover:border-blue-600 dark:border-blue-400 dark:hover:border-blue-300 transition-all duration-300 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-600 text-white px-4 py-1 dark:bg-blue-500 dark:text-white">
                <Crown className="mr-1 h-3 w-3" />
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">Pro Plan</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Unlock unlimited AI coaching and advanced features
              </CardDescription>
              <div className="mt-4">
                {isLoadingPricing || !pricingData ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                      {billingInterval === 'year' 
                        ? pricingData.formattedYearly 
                        : pricingData.formattedMonthly
                      }
                    </span>
                    {billingInterval === 'year' ? (
                      <span className="text-blue-700 dark:text-blue-300">/year</span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-300">/month</span>
                    )}
                    {billingInterval === 'year' && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Equivalent to {SUPPORTED_CURRENCIES[selectedCurrency].symbol}{(pricingData.yearly / 12).toFixed(2)}/month
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Cancel anytime</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {features.pro.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                {!isAuthenticated ? (
                  <Link href="/signup">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Start Pro Trial
                    </Button>
                  </Link>
                ) : userPlan === 'PRO' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    ✓ Active Plan
                  </Button>
                ) : (
                  <UpgradeButton 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    showDialog={false}
                    defaultInterval={billingInterval}
                    currency={selectedCurrency}
                    pricingData={pricingData}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">Why Upgrade to Pro?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Unlimited Conversations</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Chat as much as you want without daily limits. Get continuous support for your fitness journey.
              </p>
            </article>
            
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Personalized Coaching</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI remembers your progress, preferences, and goals to provide truly personalized guidance.
              </p>
            </article>
            
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Progress Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced analytics and insights to track your fitness progress and optimize your results.
              </p>
            </article>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Can I cancel anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can cancel your Pro subscription at any time. You&apos;ll continue to have Pro access until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">What happens to my data if I downgrade?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your conversation history and progress data are safely stored. You&apos;ll just be limited to 15 messages per day on the free plan.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Is there a free trial?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every new user starts with our free plan which includes 15 messages per day. You can upgrade to Pro anytime to unlock unlimited access.
              </p>
            </div>
          </div>
        </section>
        </header>
      </main>
    </>
  );
}
