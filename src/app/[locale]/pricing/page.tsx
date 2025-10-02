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
import { useLocale, useTranslations } from 'next-intl';
import { 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency,
  getDefaultCurrency,
  getDefaultCurrencySync,
  SUPPORTED_CURRENCIES 
} from '@/lib/currency';

export default function PricingPage() {
  const locale = useLocale();
  const t = useTranslations('Pricing');
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

  // Add effect to track billingInterval changes
  useEffect(() => {
    console.log('Pricing page: billingInterval changed to:', billingInterval);
  }, [billingInterval]);

  const features = {
    free: [
      t('freePlan.features.0'),
      t('freePlan.features.1'),
      t('freePlan.features.2'),
      t('freePlan.features.3')
    ],
    pro: [
      t('proPlan.features.0'),
      t('proPlan.features.1'),
      t('proPlan.features.2'),
      t('proPlan.features.3'),
      t('proPlan.features.4'),
      t('proPlan.features.5'),
      t('proPlan.features.6'),
      t('proPlan.features.7')
    ]
  };

  return (
    <>
      <Head>
        <title>Pricing Plans - Choose Your Training Program | HypertroQ</title>
        <meta name="description" content="Access expert hypertrophy training programs designed for muscle growth. Start free with 1 program or upgrade to Pro for unlimited access to all programs, customization, and AI assistance." />
        <meta name="keywords" content="training program pricing, hypertrophy programs, muscle building plans, workout program subscription, fitness training membership" />
        <link rel="canonical" href="https://hypertroq.com/pricing" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              generateSchema('Product', {
                name: 'HypertroQ Pro Subscription',
                description: 'Unlimited access to all hypertrophy training programs with customization and AI assistance',
                offers: [
                  {
                    '@type': 'Offer',
                    name: 'Free Plan',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Access to 1 training program with basic features',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Pro Plan - Monthly',
                    price: '9',
                    priceCurrency: 'USD',
                    description: 'All training programs, customization, AI assistant, workout tracking',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Pro Plan - Yearly',
                    price: '90',
                    priceCurrency: 'USD',
                    description: 'All training programs, customization, AI assistant, workout tracking - billed annually',
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
              {t('subscriptionPlansLabel')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              {t('heroSubtitle')}
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
              {t('monthly')}
            </span>
            <button
              onClick={() => {
                const newInterval = billingInterval === 'month' ? 'year' : 'month';
                console.log('Pricing page: billing interval changing from', billingInterval, 'to', newInterval);
                setBillingInterval(newInterval);
                console.log('Pricing page: billingInterval state will be updated to', newInterval);
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
              {t('yearly')}
            </span>
            {billingInterval === 'year' && pricingData && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                {t('save', { percentage: pricingData.savingsPercentage })}
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('freePlan.title')}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('freePlan.description')}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{t('freePlan.price')}</span>
                <span className="text-gray-600 dark:text-gray-400">{t('freePlan.period')}</span>
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
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full" variant="outline" size="lg">
                      {t('freePlan.cta')}
                    </Button>
                  </Link>
                ) : userPlan === 'FREE' ? (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    {t('freePlan.currentPlanButton')}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    {t('freePlan.youHavePro')}
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
                {t('proPlan.mostPopular')}
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100">{t('proPlan.title')}</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                {t('proPlan.description')}
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
                      <span className="text-blue-700 dark:text-blue-300">{t('proPlan.yearPeriod')}</span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-300">{t('proPlan.period')}</span>
                    )}
                    {billingInterval === 'year' && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        {t('proPlan.equivalentTo')} {SUPPORTED_CURRENCIES[selectedCurrency].symbol}{(pricingData.yearly / 12).toFixed(2)}{t('proPlan.period')}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{t('proPlan.cancelAnytime')}</p>
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
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      {t('proPlan.cta')}
                    </Button>
                  </Link>
                ) : userPlan === 'PRO' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    {t('proPlan.currentPlanButton')}
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
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">{t('whyUpgradeTitle')}</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('benefits.unlimited.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('benefits.unlimited.description')}
              </p>
            </article>
            
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('benefits.personalized.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('benefits.personalized.description')}
              </p>
            </article>
            
            <article className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('benefits.tracking.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('benefits.tracking.description')}
              </p>
            </article>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">{t('faq.title')}</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{t('faq.questions.0.question')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('faq.questions.0.answer')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{t('faq.questions.1.question')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('faq.questions.1.answer')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{t('faq.questions.2.question')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('faq.questions.2.answer')}
              </p>
            </div>
          </div>
        </section>
        </header>
      </main>
    </>
  );
}
