'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Crown, Check, Zap, Target,
  Shield, Lock,
  Sparkles, Star,
  BarChart3, Clock, Infinity,
  MessageSquare, FileText, Users,
  ChevronRight, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { UpgradeButton } from '@/components/upgrade-button';
import { CurrencySelector } from '@/components/currency-selector';
import Head from 'next/head';
import { useLocale } from 'next-intl';
import { 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency,
  getDefaultCurrency,
  getDefaultCurrencySync
} from '@/lib/currency';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

export default function SubscriptionPricingPage() {
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState<'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY' | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [monthsToCompare, setMonthsToCompare] = useState(6);

  // Sticky CTA state for mobile
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        
        try {
          const response = await fetch('/api/user/subscription-tier');
          if (response.ok) {
            const tierData = await response.json();
            setUserTier(tierData.tier);
          }
        } catch (error) {
          console.error('Error fetching user subscription tier:', error);
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const initializeCurrency = async () => {
      setIsLoadingPricing(true);
      try {
        const syncCurrency = getDefaultCurrencySync();
        setSelectedCurrency(syncCurrency);
        
        const defaultCurrency = await getDefaultCurrency();
        setSelectedCurrency(defaultCurrency);
        
        const pricing = await getPricingForCurrency(defaultCurrency);
        setPricingData(pricing);
      } catch (error) {
        console.error('Error initializing currency:', error);
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

  // Sticky CTA scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyCTA(scrollPosition > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCurrencyChange = (currency: CurrencyCode, pricing: PricingData) => {
    setSelectedCurrency(currency);
    setPricingData(pricing);
  };

  // Calculate savings comparison
  const monthlyTotal = (pricingData?.monthly || 9) * monthsToCompare;
  const yearlyProrated = ((pricingData?.yearly || 90) / 12) * monthsToCompare;
  const savings = (monthlyTotal - yearlyProrated).toFixed(2);
  const savingsPercentage = pricingData?.savingsPercentage || 17;

  return (
    <>
      <Head>
        <title>Choose Your Path to Better Training | HypertroQ Pricing</title>
        <meta name="description" content="Unlimited program customization with intelligent assistance. Start with a free plan or unlock everything with Pro. 7-day free trial, cancel anytime." />
        <meta name="keywords" content="training program subscription, hypertrophy coaching, AI workout builder, personalized training plans" />
        <link rel="canonical" href="https://hypertroq.com/pricing" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-4 py-1.5">
              <Shield className="mr-1 h-3 w-3" />
              7-Day Free Trial - Cancel Anytime
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Choose Your Path to Better Training
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12">
              Unlimited program customization with intelligent assistance
            </p>

            {/* Currency Selector */}
            <div className="flex justify-center mb-8">
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>
          </div>
        </header>

        {/* Pricing Cards - 3 Tiers */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            
            {/* FREE Tier Card */}
            <Card className="relative border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Free
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">$0</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Forever free</p>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400 min-h-[48px]">
                  Perfect for getting started with science-based training
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    { text: '2 custom programs', icon: Target },
                    { text: '5 customizations per month', icon: Sparkles },
                    { text: '10 daily AI messages', icon: MessageSquare },
                    { text: 'Basic split selection', icon: FileText },
                    { text: '1 workout template per program', icon: FileText },
                    { text: 'Exercise database access', icon: BarChart3 },
                    { text: 'Mobile app access', icon: Check }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    First-time users, testing the platform, budget-conscious lifters
                  </p>
                </div>
                
                {!isAuthenticated ? (
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full" variant="outline" size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                ) : userTier === 'FREE' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    Already on Pro
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* PRO Monthly Card - Highlighted */}
            <Card className="relative border-2 border-blue-400 hover:border-blue-500 dark:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-2xl scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 shadow-lg">
                  <Star className="mr-1 h-3 w-3" />
                  Most Popular
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Pro Monthly
                </CardTitle>
                <div className="mb-2">
                  {isLoadingPricing || !pricingData ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-blue-200 dark:bg-blue-700 rounded mb-2"></div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                        {pricingData.formattedMonthly}
                      </span>
                      <span className="text-blue-700 dark:text-blue-300">/month</span>
                    </>
                  )}
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Cancel anytime</p>
                </div>
                <CardDescription className="text-blue-700 dark:text-blue-300 min-h-[48px]">
                  Full access with monthly flexibility
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Everything in Free, plus:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Unlimited custom programs', icon: Infinity, highlight: true },
                    { text: 'Unlimited customizations', icon: Sparkles, highlight: true },
                    { text: 'Unlimited AI assistant', icon: MessageSquare, highlight: true },
                    { text: 'Advanced AI coaching', icon: Zap, highlight: true },
                    { text: 'Workout templates library', icon: FileText, highlight: false },
                    { text: 'Progress tracking & analytics', icon: BarChart3, highlight: false },
                    { text: 'Priority support', icon: Users, highlight: false },
                    { text: 'Early access to features', icon: Sparkles, highlight: false }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-blue-500' : 'text-green-500'}`} />
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Serious lifters, program variety, flexible commitment
                  </p>
                </div>
                
                {!isAuthenticated ? (
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Start 7-Day Free Trial
                    </Button>
                  </Link>
                ) : userTier === 'PRO_MONTHLY' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : userTier === 'FREE' ? (
                  <UpgradeButton 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    showDialog={false}
                    defaultInterval="month"
                    currency={selectedCurrency}
                    pricingData={pricingData}
                  />
                ) : (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    Switch to Monthly
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* PRO Yearly Card - BEST VALUE */}
            <Card className="relative border-2 border-purple-500 hover:border-purple-600 dark:border-purple-400 dark:hover:border-purple-300 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-4 py-1 shadow-lg animate-pulse">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Save {savingsPercentage}%
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                  Pro Yearly
                </CardTitle>
                <div className="mb-2">
                  {isLoadingPricing || !pricingData ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-purple-200 dark:bg-purple-700 rounded mb-2"></div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                        {pricingData.formattedYearly}
                      </span>
                      <span className="text-purple-700 dark:text-purple-300">/year</span>
                      <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{(pricingData.yearly / 12).toFixed(2)}/month - Save {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{pricingData.savings.toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
                <CardDescription className="text-purple-700 dark:text-purple-300 min-h-[48px] font-medium">
                  Maximum value for committed athletes
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Everything in Pro Monthly, plus:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { text: `2 months free (${savingsPercentage}% savings)`, icon: Sparkles, highlight: true },
                    { text: 'Lock in current price', icon: Lock, highlight: true },
                    { text: 'PDF export for programs', icon: FileText, highlight: true },
                    { text: 'Priority support', icon: Users, highlight: true },
                    { text: 'Annual training report', icon: BarChart3, highlight: true },
                    { text: 'All monthly benefits', icon: Check, highlight: false }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-purple-500' : 'text-green-500'}`} />
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Committed athletes, long-term goals, best value
                  </p>
                </div>
                
                {!isAuthenticated ? (
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Start 7-Day Free Trial
                    </Button>
                  </Link>
                ) : userTier === 'PRO_YEARLY' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : userTier === 'FREE' || userTier === 'PRO_MONTHLY' ? (
                  <UpgradeButton 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    showDialog={false}
                    defaultInterval="year"
                    currency={selectedCurrency}
                    pricingData={pricingData}
                  />
                ) : (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    Already on Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Savings Calculator - Monthly vs Yearly */}
        <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Compare Monthly vs Yearly Savings
            </h2>
            
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-8">
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Plan duration: {monthsToCompare} {monthsToCompare === 1 ? 'month' : 'months'}
                  </label>
                  <div className="flex items-center gap-6">
                    <Slider
                      value={[monthsToCompare]}
                      onValueChange={(value) => setMonthsToCompare(value[0])}
                      min={1}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="text-2xl font-bold px-4 py-2">
                      {monthsToCompare}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-100 dark:bg-blue-700/30 rounded-lg p-6">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Monthly total</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{monthlyTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{(pricingData?.monthly || 9).toFixed(2)} × {monthsToCompare} months
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-6">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">Yearly (prorated)</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{yearlyProrated.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{((pricingData?.yearly || 90) / 12).toFixed(2)} × {monthsToCompare} months
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-8">
                  <p className="text-lg text-green-700 dark:text-green-400 mb-2">You save with yearly</p>
                  <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                    {SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}{savings}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-4 font-medium">
                    💡 That&apos;s {savingsPercentage}% off over {monthsToCompare} {monthsToCompare === 1 ? 'month' : 'months'}!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Detailed Feature Comparison
          </h2>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20">Pro Monthly</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-900 dark:text-purple-100 bg-purple-50 dark:bg-purple-900/20">Pro Yearly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { feature: 'Custom Programs', free: '2 programs', monthly: 'Unlimited', yearly: 'Unlimited' },
                  { feature: 'Customizations/Month', free: '5 per month', monthly: 'Unlimited', yearly: 'Unlimited' },
                  { feature: 'AI Assistant Messages', free: '10 per day', monthly: 'Unlimited', yearly: 'Unlimited' },
                  { feature: 'Split Selection', free: 'Basic', monthly: 'Advanced', yearly: 'Advanced' },
                  { feature: 'Workout Templates', free: '1 per program', monthly: 'Full library', yearly: 'Full library' },
                  { feature: 'Exercise Database', free: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'Progress Tracking', free: 'Basic', monthly: 'Advanced', yearly: 'Advanced' },
                  { feature: 'Volume Analytics', free: 'Basic', monthly: 'Advanced', yearly: 'Advanced' },
                  { feature: 'Export to PDF', free: '✗', monthly: '✗', yearly: '✓' },
                  { feature: 'Priority Support', free: '✗', monthly: '✗', yearly: '✓' },
                  { feature: 'Conversation Memory', free: '✗', monthly: '✓', yearly: '✓' },
                  { feature: 'Advanced RAG', free: '✗', monthly: '✓', yearly: '✓' },
                  { feature: 'Early Access Features', free: '✗', monthly: '✓', yearly: '✓' },
                  { feature: 'Annual Training Report', free: '✗', monthly: '✗', yearly: '✓' },
                  { feature: 'Mobile App', free: '✓', monthly: '✓', yearly: '✓' }
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{row.feature}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300">
                      {row.free === '✓' ? <Check className="inline h-5 w-5 text-green-500" /> : 
                       row.free === '✗' ? <X className="inline h-5 w-5 text-gray-400" /> : 
                       row.free}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10">
                      {row.monthly === '✓' ? <Check className="inline h-5 w-5 text-green-500" /> : 
                       row.monthly === '✗' ? <X className="inline h-5 w-5 text-gray-400" /> : 
                       row.monthly}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/10">
                      {row.yearly === '✓' ? <Check className="inline h-5 w-5 text-green-500" /> : 
                       row.yearly === '✗' ? <X className="inline h-5 w-5 text-gray-400" /> : 
                       row.yearly}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison */}
          <div className="lg:hidden space-y-4">
            {[
              { 
                title: 'Free',
                badge: '$0',
                color: 'gray',
                features: ['2 programs', '5 customizations/month', '10 AI messages/day', 'Basic analytics']
              },
              { 
                title: 'Pro Monthly',
                badge: pricingData?.formattedMonthly || '$9/mo',
                color: 'blue',
                features: ['Unlimited programs', 'Unlimited customizations', 'Unlimited AI', 'Advanced analytics']
              },
              { 
                title: 'Pro Yearly',
                badge: pricingData ? `${SUPPORTED_CURRENCIES[selectedCurrency]?.symbol || '$'}${(pricingData.yearly / 12).toFixed(2)}/mo` : '$7.50/mo',
                color: 'purple',
                features: ['All Monthly features', `Save ${savingsPercentage}%`, 'PDF export', 'Priority support']
              }
            ].map((plan, index) => (
              <Card key={index} className={`border-2 border-${plan.color}-300 dark:border-${plan.color}-600`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <Badge variant="secondary">{plan.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section - Subscription Specific */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="faq-1" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I cancel my subscription anytime?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Yes! Both Pro plans have zero commitment. Cancel anytime from your account settings. Your access continues until the end of your billing period.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What happens to my programs if I downgrade to Free?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  All your programs remain saved! On the Free tier, you can access up to 2 programs. You can always upgrade back to Pro to regain access to all programs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Is there really a 7-day free trial?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Absolutely! Start a Pro trial (monthly or yearly) with full access for 7 days. No credit card required. Cancel before the trial ends to avoid charges.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I switch between monthly and yearly plans?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade from monthly to yearly anytime to get the savings. Downgrades from yearly to monthly take effect at the end of your current billing period.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Do I lose my progress if I cancel?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  No! Your workout history, progress data, and programs are always saved. You can pick up right where you left off if you resubscribe.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What&apos;s the difference between Pro Monthly and Pro Yearly?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Same features! Pro Yearly saves you {savingsPercentage}% (2 months free) and includes PDF export and priority support. Choose monthly for flexibility or yearly for savings.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I upgrade from Free to Pro?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Click any &quot;Start 7-Day Free Trial&quot; button or visit your account settings. Choose monthly or yearly billing and you&apos;re all set!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-8" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Are there student or team discounts?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  Not yet, but we&apos;re working on it! Email support@hypertroq.com with &quot;Student Discount&quot; or &quot;Team Plan&quot; in the subject line to join the waitlist.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: '7-Day Free Trial', desc: 'Try Pro risk-free with no credit card required' },
              { icon: Clock, title: 'Cancel Anytime', desc: 'No commitments, no penalties, no questions asked' },
              { icon: Lock, title: 'Secure Payments', desc: 'Powered by LemonSqueezy with bank-level encryption' },
              { icon: Target, title: 'Your Programs Stay', desc: 'All data saved, even if you cancel or downgrade' },
              { icon: Zap, title: 'Instant Access', desc: 'Start customizing programs immediately after signup' },
              { icon: Infinity, title: 'No Hidden Fees', desc: 'Clear pricing, no setup fees, no surprises' }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Level Up Your Training?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of lifters building science-based programs with AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/signup`}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                  Start 7-Day Free Trial
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/${locale}/programs`}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                  Explore Programs
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-100 mt-6">
              No credit card required for free tier • Cancel anytime
            </p>
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        {showStickyCTA && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-2xl">
            <div className="flex gap-2">
              <Link href={`/${locale}/signup`} className="flex-1">
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Crown className="mr-2 h-4 w-4" />
                  Try Pro Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// Add missing import for SUPPORTED_CURRENCIES
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
